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
from rest_framework.permissions import BasePermission
from django.shortcuts import get_object_or_404
from rest_framework.parsers import MultiPartParser, FormParser
from django.core.files.storage import default_storage
import fitz  # PyMuPDF for PDF
import docx 
import requests
import json
import random
from openai import OpenAI


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

class IsAdminUser(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == "admin"

class ApproveTeacherView(APIView):
    permission_classes = [IsAdminUser]

    def patch(self, request, teacher_id):
        teacher = get_object_or_404(User, id=teacher_id, role="teacher")
        teacher.is_verified = True
        teacher.save()
        return Response({"message": "Teacher approved successfully"}, status=status.HTTP_200_OK)

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
    
class RequestEnrollmentView(generics.UpdateAPIView):
    serializer_class = SessionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def update(self, request, *args, **kwargs):
        session = self.get_object()
        if request.user.role != "student":
            return Response({"error": "Only students can request enrollment."}, status=status.HTTP_403_FORBIDDEN)
        if request.user in session.pending_students.all():
            return Response({"error": "Already requested enrollment."}, status=status.HTTP_400_BAD_REQUEST)
        session.pending_students.add(request.user)
        return Response({"message": "Enrollment request sent."}, status=status.HTTP_200_OK)

    def get_queryset(self):
        return Session.objects.all()
    

class ManageEnrollmentsView(generics.UpdateAPIView):
    serializer_class = SessionSerializer
    permission_classes = [permissions.IsAuthenticated]
    queryset = Session.objects.all()
    lookup_field = 'pk'  # <-- Add this line!

    def update(self, request, *args, **kwargs):
        session = self.get_object()

        if request.user.role != "teacher":
            return Response({"error": "Only verified teachers can manage enrollments."}, status=status.HTTP_403_FORBIDDEN)
        
        student_id = request.data.get("student_id")
        action = request.data.get("action")

        student = session.pending_students.filter(id=student_id).first()
        if not student:
            return Response({"error": "Student not found in pending list."}, status=status.HTTP_404_NOT_FOUND)

        if action == "approve":
            session.pending_students.remove(student)
            session.enrolled_students.add(student)
            return Response({"message": "Student approved."}, status=status.HTTP_200_OK)
        elif action == "reject":
            session.pending_students.remove(student)
            return Response({"message": "Student rejected."}, status=status.HTTP_200_OK)
        else:
            return Response({"error": "Invalid action."}, status=status.HTTP_400_BAD_REQUEST)

class TeacherSessionsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        print("User:", request.user)
        print("User type:", type(request.user))
        print("Role:", getattr(request.user, 'role', 'No role'))

        if getattr(request.user, 'role', None) != "teacher":
            return Response({"error": "Only teachers can access their sessions."}, status=403)

        sessions = Session.objects.filter(teacher=request.user)
        serializer = SessionSerializer(sessions, many=True)
        return Response(serializer.data)

# views.py
class CreateTestView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, session_id):
        if request.user.role != "teacher":
            return Response({"error": "Only teachers can create tests."}, status=403)

        try:
            session = Session.objects.get(id=session_id, teacher=request.user)
        except Session.DoesNotExist:
            return Response({"error": "Session not found or not owned by you."}, status=404)

        data = request.data.copy()
        data['teacher'] = request.user.id
        data['session'] = session.id

        serializer = TestSerializer(data=data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=201)
        return Response(serializer.errors, status=400)


