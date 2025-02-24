from rest_framework import serializers
from django.contrib.auth import get_user_model

User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "email", "username", "password", "is_student", "is_teacher"]
        extra_kwargs = {"password": {"write_only": True}}

    def create(self, validated_data):
        user = User.objects.create_user(
            email=validated_data["email"],  # Email is required for login
            username=validated_data["username"],  # Store username for future use
            password=validated_data["password"],
            is_student=validated_data.get("is_student", False),
            is_teacher=validated_data.get("is_teacher", False),
        )
        return user
