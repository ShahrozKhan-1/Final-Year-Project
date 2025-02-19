from django.contrib.auth.models import AbstractUser
from django.db import models

class User(AbstractUser):
    is_student = models.BooleanField(default=False)
    is_teacher = models.BooleanField(default=False)

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
