from django.shortcuts import render
from .models import * 
from .serializers import *
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth import authenticate


@api_view(["POST"])
@permission_classes([AllowAny])
def register(request):
    # Convert string "true"/"false" to actual Boolean values
    request.data["is_student"] = str(request.data.get("is_student", "false")).lower() == "true"
    request.data["is_teacher"] = str(request.data.get("is_teacher", "false")).lower() == "true"

    serializer = UserSerializer(data=request.data)
    
    if serializer.is_valid():
        user = serializer.save()
        refresh = RefreshToken.for_user(user)
        return Response({
            "refresh": str(refresh),
            "access": str(refresh.access_token),
            "message": "User registered successfully!"
        }, status=status.HTTP_201_CREATED)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class MyTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        email = attrs.get("email")  # Get email from request
        password = attrs.get("password")  

        if not email or not password:
            raise serializers.ValidationError("Both email and password are required.")

        user = authenticate(email=email, password=password)  # Authenticate using email

        if not user:
            raise serializers.ValidationError("Invalid email or password.")

        refresh = self.get_token(user)
        return {
            "refresh": str(refresh),
            "access": str(refresh.access_token),
            "user": {
                "id": user.id,
                "email": user.email,
                "username": user.username,  # Return username for frontend use
                "is_student": user.is_student,
                "is_teacher": user.is_teacher,
            }
        }

class MyTokenObtainPairView(TokenObtainPairView):
    serializer_class = MyTokenObtainPairSerializer