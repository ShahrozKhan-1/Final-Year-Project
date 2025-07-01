from django.contrib.auth.models import AbstractUser
from django.db import models
from django.conf import settings
from django.utils import timezone
from datetime import timedelta
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType
from django.core.exceptions import ValidationError


class User(AbstractUser):
    ROLE_CHOICES = [
        ('student', 'Student'),
        ('teacher', 'Teacher'),
        ('admin', 'Admin'),
    ]

    email = models.EmailField(unique=True)
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default='student')
    is_verified = models.BooleanField(default=False)
    date_joined = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        if self.role == 'admin' and User.objects.filter(role='admin').exclude(pk=self.pk).exists():
            raise ValidationError("Only one admin is allowed.")
        super().save(*args, **kwargs)
    
    def __str__(self):
        return self.username


class Session(models.Model):
    teacher = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE, 
        related_name="created_sessions"
    )
    session_name = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    start_time = models.DateTimeField()
    end_time = models.DateTimeField()
    enrolled_students = models.ManyToManyField(
        settings.AUTH_USER_MODEL, 
        blank=True, 
        related_name="enrolled_sessions"
    )
    pending_students = models.ManyToManyField(
        settings.AUTH_USER_MODEL, 
        blank=True,
        related_name="pending_sessions"
    )
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.session_name


# models.py
class Test(models.Model):
    session = models.ForeignKey(Session, on_delete=models.CASCADE, related_name='tests', default=1)
    teacher = models.ForeignKey(User, on_delete=models.CASCADE)
    title = models.CharField(max_length=255)
    time_limit_minutes = models.PositiveIntegerField(default=30)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title
    
class Question(models.Model):
    QUESTION_TYPES = [
        ('MCQ', 'Multiple Choice'),
        ('QNA', 'Written Answer'),
    ]
    
    test = models.ForeignKey(Test, related_name='questions', on_delete=models.CASCADE)
    teacher = models.ForeignKey(User, on_delete=models.CASCADE, default=1)
    question_type = models.CharField(max_length=3, choices=QUESTION_TYPES, default='MCQ')
    content = models.TextField(default='Hi')
    
    # MCQ-specific fields (nullable)
    option_a = models.CharField(max_length=255, blank=True, null=True)
    option_b = models.CharField(max_length=255, blank=True, null=True)
    option_c = models.CharField(max_length=255, blank=True, null=True)
    option_d = models.CharField(max_length=255, blank=True, null=True)
    correct_option = models.CharField(
        max_length=1,
        choices=[('A', 'a'), ('B', 'b'), ('C', 'c'), ('D', 'd')],
        blank=True,
        null=True
    )
    
    # Common fields
    difficulty = models.CharField(max_length=10, default='Medium')
    created_at = models.DateTimeField(auto_now_add=True)
    topic = models.CharField(max_length=100, blank=True, null=True)


    def __str__(self):
        return f"{self.get_question_type_display()}: {self.content[:50]}..."


class TestAttempt(models.Model):
    student = models.ForeignKey(User, on_delete=models.CASCADE)
    test = models.ForeignKey('Test', on_delete=models.CASCADE)
    start_time = models.DateTimeField(auto_now_add=True)
    end_time = models.DateTimeField(null=True, blank=True)
    is_submitted = models.BooleanField(default=False)
    score = models.FloatField(null=True, blank=True)
    correct_answers = models.IntegerField(default=0)
    total_questions = models.IntegerField(default=0)
    ai_feedback = models.TextField(null=True, blank=True, default="...")
    suggested_topics = models.JSONField(null=True, blank=True)
    submitted_at = models.DateTimeField(null=True, blank=True)  # Add this line
    
    def time_taken(self):
        if self.end_time:
            return self.end_time - self.start_time
        return timedelta(0)

    def calculate_score(self):
        return self.answers.filter(is_correct=True).count()

    def get_total_questions(self):
        return self.answers.count()

    class Meta:
        unique_together = ('student', 'test')

    def __str__(self):
        return f"{self.student.username}'s attempt on {self.test.title}"

