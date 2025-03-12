from django.contrib.auth.models import AbstractUser
from django.db import models
from django.conf import settings

class User(AbstractUser):
    ROLE_CHOICES = [
        ('student', 'Student'),
        ('teacher', 'Teacher'),
        ('admin', 'Admin'),
    ]

    email = models.EmailField(unique=True)
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default='student')
    is_verified = models.BooleanField(default=False)

    
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
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.session_name