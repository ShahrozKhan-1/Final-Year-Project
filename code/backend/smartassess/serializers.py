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
        
class QuestionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Question
        fields = [
            'id', 'test', 'teacher', 'content',
            'option_a', 'option_b', 'option_c', 'option_d',
            'correct_option', 'difficulty', 'question_type'
        ]
        read_only_fields = ['test', 'teacher']
        extra_kwargs = {
            'option_a': {'allow_null': True},
            'option_b': {'allow_null': True},
            'option_c': {'allow_null': True},
            'option_d': {'allow_null': True},
        }

# serializers.py

class TestSerializer(serializers.ModelSerializer):
    questions = QuestionSerializer( many=True, read_only=True)
    
    class Meta:
        model = Test
        fields = ['id', 'title', 'description', 'created_at', 'session', 'teacher', 'questions']
        read_only_fields = ['id', 'created_at']

class SessionWithTestsSerializer(serializers.ModelSerializer):
    tests = TestSerializer(many=True, read_only=True)

    class Meta:
        model = Session
        fields = ['id', 'session_name', 'description', 'start_time', 'end_time', 'tests']
        
        
# serializers.py
class StudentAnswerSerializer(serializers.ModelSerializer):
    class Meta:
        model = StudentAnswer
        fields = ['question', 'answer_text']

# serializers.py


class PracticeQuestionGenerationSerializer(serializers.Serializer):
    topic = serializers.CharField(required=False, allow_blank=True)
    document = serializers.FileField(required=False)
    mcq_count = serializers.IntegerField(min_value=0)
    qna_count = serializers.IntegerField(min_value=0)
    difficulty = serializers.ChoiceField(choices=["easy", "medium", "hard"])

    def validate(self, data):
        if not data.get("topic") and not data.get("document"):
            raise serializers.ValidationError("Either topic or document must be provided.")
        return data

class PracticeQuestionResultSerializer(serializers.ModelSerializer):
    class Meta:
        model = PracticeQuestionResult
        fields = '__all__'

class PracticeResultSerializer(serializers.ModelSerializer):
    questions = PracticeQuestionResultSerializer(many=True)

    class Meta:
        model = PracticeResult
        fields = '__all__'

    def create(self, validated_data):
        questions_data = validated_data.pop('questions')
        result = PracticeResult.objects.create(**validated_data)
        for q_data in questions_data:
            PracticeQuestionResult.objects.create(practice_result=result, **q_data)
        return result