class StudentAnswer(models.Model):
    attempt = models.ForeignKey(TestAttempt, on_delete=models.CASCADE, related_name='answers')
    question = models.ForeignKey('Question', on_delete=models.CASCADE)
    answer_text = models.TextField()
    is_correct = models.BooleanField(null=True, blank=True)
    ai_feedback = models.TextField(null=True, blank=True)
    suggested_topics = models.JSONField(null=True, blank=True)

    class Meta:
        unique_together = ('attempt', 'question')

    def __str__(self):
        return f"Answer for Q{self.question.id} in attempt {self.attempt.id}"


class PracticeAttempt(models.Model):
    student = models.ForeignKey(User, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    score = models.FloatField(null=True, blank=True)
    feedback = models.TextField(blank=True)


class PracticeQuestion(models.Model):
    attempt = models.ForeignKey(PracticeAttempt, related_name='questions', on_delete=models.CASCADE)
    question_type = models.CharField(max_length=3, choices=[('MCQ', 'MCQ'), ('QNA', 'QNA')])
    content = models.TextField()
    option_a = models.CharField(max_length=255, null=True, blank=True)
    option_b = models.CharField(max_length=255, null=True, blank=True)
    option_c = models.CharField(max_length=255, null=True, blank=True)
    option_d = models.CharField(max_length=255, null=True, blank=True)
    correct_option = models.CharField(max_length=1, null=True, blank=True)
    correct_answer_text = models.TextField(null=True, blank=True)
    student_answer = models.TextField()
    is_correct = models.BooleanField(null=True)


class PracticeResult(models.Model):
    student = models.ForeignKey(User, on_delete=models.CASCADE)
    total_score = models.FloatField()
    total_marks = models.FloatField()
    overall_feedback = models.TextField(null=True, blank=True)
    suggested_topics = models.JSONField(null=True, blank=True)  # List of weak area topics
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"PracticeResult ({self.student.username}) - {self.total_score}/{self.total_marks}"


class PracticeQuestionResult(models.Model):
    practice_result = models.ForeignKey(PracticeResult, related_name="questions", on_delete=models.CASCADE)
    question = models.TextField()
    question_type = models.CharField(max_length=10)  # 'mcq' or 'qna'
    student_answer = models.TextField()
    correct_answer = models.TextField(null=True, blank=True)
    is_correct = models.BooleanField(null=True, blank=True)
    marks = models.FloatField()
    feedback = models.TextField(null=True, blank=True)

    def __str__(self):
        return f"QuestionResult ({self.question_type}) - Marks: {self.marks}"

        
# Remove the first Notification class definition and keep only this one:

class Notification(models.Model):
    NOTIFICATION_TYPES = (
        ('new_test', 'New Test Available'),
        ('enrollment_approved', 'Enrollment Approved'),
        ('enrollment_request', 'Enrollment Request'),
        ('test_attempt', 'Test Attempted'),
    )
    
    recipient = models.ForeignKey(
        User, 
        on_delete=models.CASCADE, 
        related_name='notifications'
    )
    sender = models.ForeignKey(
        User,
        related_name='sent_notifications',
        null=True,
        blank=True,
        on_delete=models.SET_NULL
    )
    notification_type = models.CharField(max_length=50, choices=NOTIFICATION_TYPES)
    message = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    is_read = models.BooleanField(default=False)
    
    # Generic foreign key to link to different content types
    content_type = models.ForeignKey(
        'contenttypes.ContentType', 
        on_delete=models.CASCADE, 
        null=True, 
        blank=True,
    )
    object_id = models.PositiveIntegerField(null=True, blank=True)
    content_object = GenericForeignKey('content_type', 'object_id')
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.get_notification_type_display()} for {self.recipient}"
    
    def mark_as_read(self):
        self.is_read = True
        self.save()