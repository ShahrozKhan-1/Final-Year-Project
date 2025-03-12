from django.shortcuts import render
from .models import * 
from .serializers import *
from rest_framework.decorators import api_view, permission_classes, APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from rest_framework import status, generics, permissions
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth import authenticate
from rest_framework.permissions import IsAuthenticated
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth import get_user_model


User = get_user_model()

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]
    
class LoginView(generics.GenericAPIView):
    permission_classes = [AllowAny] 

    def post(self, request, *args, **kwargs):
        email = request.data.get("email")
        password = request.data.get("password")

        user = User.objects.filter(email=email).first()

        if user and user.check_password(password):
            if user.role == "teacher" and not user.is_verified:
                return Response({"message": "Admin approval required"}, status=status.HTTP_403_FORBIDDEN)

            refresh = RefreshToken.for_user(user)
            return Response({
                "refresh": str(refresh),
                "access": str(refresh.access_token),
                "user": {"id": user.id, "email": user.email, "role": user.role, "is_verified": user.is_verified}
            })

        return Response({"error": "Invalid credentials"}, status=status.HTTP_401_UNAUTHORIZED)

class ApproveTeacherView(generics.UpdateAPIView):
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    def patch(self, request, *args, **kwargs):
        # Ensure only admin users can approve teachers
        if request.user.role != "admin":
            return Response({"error": "Unauthorized"}, status=status.HTTP_403_FORBIDDEN)

        teacher_id = kwargs.get("teacher_id")
        teacher = User.objects.filter(id=teacher_id, role="teacher", is_verified=False).first()

        if not teacher:
            return Response({"error": "Teacher not found or already verified"}, status=status.HTTP_404_NOT_FOUND)

        teacher.is_verified = True
        teacher.save()
        return Response({"message": "Teacher approved successfully"})

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_unverified_teachers(request):
    print("Headers Received:", request.headers)  # Debugging
    if request.user.role != "admin":
        return Response({"error": "Unauthorized"}, status=status.HTTP_403_FORBIDDEN)

    teachers = User.objects.filter(role="teacher", is_verified=False)
    data = [{"id": teacher.id, "email": teacher.email} for teacher in teachers]
    return Response(data, status=status.HTTP_200_OK)


class CreateSessionView(generics.CreateAPIView):
    serializer_class = SessionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        if self.request.user.role != "teacher":
            raise serializers.ValidationError("Only teachers can create sessions.")
        serializer.save(teacher=self.request.user)

# Endpoint to list all sessions (for enrollment)
class ListSessionsView(generics.ListAPIView):
    serializer_class = SessionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Session.objects.all()

# Endpoint for students to enroll in a session
class EnrollSessionView(generics.UpdateAPIView):
    serializer_class = SessionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def update(self, request, *args, **kwargs):
        session = self.get_object()
        if request.user.role != "student":
            return Response({"error": "Only students can enroll in sessions."}, status=status.HTTP_403_FORBIDDEN)
        session.enrolled_students.add(request.user)
        return Response({"message": "Enrolled successfully."}, status=status.HTTP_200_OK)
    
    def get_queryset(self):
        return Session.objects.all()