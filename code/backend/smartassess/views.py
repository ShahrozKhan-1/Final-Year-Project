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
from rest_framework.generics import RetrieveAPIView
import docx 
import requests
import json
import random
from openai import OpenAI
import logging
from django.conf import settings
import asyncio
from utils.deepseek import evaluate_with_deepseek
import time
import aiohttp
import traceback



User = get_user_model()

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]
    

class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        email = request.data.get("email")
        password = request.data.get("password")

        user = User.objects.filter(email=email).first()

        if user and user.check_password(password):
            if user.role == "teacher" and not user.is_verified:
                return Response({"message": "Admin approval required"}, status=status.HTTP_403_FORBIDDEN)

            # Create the JWT with the role field
            refresh = RefreshToken.for_user(user)
            refresh.payload['role'] = user.role  # Add role to the token payload

            return Response({
                "refresh": str(refresh),
                "access": str(refresh.access_token),
                "user": {
                    "id": user.id,
                    "email": user.email,
                    "role": user.role,  # Send the role in the response as well
                    "is_verified": user.is_verified
                }
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
            return [{
                'question_type': 'QNA',
                'content': f'Explain {prompt[:30]}... (Q{i+1})',
                'difficulty': difficulty
            } for i in range(count)]

        # 🔥 FIX: Add `question_type` and `difficulty` to each generated QNA
        for q in generated:
            q['question_type'] = 'QNA'
        q['difficulty'] = difficulty

        return generated

    def query_deepseek(self, prompt, difficulty, question_type, count):
        """Call DeepSeek API to generate questions"""
        url = "https://openrouter.ai/api/v1/chat/completions"
        api_key = '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' # Replace with your actual key

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
                return Response({"error": "No questions provided"}, status=status.HTTP_400_BAD_REQUEST)

            if not test_id:
                return Response({"error": "Test ID is required"}, status=status.HTTP_400_BAD_REQUEST)

            updated_count = 0
            created_count = 0

            for item in questions:
                try:
                    question_type = item.get('question_type', 'MCQ').upper()
                    if question_type not in ['MCQ', 'QNA']:
                        continue  # skip invalid type

                    base_data = {
                        'content': item.get('content', ''),
                        'question_type': question_type,
                        'difficulty': item.get('difficulty', 'Medium'),
                    }

                    # Only add MCQ fields if type is MCQ
                    if question_type == 'MCQ':
                        base_data.update({
                            'option_a': item.get('option_a'),
                            'option_b': item.get('option_b'),
                            'option_c': item.get('option_c'),
                            'option_d': item.get('option_d'),
                            'correct_option': item.get('correct_option'),
                        })

                    if item.get('id'):
                        question = Question.objects.filter(
                            id=item['id'],
                            test_id=test_id,
                            teacher=request.user
                        ).first()

                        if question:
                            for field, value in base_data.items():
                                setattr(question, field, value)
                            question.save()
                            updated_count += 1
                        else:
                            Question.objects.create(
                                test_id=test_id,
                                teacher=request.user,
                                **base_data
                            )
                            created_count += 1
                    else:
                        Question.objects.create(
                            test_id=test_id,
                            teacher=request.user,
                            **base_data
                        )
                        created_count += 1

                except Exception as e:
                    continue  # optionally log `e`

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


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def enrolled_sessions_with_tests(request):
    student = request.user
    sessions = Session.objects.filter(enrolled_students=student).distinct()
    serializer = SessionWithTestsSerializer(sessions, many=True)
    return Response(serializer.data)

class SessionTestsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, session_id):
        try:
            session = Session.objects.get(id=session_id)

            # Check if student is enrolled in the session
            if request.user not in session.enrolled_students.all():
                return Response({"detail": "You are not enrolled in this session."}, status=status.HTTP_403_FORBIDDEN)

            tests = Test.objects.filter(session=session)
            serializer = TestSerializer(tests, many=True)
            return Response(serializer.data)

        except Session.DoesNotExist:
            return Response({"detail": "Session not found."}, status=status.HTTP_404_NOT_FOUND)
        

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_test_for_attempt(request, test_id):
    try:
        # Get test or return 404
        test = get_object_or_404(Test, id=test_id)
        user = request.user

        # Validate user role
        if user.role != 'student':
            return Response(
                {"error": "Only students can attempt tests"},
                status=status.HTTP_403_FORBIDDEN
            )

        # Check enrollment
        if not test.session.enrolled_students.filter(id=user.id).exists():
            return Response(
                {"error": "You are not enrolled in this session"},
                status=status.HTTP_403_FORBIDDEN
            )

        # Create or get test attempt
        attempt, created = TestAttempt.objects.get_or_create(
            test=test,
            student=user,
            is_submitted=False,
            defaults={'start_time': timezone.now()}
        )

        # Prepare response data
        response_data = {
            "test_id": test.id,
            "title": test.title,
            "time_limit_minutes": test.time_limit_minutes,
            "attempt_id": attempt.id,
            "questions": []
        }

        # Add questions
        for question in test.questions.all():
            question_data = {
                "id": question.id,
                "content": question.content,
                "question_type": question.question_type,
                "marks": 1  # Default value
            }

            if question.question_type == 'MCQ':
                question_data['options'] = {
                    'A': question.option_a,
                    'B': question.option_b,
                    'C': question.option_c,
                    'D': question.option_d,
                    'correct': question.correct_option
                }

            response_data['questions'].append(question_data)

        return Response(response_data)

    except Exception as e:
        logging.error(f"Error in get_test_for_attempt: {str(e)}", exc_info=True)
        return Response(
            {"error": "Internal server error"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


class SubmitTestView(APIView):
    def post(self, request, test_id, format=None):
        """
        Submit test answers and get detailed results
        Returns:
        - Detailed question-by-question results
        - Student answers vs correct answers
        - AI-generated improvement suggestions
        """
        try:
            # Check if test already submitted
            if TestAttempt.objects.filter(
                student=request.user,
                test_id=test_id,
                is_submitted=True
            ).exists():
                return Response(
                    {"error": "You have already submitted this test"},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Process and validate answers
            raw_answers = request.data.get('answers', {})
            answers = self.normalize_answers(raw_answers)
            
            validation_error = self.validate_answers(test_id, answers)
            if validation_error:
                return validation_error

            # Create or update attempt
            attempt = self.create_or_update_attempt(request.user, test_id)
            
            # Process and evaluate answers
            results = self.process_answers(attempt, answers)
            
            # Finalize attempt results
            self.finalize_attempt(attempt, results)
            
            # Generate detailed response
            response_data = self.generate_response_data(attempt, results)
            
            return Response(
                response_data,
                status=status.HTTP_201_CREATED
            )

        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def generate_response_data(self, attempt, results):
        """Generate comprehensive response with detailed results"""
        questions_data = []
        student_answers = StudentAnswer.objects.filter(attempt=attempt)
        
        for answer in student_answers:
            question = answer.question
            questions_data.append({
                "question_id": question.id,
                "content": question.content,
                "question_type": question.question_type,
                "student_answer": answer.answer_text,
                "correct_answer": question.correct_option if question.question_type == 'MCQ' else None,
                "is_correct": answer.is_correct,
                "feedback": answer.ai_feedback,
                "marks": question.marks,
                "marks_awarded": question.marks if answer.is_correct else 0
            })
        
        return {
            "attempt_id": attempt.id,
            "score": attempt.score,
            "correct_answers": attempt.correct_answers,
            "total_questions": attempt.total_questions,
            "content": question.content,
            "questions": questions_data,
            "suggested_topics": self.generate_ai_suggestions(attempt),
            "feedback": attempt.ai_feedback,
            "redirect_url": f"/student/test-result/{attempt.id}/"
        }

    def generate_ai_suggestions(self, attempt):
        """Generate AI-powered improvement suggestions"""
        try:
            # Get all incorrect answers
            incorrect_answers = StudentAnswer.objects.filter(
                attempt=attempt,
                is_correct=False
            ).select_related('question')
            
            if not incorrect_answers.exists():
                return []
            
            # Prepare context for AI analysis
            context = "\n".join(
                f"Question: {a.question.content}\n"
                f"Student Answer: {a.answer_text}\n"
                f"Correct Answer: {a.question.correct_option if a.question.question_type == 'MCQ' else 'N/A'}\n"
                for a in incorrect_answers
            )
            
            # Call DeepSeek AI API (implementation depends on your AI setup)
            ai_response = self.call_deepseek_ai(
                f"Analyze these test answers and suggest improvement topics:\n{context}"
            )
            
            # Parse AI response (example implementation)
            return self.parse_ai_suggestions(ai_response)
            
        except Exception as e:
            print(f"Error generating AI suggestions: {str(e)}")
            return []

    def call_deepseek_ai(self, prompt):
        """Call DeepSeek AI API (placeholder - implement according to your AI setup)"""
        # This is a placeholder - implement actual API call
        # Example implementation might use requests.post() to your AI endpoint
        return {
            "suggestions": [
                {
                    "topic": "React Components",
                    "reason": "Missed questions about component lifecycle",
                    "resources": ["React Docs - Components", "Video Tutorial #123"]
                }
            ]
        }

    def parse_ai_suggestions(self, ai_response):
        """Parse AI response into structured suggestions"""
        try:
            return [
                {
                    "topic": suggestion.get("topic", ""),
                    "reason": suggestion.get("reason", ""),
                    "resources": suggestion.get("resources", [])
                }
                for suggestion in ai_response.get("suggestions", [])
            ]
        except Exception as e:
            print(f"Error parsing AI suggestions: {str(e)}")
            return []

    # ... (keep all your existing methods: normalize_answers, validate_answers, 
    # create_or_update_attempt, process_answers, evaluate_answer, evaluate_qna_answer, 
    # finalize_attempt, generate_feedback)

    def evaluate_qna_answer(self, question, answer_text):
        """Enhanced QNA evaluation with AI feedback"""
        try:
            # Call DeepSeek AI for evaluation
            ai_response = self.call_deepseek_ai(
                f"Evaluate this answer for the question '{question.content}':\n"
                f"{answer_text}\n\n"
                f"Provide feedback and mark out of {question.marks}."
            )
            
            # Parse AI response (example implementation)
            return {
                'is_correct': ai_response.get('is_correct', False),
                'feedback': ai_response.get('feedback', 'No feedback provided'),
                'weak_topics': ai_response.get('weak_topics', []),
                'marks_awarded': ai_response.get('marks_awarded', 0)
            }
        except Exception as e:
            print(f"AI evaluation error: {str(e)}")
            return {
                'is_correct': False,
                'feedback': 'Could not evaluate answer',
                'weak_topics': [],
                'marks_awarded': 0
            }

class PracticeGenerateQuestionsView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        try:
            prompt_text = request.data.get('prompt_text', '')
            difficulty = request.data.get('difficulty', 'medium')
            file = request.FILES.get('file', None)
            mcq_count = int(request.data.get('mcq_count', 0))
            qna_count = int(request.data.get('qna_count', 0))

            if mcq_count + qna_count == 0:
                return Response(
                    {"error": "At least one question type must be requested"},
                    status=status.HTTP_400_BAD_REQUEST
                )

            if file:
                file_name = default_storage.save(file.name, file)
                file_path = default_storage.path(file_name)
                prompt_text = self.extract_text_from_file(file_path, file.name)

            generated_questions = []

            if mcq_count > 0:
                generated_questions.extend(self.generate_mcqs(prompt_text, difficulty, mcq_count))
            if qna_count > 0:
                generated_questions.extend(self.generate_qnas(prompt_text, difficulty, qna_count))

            return Response({"questions": generated_questions})
        
        except Exception as e:
            print(f"[PracticeGeneration Error]: {str(e)}")
            return Response({"error": str(e)}, status=500)

    def generate_mcqs(self, prompt, difficulty, count):
        questions = self.query_deepseek(prompt, difficulty, "mcq", count)
        return questions if questions else [{
            'question_type': 'MCQ',
            'content': f'Demo MCQ {i+1}',
            'option_a': 'Option A',
            'option_b': 'Option B',
            'option_c': 'Option C',
            'option_d': 'Option D',
            'correct_option': 'A',
            'difficulty': difficulty
        } for i in range(count)]

    def generate_qnas(self, prompt, difficulty, count):
        questions = self.query_deepseek(prompt, difficulty, "qna", count)
        for q in questions:
            q['question_type'] = 'QNA'
            q['difficulty'] = difficulty
        return questions

    def query_deepseek(self, prompt, difficulty, question_type, count):
        url = "https://openrouter.ai/api/v1/chat/completions"
        api_key = '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'

        instruction = {
            "mcq": (
                f"Generate {count} {difficulty} MCQs with 'content', 'option_a' to 'option_d', and 'correct_option'. "
                "Respond strictly as JSON: {\"questions\": [...]}"
            ),
            "qna": (
                f"Generate {count} {difficulty} open-ended questions. Respond as: "
                "{\"questions\": [{\"content\": \"...\"}]}"
            )
        }

        try:
            response = requests.post(
                url,
                headers={"Authorization": f"Bearer {api_key}"},
                json={
                    "model": "deepseek/deepseek-chat:free",
                    "messages": [{
                        "role": "user",
                        "content": f"{instruction[question_type]}\nBase it on:\n\"{prompt}\"\nReturn valid JSON."
                    }],
                    "response_format": {"type": "json_object"}
                }
            )
            response.raise_for_status()
            print(instruction)
            content = response.json()['choices'][0]['message']['content']
            print(f"Raw API Response: {content}")  # Debugging
            print(prompt)
            if content.startswith("```json"):
                content = content.split("```json")[1].split("```")[0].strip()
            return json.loads(content).get("questions", [])

        except Exception as e:
            print(f"[DeepSeek API Error]: {str(e)}")
            return []

    def extract_text_from_file(self, file_path, filename):
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


class PracticeCheckView(APIView):
    def post(self, request, *args, **kwargs):
        questions = request.data.get('questions', [])
        results = []
        mcq_score = 0
        total_mcq = 0

        # First pass: Process all questions and detect topics
        for question in questions:
            result = self.process_question(question)
            if result['question_type'] == 'MCQ':
                total_mcq += 1
                mcq_score += result['marks']
            results.append(result)

        # Enhanced topic analysis with concept mapping
        overall_feedback, suggested_topics = self.enhanced_topic_analysis(results)

        return Response({
            "score_breakdown": {
                "mcq": {
                    "correct": mcq_score,
                    "total": total_mcq,
                    "percentage": round((mcq_score / total_mcq * 100) if total_mcq > 0 else 0, 2)
                }
            },
            "results": results,
            "overall_feedback": overall_feedback,
            "suggested_topics": suggested_topics,
        })

    def process_question(self, question):
        """Process individual question with improved topic detection"""
        question_type = question.get('question_type', 'MCQ').upper()
        student_answer = str(question.get('student_answer', '')).strip().lower()
        correct_option = question.get('correct_option', '').lower()
        
        options = {
            'a': str(question.get('option_a', '')).strip().lower(),
            'b': str(question.get('option_b', '')).strip().lower(),
            'c': str(question.get('option_c', '')).strip().lower(),
            'd': str(question.get('option_d', '')).strip().lower()
        }
        
        correct_answer = options.get(correct_option, '')
        question_content = question.get('content', '')
        
        # Enhanced topic detection
        topic = question.get('topic') or self.detect_question_topic(question_content, correct_answer)
        
        result = {
            'question': question_content,
            'topic': topic,
            'question_type': question_type,
            'student_answer': student_answer,
            'correct_answer': correct_answer,
            'correct_option': correct_option,  # Add this to store the correct option key
            'options': options
        }

        if question_type == 'MCQ':
            # Compare with the option key (a/b/c/d) not the full answer text
            is_correct = student_answer == correct_option
            result.update({
                'is_correct': is_correct,
                'marks': 1 if is_correct else 0,
                'max_marks': 1,
                'feedback': "Correct" if is_correct else f"Incorrect. Correct answer: {correct_answer}"
            })

        return result

    def detect_question_topic(self, question_content, correct_answer):
        """Enhanced topic detection with concept mapping"""
        content_lower = question_content.lower()
        answer_lower = correct_answer.lower()
        
        # Topic mapping with prioritized checks
        topic_mapping = [
            # Data Structures
            (['fifo', 'lifo', 'stack', 'queue', 'heap', 'tree', 'graph', 'linked list', 'hash'], 'Data Structures'),
            
            # Algorithms
            (['sort', 'search', 'path', 'dijkstra', 'quick sort', 'merge sort', 'binary search', 'algorithm'], 'Algorithms'),
            
            # Time Complexity
            (['o(', 'complexity', 'big-o', 'runtime', 'time complexity'], 'Time Complexity'),
            
            # Computer Basics
            (['cpu', 'ram', 'hardware', 'operating system', 'computer'], 'Computer Basics'),
            
            # Programming
            (['python', 'java', 'function', 'loop', 'variable', 'program'], 'Programming'),
            
            # Specific concepts from answers
            (['dijkstra', 'bellman-ford'], 'Graph Algorithms'),
            (['quick sort', 'merge sort', 'bubble sort'], 'Sorting Algorithms'),
            (['binary search', 'linear search'], 'Search Algorithms')
        ]
        
        # Check for specific concepts first
        for keywords, topic in topic_mapping:
            if any(keyword in content_lower or keyword in answer_lower for keyword in keywords):
                return topic
        
        return 'General CS Concepts'

    def enhanced_topic_analysis(self, results):
        """Improved analysis with proper concept categorization"""
        if not results:
            return "No results to analyze", []
        
        # Organize by topic with concept tracking
        topic_stats = {}
        for result in results:
            topic = result.get('topic', 'General CS Concepts')
            if topic not in topic_stats:
                topic_stats[topic] = {
                    'correct': 0,
                    'total': 0,
                    'incorrect_concepts': set(),
                    'questions': []
                }
            
            topic_stats[topic]['total'] += 1
            if result.get('is_correct', False):
                topic_stats[topic]['correct'] += 1
            else:
                # Track specific incorrect concepts properly
                if result['correct_answer']:
                    self._track_concept(topic_stats[topic], result['correct_answer'])
            topic_stats[topic]['questions'].append(result)

        # Identify weak topics (accuracy < 65%) with minimum 2 questions
        weak_topics = [
            (topic, stats) for topic, stats in topic_stats.items()
            if stats['total'] >= 2 and (stats['correct'] / stats['total']) < 0.65
        ]

        # Sort by worst performance first
        weak_topics.sort(key=lambda x: x[1]['correct'] / x[1]['total'])

        # Generate detailed feedback
        feedback_lines = []
        suggested_topics = []
        
        for topic, stats in weak_topics[:3]:  # Limit to top 3 weakest
            accuracy = (stats['correct'] / stats['total']) * 100
            
            # Get properly categorized concepts
            concept_info = self._categorize_missed_concepts(topic, stats['incorrect_concepts'])
            
            feedback_lines.append(
                f"\n🚩 Weak Area: {topic} ({round(accuracy, 1)}% accuracy)\n"
                f"🔍 Problem areas: {concept_info['description']}\n"
                f"💡 Suggested focus: {concept_info['suggestion']}\n"
                f"📚 Resources: {concept_info['resources']}\n"
            )
            suggested_topics.append(topic)

        if not feedback_lines:
            feedback = "✅ Good overall performance! No major weak areas identified."
            suggestions = []
        else:
            feedback = "📊 Performance Analysis:" + "\n".join(feedback_lines)
            suggestions = suggested_topics

        return feedback, suggestions

    def _track_concept(self, topic_stats, correct_answer):
        """Properly track concepts by cleaning and categorizing them"""
        # Clean the answer
        cleaned = correct_answer.lower().strip()
        
        # Categorize different types of answers
        if cleaned.startswith('o(') or cleaned in ['o(1)', 'o(n)', 'o(n^2)', 'o(log n)']:
            topic_stats['incorrect_concepts'].add('Time Complexity Analysis')
        elif any(word in cleaned for word in ['sort', 'search', 'algorithm']):
            topic_stats['incorrect_concepts'].add(cleaned.split(' ')[0].title())
        elif cleaned.replace('-', ' ').replace('_', ' ') in ['queue', 'stack', 'heap', 'tree']:
            topic_stats['incorrect_concepts'].add(cleaned.title())
        else:
            topic_stats['incorrect_concepts'].add(cleaned)

    def _categorize_missed_concepts(self, topic, concepts):
        """Generate meaningful feedback based on concept types"""
        # Default values
        description = "Several key concepts"
        suggestion = f"Review core {topic} concepts"
        resources = "Standard course materials"
        
        if topic == 'Algorithms':
            algos = [c for c in concepts if not c.startswith('Time Complexity')]
            time_complexity = [c for c in concepts if c.startswith('Time Complexity')]
            
            if algos:
                description = f"Algorithms: {', '.join(algos[:3])}"
                suggestion = f"Practice implementing {algos[0]} with step-by-step tracing"
                resources = "GeeksforGeeks algorithm visualizations"
            if time_complexity:
                description += ("; " if algos else "") + "Complexity analysis"
                suggestion += (" and " if algos else "") + "study time complexity calculations"
                
        elif topic == 'Data Structures':
            ds = [c for c in concepts if c.lower() in ['queue', 'stack', 'heap', 'tree']]
            if ds:
                description = f"Data structures: {', '.join(ds)}"
                suggestion = f"Implement {ds[0]} operations from scratch"
                resources = "VisuAlgo data structure visualizations"
        
        return {
            'description': description,
            'suggestion': suggestion,
            'resources': resources
        }
    
class TestResultView(APIView):
    def get(self, request, attempt_id, format=None):
        try:
            attempt = TestAttempt.objects.get(id=attempt_id)
            
            # Verify the requesting user owns this attempt
            if attempt.student != request.user:
                return Response(
                    {"error": "Unauthorized access"},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            return Response({
                "score": attempt.score,
                "correct_answers": attempt.correct_answers,
                "total_questions": attempt.total_questions,
                "feedback": attempt.ai_feedback,
                "suggested_topics": attempt.suggested_topics or []
            })
            
        except TestAttempt.DoesNotExist:
            return Response(
                {"error": "Test results not found"},
                status=status.HTTP_404_NOT_FOUND
            )
            


class TestResultEvaluator(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, attempt_id):
        attempt = get_object_or_404(TestAttempt, id=attempt_id, student=request.user)
        answers = attempt.answers.select_related("question").all()

        total = answers.count()
        correct = 0
        topic_set = set()
        result_list = []

        for answer in answers:
            question = answer.question
            student_response = answer.answer_text.strip()
            is_correct = False
            ai_feedback = None
            suggested_topic = None

            # Prepare prompt for DeepSeek (MCQ + QNA)
            if question.question_type == "MCQ":
                prompt = f"""
You are an AI teacher. Evaluate the following MCQ and check if the student's answer is correct.

Question: {question.content}
Options:
A. {question.option_a}
B. {question.option_b}
C. {question.option_c}
D. {question.option_d}

Correct Option: {question.correct_option}
Student Answer: {student_response}

Respond in JSON format like:
{{
  "is_correct": true,
  "feedback": "Well done!",
  "suggested_topic": null
}}
"""
            else:
                prompt = f"""
You are an AI teacher grading a student's written answer.

Question: {question.content}
Student Answer: {student_response}

Respond in JSON format like:
{{
  "is_correct": true,
  "feedback": "You mentioned the right points but missed the explanation about X.",
  "suggested_topic": "X"
}}
"""

            # Evaluate via DeepSeek
            result = evaluate_with_deepseek(prompt)

            try:
                parsed = json.loads(result['choices'][0]['message']['content'])
                is_correct = parsed.get("is_correct", False)
                ai_feedback = parsed.get("feedback", "No feedback")
                suggested_topic = parsed.get("suggested_topic")
                if suggested_topic:
                    topic_set.add(suggested_topic)
            except Exception as e:
                is_correct = False
                ai_feedback = "AI evaluation failed."
                suggested_topic = None
                print("Parsing error:", e)

            # Save to DB
            answer.is_correct = is_correct
            answer.ai_feedback = ai_feedback
            answer.suggested_topics = [suggested_topic] if suggested_topic else []
            answer.save()

            if is_correct:
                correct += 1

            result_list.append({
                "question_id": question.id,
                "question": question.content,
                "question_type": question.question_type,
                "student_answer": student_response,
                "correct_option": question.correct_option if question.question_type == "MCQ" else None,
                "is_correct": is_correct,
                "feedback": ai_feedback,
                "suggested_topic": suggested_topic
            })

        # Final attempt stats
        score = round((correct / total) * 100, 2)
        attempt.score = score
        attempt.correct_answers = correct
        attempt.total_questions = total
        attempt.ai_feedback = f"You scored {score}%. Recommended focus: {', '.join(topic_set) if topic_set else 'None'}"
        attempt.suggested_topics = list(topic_set)
        attempt.is_submitted = True
        attempt.save()

        return Response({
            "score": score,
            "correct_answers": correct,
            "total_questions": total,
            "feedback": attempt.ai_feedback,
            "suggested_topics": list(topic_set),
            "questions": result_list
        })
