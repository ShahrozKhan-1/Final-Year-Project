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
    class Meta:
        model = Session
        fields = '__all__'
        read_only_fields = ('teacher', 'created_at', 'enrolled_students')
        
        