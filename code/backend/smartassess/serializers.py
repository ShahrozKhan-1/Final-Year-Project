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
        
        
class StudentAnswerSerializer(serializers.ModelSerializer):
    question_text = serializers.CharField(source='question.text', read_only=True)
    is_correct = serializers.SerializerMethodField()
    correct_answer = serializers.SerializerMethodField()

    class Meta:
        model = StudentAnswer
        fields = ['question', 'question_text', 'answer_text', 'correct_answer', 'is_correct']

    def get_is_correct(self, obj):
        if obj.question.question_type == 'MCQ':
            return obj.answer_text == obj.question.correct_option
        return None  # or custom logic for QNA if applicable

    def get_correct_answer(self, obj):
        if obj.question.question_type == 'MCQ':
            return obj.question.correct_option
        return None  # or expected text for QNA if you store it


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

class TestAttemptSerializer(serializers.ModelSerializer):
    answers = StudentAnswerSerializer(many=True, read_only=True)
    
    class Meta:
        model = TestAttempt
        fields = '__all__'
        
        
class AttemptedTestListSerializer(serializers.ModelSerializer):
    test_title = serializers.CharField(source='test.title')
    session_id = serializers.IntegerField(source='test.session.id')
    session_name = serializers.CharField(source='test.session.session_name')

    class Meta:
        model = TestAttempt
        fields = ['id', 'test_title', 'session_id', 'session_name', 'score']

class AttemptedTestDetailSerializer(serializers.ModelSerializer):
    test_title = serializers.CharField(source='test.title')
    answers = StudentAnswerSerializer(source='answers.all', many=True)

    class Meta:
        model = TestAttempt
        fields = ['id', 'test_title', 'score', 'submitted_at', 'answers']



# class SessionSerializer(serializers.ModelSerializer):
#     student_count = serializers.SerializerMethodField()
#     pending_requests = serializers.SerializerMethodField()
#     duration_minutes = serializers.SerializerMethodField()

#     class Meta:
#         model = Session
#         fields = [
#             'id', 'session_name', 'description',
#             'start_time', 'end_time', 'created_at',
#             'student_count', 'pending_requests', 'duration_minutes'
#         ]

#     def get_student_count(self, obj):
#         return obj.enrolled_students.count()

#     def get_pending_requests(self, obj):
#         return obj.pending_students.count()

#     def get_duration_minutes(self, obj):
#         return int((obj.end_time - obj.start_time).total_seconds() / 60)

# serializers.py
class NotificationSerializer(serializers.ModelSerializer):
    notification_type_display = serializers.CharField(
        source='get_notification_type_display', 
        read_only=True
    )
    sender_name = serializers.SerializerMethodField()
    content_object_info = serializers.SerializerMethodField()
    
    class Meta:
        model = Notification
        fields = [
            'id',
            'notification_type',
            'notification_type_display',
            'message',
            'sender',
            'sender_name',
            'content_object',
            'content_object_info',
            'created_at',
            'is_read'
        ]
        read_only_fields = fields
    
    def get_sender_name(self, obj):
        return obj.sender.username if obj.sender else "System"
    
    def get_content_object_info(self, obj):
        if not obj.content_object:
            return None
        
        content_object = obj.content_object
        if hasattr(content_object, 'title'):
            return {
                'id': content_object.id,
                'title': content_object.title,
                'type': content_object.__class__.__name__
            }
        elif hasattr(content_object, 'session_name'):
            return {
                'id': content_object.id,
                'name': content_object.session_name,
                'type': content_object.__class__.__name__
            }
        return {
            'id': content_object.id,
            'type': content_object.__class__.__name__
        }