from rest_framework import serializers
from .models import *

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", 'username', 'email', 'role', 'is_verified']
        

class RegisterSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['email', 'username', 'password', 'role']
        extra_kwargs = {'password': {'write_only': True}}
        
    def create(self, validated_data):
        user = User.objects.create_user(**validated_data)
        if user.role == 'teacher':
            user.is_verified = False
            user.save()
        return user
    
class SessionSerializer(serializers.ModelSerializer):
    pending_students = UserSerializer(many=True, read_only=True)
    enrolled_students = UserSerializer(many=True, read_only=True)
    teacher = UserSerializer(read_only=True)

    class Meta:
        model = Session
        fields = [
            'id', 'teacher', 'session_name', 'description', 
            'start_time', 'end_time', 'enrolled_students', 
            'pending_students', 'created_at'
        ]
        read_only_fields = ('teacher', 'created_at', 'enrolled_students')        
        
# serializers.py
class TestSerializer(serializers.ModelSerializer):
    class Meta:
        model = Test
        fields = ['id', 'title', 'description', 'created_at', 'session', 'teacher']
        read_only_fields = ['id', 'created_at']

class QuestionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Question
        fields = [
            'id', 'test', 'teacher', 'content',
            'option_a', 'option_b', 'option_c', 'option_d',
            'correct_option', 'difficulty'
        ]
        read_only_fields = ['test', 'teacher']