class GenerateQuestionsView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        print("\n=== Received request ===")
        print("Headers:", request.headers)
        print("Data:", request.data)
        print("Files:", bool(request.FILES.get('file')))
        
        try:
            prompt_text = request.data.get('prompt_text', '')
            mode = request.data.get('mode', '')
            difficulty = request.data.get('difficulty', 'medium')
            file = request.FILES.get('file', None)
            test_id = request.data.get('test_id')
            mcq_count = int(request.data.get('mcq_count', 0))
            qna_count = int(request.data.get('qna_count', 0))

            print(f"Generating {mcq_count} MCQs and {qna_count} QNAs")
        except (ValueError, TypeError):
            return Response({
                "questions": generated_questions,
                "message": "Questions generated successfully"
            })
        except Exception as e:
            print(f"Error in GenerateQuestionsView: {str(e)}")
            return Response(
                {"error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        # Validate at least one question type requested
        if mcq_count + qna_count == 0:
            return Response(
                {"error": "At least one question type must be requested"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Handle file upload if present
        if file:
            try:
                file_name = default_storage.save(file.name, file)
                file_path = default_storage.path(file_name)
                prompt_text = self.extract_text_from_file(file_path, file.name)
            except Exception as e:
                return Response(
                    {"error": f"File processing error: {str(e)}"},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )

        # Generate questions
        generated_questions = []
        
        if mcq_count > 0:
            mcqs = self.generate_mcqs(prompt_text, difficulty, mcq_count)
            if not mcqs:
                return Response(
                    {"error": "Failed to generate MCQs"},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
            generated_questions.extend(mcqs)

        if qna_count > 0:
            qnas = self.generate_qnas(prompt_text, difficulty, qna_count)
            if not qnas:
                return Response(
                    {"error": "Failed to generate QNAs"},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
            generated_questions.extend(qnas)

        # Save to database in teacher mode
        if mode == "teacher":
            if not test_id:
                return Response(
                    {"error": "Test ID is required for teacher mode"},
                    status=status.HTTP_400_BAD_REQUEST
                )

            try:
                test = Test.objects.get(id=test_id, teacher=request.user)
                for question in generated_questions:
                    Question.objects.create(
                        test=test,
                        teacher=request.user,
                        **question
                    )
            except Test.DoesNotExist:
                return Response(
                    {"error": "Invalid test ID or you are not the owner"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            except Exception as e:
                return Response(
                    {"error": f"Database error: {str(e)}"},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )

        return Response({"questions": generated_questions})

    def generate_mcqs(self, prompt, difficulty, count):
        """Generate multiple choice questions"""
        generated = self.query_deepseek(prompt, difficulty, "mcq", count)
        if not generated:
            # Fallback if API fails
            return [{
                'question_type': 'MCQ',
                'content': f'Sample MCQ {i+1} about {prompt[:20]}...',
                'option_a': f'Option A for Q{i+1}',
                'option_b': f'Option B for Q{i+1}',
                'option_c': f'Option C for Q{i+1}',
                'option_d': f'Option D for Q{i+1}',
                'correct_option': random.choice(['A','B','C','D']),
                'difficulty': difficulty
            } for i in range(count)]
        return generated

    def generate_qnas(self, prompt, difficulty, count):
        """Generate open-ended questions"""
        generated = self.query_deepseek(prompt, difficulty, "qna", count)
        if not generated:
            # Fallback if API fails
            return [{
                'question_type': 'QNA',
                'content': f'Explain {prompt[:30]}... (Q{i+1})',
                'difficulty': difficulty
            } for i in range(count)]
        return generated

    def query_deepseek(self, prompt, difficulty, question_type, count):
        """Call DeepSeek API to generate questions"""
        url = "https://openrouter.ai/api/v1/chat/completions"
        api_key = "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"  # Replace with your actual key

        instructions = {
            "mcq": (
                "You are to generate {count} {difficulty} multiple-choice questions (MCQs). "
                "Each question should include:\n"
                "- 'content': the question text\n"
                "- 'option_a', 'option_b', 'option_c', 'option_d': the answer choices\n"
                "- 'correct_option': one of 'A', 'B', 'C', or 'D' (the correct answer)\n"
                "Format the output strictly as JSON in this structure:\n"
                '{{ "questions": [ {{ "content": "...", "option_a": "...", "option_b": "...", '
                '"option_c": "...", "option_d": "...", "correct_option": "A" }} ] }}'
            ),
            "qna": (
                "You are to generate {count} {difficulty} open-ended questions. "
                "Return only the question texts as JSON in this format:\n"
                '{{ "questions": [ {{ "content": "..." }} ] }}'
            )
        }


        messages = [{
            "role": "user",
            "content": instructions[question_type].format(
                count=count,
                difficulty=difficulty
            ) + f"\n\nBase the questions on this content:\n\"{prompt}\"\n\nReturn only valid JSON."
        }]


        try:
            response = requests.post(
                url,
                headers={"Authorization": f"Bearer {api_key}"},
                json={
                    "model": "deepseek/deepseek-chat:free",
                    "messages": messages,
                    "response_format": {"type": "json_object"}
                },
                # timeout=20
            )
            response.raise_for_status()
            
            content = response.json()['choices'][0]['message']['content']
            if content.startswith('```json'):
                content = content.split('```json')[1].split('```')[0].strip()
            
            data = json.loads(content)
            return data.get('questions', [])
            
        except Exception as e:
            print(f"API Error: {str(e)}")
            return []
        
    def parse_text_mcqs(self, text):
        """Convert text format MCQs to structured format"""
        questions = []
        current_question = {}

        for line in text.split('\n'):
            line = line.strip()
            if not line:
                continue
                
            if line.endswith('...'):  # Question line
                if current_question:
                    questions.append(current_question)
                current_question = {
                    'content': line,
                    'option_a': '',
                    'option_b': '',
                    'option_c': '',
                    'option_d': '',
                    'correct_option': 'A'  # Default
                }
            elif line.startswith('A:'):
                current_question['option_a'] = line[2:].strip()
            elif line.startswith('B:'):
                current_question['option_b'] = line[2:].strip()
            elif line.startswith('C:'):
                current_question['option_c'] = line[2:].strip()
            elif line.startswith('D:'):
                current_question['option_d'] = line[2:].strip()

        if current_question:
            questions.append(current_question)
            
        return questions

    def extract_text_from_file(self, file_path, filename):
        """Extract text from uploaded file"""
        if filename.endswith(".pdf"):
            text = ""
            with fitz.open(file_path) as doc:
                for page in doc:
                    text += page.get_text()
            return text
        elif filename.endswith(".docx"):
            doc = docx.Document(file_path)
            return "\n".join([para.text for para in doc.paragraphs])
        elif filename.endswith(".txt"):
            with open(file_path, 'r', encoding='utf-8') as f:
                return f.read()
        else:
            raise ValueError("Unsupported file format")


class SaveQuizView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            questions = request.data.get("questions", [])
            test_id = request.data.get("test_id")
            
            if not questions:
                return Response(
                    {"error": "No questions provided"}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            if not test_id:
                return Response(
                    {"error": "Test ID is required"},
                    status=status.HTTP_400_BAD_REQUEST
                )

            updated_count = 0
            created_count = 0
            
            for item in questions:
                try:
                    if item.get('id'):
                        question = Question.objects.filter(
                            id=item.get('id'),
                            test_id=test_id,
                            teacher=request.user
                        ).first()
                        
                        if question:
                            question.content = item.get('content', '')
                            question.option_a = item.get('option_a', '')
                            question.option_b = item.get('option_b', '')
                            question.option_c = item.get('option_c', '')
                            question.option_d = item.get('option_d', '')
                            question.correct_option = item.get('correct_option', 'A')
                            question.save()
                            updated_count += 1
                        else:
                            Question.objects.create(
                                test_id=test_id,
                                teacher=request.user,
                                **{k: v for k, v in item.items() if k != 'id'}
                            )
                            created_count += 1
                    else:
                        Question.objects.create(
                            test_id=test_id,
                            teacher=request.user,
                            **item
                        )
                        created_count += 1
                        
                except Exception:
                    continue

            return Response({
                "message": f"Successfully processed {updated_count + created_count} questions",
                "updated": updated_count,
                "created": created_count,
            }, status=status.HTTP_200_OK)

        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
            
# views.py
class SetTimeLimitView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, test_id):
        test = get_object_or_404(Test, id=test_id, teacher=request.user)
        time_limit = request.data.get("time_limit_minutes")
        
        if not time_limit or time_limit <= 0:
            return Response({"error": "Invalid time limit"}, status=400)
        
        test.time_limit_minutes = time_limit
        test.save()
        return Response({"message": f"Time limit set to {time_limit} minutes"})
    
class EnrolledSessionsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # Grab all Session objects where the current user is enrolled
        sessions = request.user.enrolled_sessions.all()
        serializer = SessionSerializer(sessions, many=True)
        return Response(serializer.data, status=200)
