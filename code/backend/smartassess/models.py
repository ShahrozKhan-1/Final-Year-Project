from django.contrib.auth.models import AbstractUser
from django.db import models

class User(AbstractUser):
    is_student = models.BooleanField(default=False)
    email = models.EmailField(unique=True)  # Email is unique
    is_teacher = models.BooleanField(default=False)
    username = models.CharField(max_length=150, unique=True, blank=True, null=True)  # Keep username for future use

    USERNAME_FIELD = "email"  # Use email for authentication
    REQUIRED_FIELDS = ["username"]  # Username is required during registration
    
    groups = models.ManyToManyField(
        "auth.Group",
        related_name="smartassess_users",  # Avoid conflict
        blank=True,
    )
    user_permissions = models.ManyToManyField(
        "auth.Permission",
        related_name="smartassess_users_permissions",  # Avoid conflict
        blank=True,
    )

    def __str__(self):
        return self.username
