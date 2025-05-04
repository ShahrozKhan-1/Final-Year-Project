from django.shortcuts import render
from django.conf import settings
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
from bs4 import BeautifulSoup
import yt_dlp
from django.core.files.storage import default_storage
import fitz  # PyMuPDF for PDF
from rest_framework.generics import RetrieveAPIView
import docx 
import requests
import json
import re
import random
from openai import OpenAI
import logging
import asyncio
from utils.deepseek import evaluate_with_deepseek
from django.db import transaction
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
        try:
            # Parse and validate input
            prompt = request.data.get('prompt_text', '')
            mode = request.data.get('mode', '')
            difficulty = request.data.get('difficulty', 'medium')
            file = request.FILES.get('file', None)
            test_id = request.data.get('test_id')
            mcq_count = min(int(request.data.get('mcq_count', 0)), 20)
            qna_count = min(int(request.data.get('qna_count', 0)), 20)

            if mcq_count + qna_count == 0:
                return Response(
                    {"error": "At least one question type must be requested"},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Process input (text, file, or URL)
            if file:
                prompt = self.process_file(file)
            elif prompt.startswith(('http://', 'https://')):
                prompt = self.process_url(prompt)

            # Generate questions
            questions = self.generate_questions(prompt, difficulty, mcq_count, qna_count)
            
            # Save to database if in teacher mode
            if mode == "teacher" and test_id:
                self.save_questions(test_id, request.user, questions)

            return Response({
                "questions": questions,
                "message": f"Generated {len(questions)} questions successfully"
            })

        except ValueError as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def process_file(self, file):
        """Process uploaded file"""
        file_name = default_storage.save(file.name, file)
        file_path = default_storage.path(file_name)
        
        try:
            if file.name.endswith(".pdf"):
                with fitz.open(file_path) as doc:
                    return " ".join(page.get_text() for page in doc)
            elif file.name.endswith(".docx"):
                doc = docx.Document(file_path)
                return " ".join(para.text for para in doc.paragraphs)
            elif file.name.endswith(".txt"):
                with open(file_path, 'r', encoding='utf-8') as f:
                    return f.read()
            else:
                raise ValueError("Unsupported file format")
        finally:
            default_storage.delete(file_name)

    def process_url(self, url):
        """Process URL (YouTube or webpage)"""
        if 'youtube.com' in url or 'youtu.be' in url:
            return self.process_youtube(url)
        return self.process_webpage(url)

    def process_youtube(self, url):
        """Extract YouTube video transcript"""
        try:
            ydl_opts = {
                'quiet': True,
                'skip_download': True,
                'writesubtitles': True,
                'subtitleslangs': ['en'],
                'subtitlesformat': 'vtt'
            }
            
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                info = ydl.extract_info(url, download=False)
                if 'subtitles' in info and info['subtitles']:
                    return '\n'.join(sub['data'] for sub in info['subtitles'].get('en', []))
                return info.get('description', '') + ' ' + info.get('title', '')
        except Exception as e:
            raise ValueError(f"Couldn't process YouTube video: {str(e)}")

    def process_webpage(self, url):
        """Extract main content from webpage"""
        try:
            headers = {'User-Agent': 'Mozilla/5.0'}
            response = requests.get(url, headers=headers, timeout=10)
            soup = BeautifulSoup(response.text, 'html.parser')
            
            # Remove unwanted elements
            for element in soup(['script', 'style', 'nav', 'footer']):
                element.decompose()
                
            return ' '.join(soup.stripped_strings)
        except Exception as e:
            raise ValueError(f"Couldn't process webpage: {str(e)}")

    def generate_questions(self, prompt, difficulty, mcq_count, qna_count):
        """Generate questions in optimized batch"""
        if mcq_count + qna_count == 0:
            return []
        
        # Try batch generation first
        try:
            batch_response = self.generate_batch(prompt, difficulty, mcq_count, qna_count)
            if batch_response:
                return batch_response
        except Exception as e:
            print(f"Batch generation failed: {str(e)}")
        
        # Fallback to sequential if batch fails
        questions = []
        if mcq_count > 0:
            questions.extend(self.generate_mcqs(prompt, difficulty, mcq_count))
        if qna_count > 0:
            questions.extend(self.generate_qnas(prompt, difficulty, qna_count))
        return questions

    def generate_batch(self, prompt, difficulty, mcq_count, qna_count):
        """Generate all questions in one API call"""
        prompt_template = f"""Generate a quiz with these requirements:
- Topic: {prompt}
- Difficulty: {difficulty}
- {mcq_count} MCQs (with 4 options each and correct answer)
- {qna_count} open-ended questions

Return STRICT JSON format:
{{
    "mcqs": [{{"content": "...", "option_a": "...", "option_b": "...", 
              "option_c": "...", "option_d": "...", "correct_option": "A"}}],
    "qnas": [{{"content": "..."}}]
}}"""
        
        response = evaluate_with_deepseek(prompt_template)
        if not response:
            return None
            
        # Clean and parse response
        content = response.strip()
        if content.startswith('```json'):
            content = content[7:-3].strip()
        elif content.startswith('```'):
            content = content[3:-3].strip()
            
        data = json.loads(content)
        
        # Format questions
        questions = []
        for mcq in data.get('mcqs', [])[:mcq_count]:
            mcq.update({
                'question_type': 'MCQ',
                'difficulty': difficulty
            })
            questions.append(mcq)
            
        for qna in data.get('qnas', [])[:qna_count]:
            qna.update({
                'question_type': 'QNA',
                'difficulty': difficulty
            })
            questions.append(qna)
            
        return questions

    def generate_mcqs(self, prompt, difficulty, count):
        """Generate multiple choice questions"""
        prompt_template = f"""Generate {count} {difficulty} MCQs about:
{prompt}

For each provide:
1. Question text
2. 4 options (A-D)
3. Correct answer

Return STRICT JSON format:
{{
    "questions": [
        {{
            "content": "...",
            "option_a": "...",
            "option_b": "...",
            "option_c": "...",
            "option_d": "...",
            "correct_option": "A"
        }}
    ]
}}"""
        
        response = evaluate_with_deepseek(prompt_template)
        if not response:
            return self.fallback_mcqs(prompt, difficulty, count)
            
        try:
            data = json.loads(response.strip().strip('```').strip())
            return [{
                **q,
                'question_type': 'MCQ',
                'difficulty': difficulty
            } for q in data.get('questions', [])]
        except Exception:
            return self.fallback_mcqs(prompt, difficulty, count)

    def generate_qnas(self, prompt, difficulty, count):
        """Generate open-ended questions"""
        prompt_template = f"""Generate {count} {difficulty} open-ended questions about:
{prompt}

Return STRICT JSON format:
{{
    "questions": [
        {{"content": "..."}}
    ]
}}"""
        
        response = evaluate_with_deepseek(prompt_template)
        if not response:
            return self.fallback_qnas(prompt, difficulty, count)
            
        try:
            data = json.loads(response.strip().strip('```').strip())
            return [{
                'content': q['content'],
                'question_type': 'QNA',
                'difficulty': difficulty
            } for q in data.get('questions', [])]
        except Exception:
            return self.fallback_qnas(prompt, difficulty, count)

    def fallback_mcqs(self, prompt, difficulty, count):
        """Fallback MCQ generation"""
        return [{
            'question_type': 'MCQ',
            'content': f'MCQ about {prompt[:50]} (Q{i+1})',
            'option_a': f'Option A for Q{i+1}',
            'option_b': f'Option B for Q{i+1}',
            'option_c': f'Option C for Q{i+1}',
            'option_d': f'Option D for Q{i+1}',
            'correct_option': random.choice(['A','B','C','D']),
            'difficulty': difficulty
        } for i in range(count)]

    def fallback_qnas(self, prompt, difficulty, count):
        """Fallback QNA generation"""
        return [{
            'question_type': 'QNA',
            'content': f'Explain {prompt[:50]} (Q{i+1})',
            'difficulty': difficulty
        } for i in range(count)]

    def save_questions(self, test_id, teacher, questions):
        """Save questions to database"""
        try:
            test = Test.objects.get(id=test_id, teacher=teacher)
            Question.objects.bulk_create([
                Question(
                    test=test,
                    teacher=teacher,
                    **question
                ) for question in questions
            ])
        except Test.DoesNotExist:
            raise ValueError("Invalid test ID or you are not the owner")
        except Exception as e:
            raise Exception(f"Failed to save questions: {str(e)}")

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
    permission_classes = [IsAuthenticated]

    def post(self, request, test_id, format=None):
        try:
            print("Received data:", request.data)
            attempt = self._get_or_create_attempt(request.user, test_id)

            if attempt.is_submitted:
                return Response(
                    {"error": "You have already submitted this test."},
                    status=status.HTTP_400_BAD_REQUEST
                )

            answers = self._normalize_answers(request.data.get("answers", {}))
            if not answers:
                return Response({"error": "No answers provided."}, status=400)

            evaluation = self._evaluate_answers(answers, attempt)
            self._finalize_attempt(attempt, evaluation)

            return Response(self._format_results(attempt, evaluation), status=201)

        except Exception as e:
            print("Error in SubmitTestView:", str(e))
            return Response({"error": str(e)}, status=500)

    def _normalize_answers(self, answers):
        if isinstance(answers, list):
            return {str(ans.get('question_id')): ans.get('answer') for ans in answers if 'question_id' in ans and 'answer' in ans}
        elif isinstance(answers, dict):
            return {str(k): v for k, v in answers.items()}
        return {}

    def _get_or_create_attempt(self, user, test_id):
        test = get_object_or_404(Test, pk=test_id)
        total_questions = test.questions.count()
        attempt, _ = TestAttempt.objects.get_or_create(
            student=user,
            test_id=test_id,
            defaults={
                'start_time': timezone.now(),
                'is_submitted': False,
                'total_questions': total_questions
            }
        )
        return attempt

    def _evaluate_answers(self, answers, attempt):
        question_ids = [int(qid) for qid in answers.keys()]
        questions = Question.objects.filter(id__in=question_ids, test_id=attempt.test_id).in_bulk(field_name='id')

        evaluation_data = []
        for qid in question_ids:
            if qid not in questions:
                raise ValueError(f"Invalid question ID: {qid}")
            question = questions[qid]
            student_answer = answers[str(qid)]
            evaluation_data.append({
                'question_id': qid,
                'content': question.content,
                'student_answer': student_answer,
                'type': question.question_type,
                'correct_option': question.correct_option,
            })

        evaluations = self._evaluate_with_ai(evaluation_data)

        correct_count = 0
        weak_topics = set()
        question_results = []

        for eval in evaluations:
            qid = int(eval['question_id'])
            question = questions[qid]

            is_correct = eval.get('is_correct', False)
            feedback = eval.get('feedback', "")
            weak_topics.update(eval.get('weak_topics', []))
            model_answer = eval.get('model_answer')

            if is_correct:
                correct_count += 1

            StudentAnswer.objects.update_or_create(
                attempt=attempt,
                question=question,
                defaults={
                    'answer_text': answers[str(qid)],
                    'is_correct': is_correct,
                    'ai_feedback': feedback,
                    'suggested_topics': ", ".join(eval.get('weak_topics', [])) if eval.get('weak_topics') else None
                }
            )

            question_results.append({
                'question_id': qid,
                'student_answer': answers[str(qid)],
                'is_correct': is_correct,
                'feedback': feedback,
                'model_answer': model_answer
            })

        score = round((correct_count / len(questions)) * 100, 2) if questions else 0.0
        return {
            'score': score,
            'correct_count': correct_count,
            'total_questions': len(questions),
            'weak_topics': list(weak_topics),
            'question_results': question_results
        }

    def _evaluate_with_ai(self, evaluation_data):
        if not evaluation_data:
            raise ValueError("No data to evaluate")

        prompt = """Evaluate all test answers and provide corrections where needed.
For MCQs, indicate if the answer is correct. If incorrect, specify the correct option.
For QNAs, provide brief feedback on accuracy and suggested improvements.

Return JSON:
{
    "evaluations": [
        {
            "question_id": "id",
            "is_correct": boolean,
            "feedback": "string",
            "weak_topics": ["list"],
            "model_answer": "string" (for QNAs only)
        }
    ]
}

Questions:\n""" + json.dumps(evaluation_data, indent=2)

        try:
            ai_response = evaluate_with_deepseek(prompt)
            if not ai_response:
                raise ValueError("Empty AI response")
            ai_response = ai_response.strip()
            if ai_response.startswith('```json'):
                ai_response = ai_response[7:-3].strip()
            elif ai_response.startswith('```'):
                ai_response = ai_response[3:-3].strip()

            parsed = json.loads(ai_response)
            return parsed.get("evaluations", [])
        except Exception as e:
            print(f"AI failed: {e}")
            return self._simple_fallback_evaluation(evaluation_data)

    def _simple_fallback_evaluation(self, evaluation_data):
        evaluations = []
        for item in evaluation_data:
            if item['type'] == 'MCQ':
                is_correct = item['student_answer'].strip().upper() == item['correct_option']
                feedback = "Correct" if is_correct else f"Correct answer: {item['correct_option']}"
            else:
                is_correct = False
                feedback = "Subjective question - AI feedback not available"
            evaluations.append({
                'question_id': item['question_id'],
                'is_correct': is_correct,
                'feedback': feedback,
                'weak_topics': [],
                'model_answer': None
            })
        return evaluations

    def _finalize_attempt(self, attempt, evaluation):
        attempt.score = evaluation['score']
        attempt.correct_answers = evaluation['correct_count']
        attempt.total_questions = evaluation['total_questions']
        attempt.end_time = timezone.now()
        attempt.is_submitted = True
        attempt.ai_feedback = self._generate_ai_feedback(evaluation)
        attempt.suggested_topics = ", ".join(evaluation['weak_topics'])
        attempt.save()

    def _generate_ai_feedback(self, evaluation):
        if not evaluation['weak_topics']:
            return f"Score: {evaluation['score']}% - Great job!"

        prompt = f"""Generate a 2-3 sentence feedback for the following test result:
- Score: {evaluation['score']}%
- Correct Answers: {evaluation['correct_count']}/{evaluation['total_questions']}
- Weak Topics: {', '.join(evaluation['weak_topics'])}

Feedback:"""
        try:
            return evaluate_with_deepseek(prompt).strip()
        except:
            return f"Score: {evaluation['score']}%. Focus on: {', '.join(evaluation['weak_topics'])}"

    def _format_results(self, attempt, evaluation):
        return {
            'attempt_id': attempt.id,
            'test_id': attempt.test_id,
            'student': attempt.student.username,
            'score': evaluation['score'],
            'correct_answers': evaluation['correct_count'],
            'total_questions': evaluation['total_questions'],
            'marks': {
                'obtained': evaluation['correct_count'],
                'total': evaluation['total_questions']
            },
            'weak_topics': evaluation['weak_topics'],
            'feedback': attempt.ai_feedback,
            'questions': evaluation['question_results'],
            'submitted_at': attempt.end_time
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
            
            student_answers = StudentAnswer.objects.filter(attempt=attempt).select_related('question')

            question_results = []
            weak_topics_set = set()

            for sa in student_answers:
                weak_topics = sa.suggested_topics.split(",") if sa.suggested_topics else []
                weak_topics_set.update([topic.strip() for topic in weak_topics if topic.strip()])
                question_results.append({
                    'question_id': sa.question.id,
                    'content': sa.question.content,
                    'questionType': sa.question.question_type,
                    'options': {
                        'A': sa.question.option_a,
                        'B': sa.question.option_b,
                        'C': sa.question.option_c,
                        'D': sa.question.option_d
                    } if sa.question.question_type == "MCQ" else None,
                    'student_answer': sa.answer_text,
                    'is_correct': sa.is_correct,
                    'feedback': sa.ai_feedback,
                })


            return Response({
                "attempt_id": attempt.id,
                "test_id": attempt.test_id,
                "student": attempt.student.username,
                "score": attempt.score,
                "correct_answers": attempt.correct_answers,
                "total_questions": attempt.total_questions,
                "marks": {
                    "obtained": attempt.correct_answers,
                    "total": attempt.total_questions
                },
                "weak_topics": list(weak_topics_set),
                "feedback": attempt.ai_feedback,
                "questions": question_results,
                "submitted_at": attempt.end_time
            })

        except TestAttempt.DoesNotExist:
            return Response(
                {"error": "Test results not found"},
                status=status.HTTP_404_NOT_FOUND
            )
            
class TeacherSessionTestsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, session_id):
        if request.user.role != "teacher":
            return Response({"error": "Unauthorized"}, status=403)

        session = get_object_or_404(Session, id=session_id, teacher=request.user)
        serializer = SessionWithTestsSerializer(session)
        return Response(serializer.data)
    
class TeacherTestListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        tests = Test.objects.filter(teacher=request.user)
        serializer = TestSerializer(tests, many=True)
        return Response(serializer.data)



class TestDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, test_id):
        test = get_object_or_404(Test, id=test_id)
        serializer = TestSerializer(test)
        return Response(serializer.data)

    def patch(self, request, test_id):
        test = get_object_or_404(Test, id=test_id)

        if request.user != test.teacher:
            return Response({'error': 'Permission denied.'}, status=status.HTTP_403_FORBIDDEN)

        # Handle question updates
        updated_questions = request.data.get('questions', [])
        deleted_question_ids = request.data.get('delete_questions', [])
        new_questions = request.data.get('new_questions', [])

        # Update existing questions
        for q_data in updated_questions:
            question_id = q_data.get('id')
            if not question_id:
                continue
            try:
                question = test.questions.get(id=question_id)
            except Question.DoesNotExist:
                continue
            serializer = QuestionSerializer(question, data=q_data, partial=True)
            if serializer.is_valid():
                serializer.save()
            else:
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        # Delete specified questions
        for qid in deleted_question_ids:
            try:
                question = test.questions.get(id=qid)
                question.delete()
            except Question.DoesNotExist:
                continue

        # Create new questions
        for q_data in new_questions:
            q_data['test'] = test.id
            q_data['teacher'] = request.user.id
            serializer = QuestionSerializer(data=q_data)
            if serializer.is_valid():
                serializer.save()
            else:
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        return Response({'message': 'Test updated successfully.'}, status=status.HTTP_200_OK)

