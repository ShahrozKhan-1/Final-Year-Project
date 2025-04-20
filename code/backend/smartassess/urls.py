from django.urls import path
from .views import *

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', LoginView.as_view(), name='login'),
    path("approve-teacher/<int:teacher_id>/", ApproveTeacherView.as_view(), name="approve-teacher"),
    path("unverified-teachers/", get_unverified_teachers, name="unverified-teachers"),
    path('sessions/create/', CreateSessionView.as_view(), name="create-session"),
    path('sessions/', ListSessionsView.as_view(), name="list-sessions"),
    path('sessions/enroll/<int:pk>/', EnrollSessionView.as_view(), name="enroll-session"),
    path('sessions/enroll-request/<int:pk>/', RequestEnrollmentView.as_view(), name="enroll-request"),
    path('sessions/manage-enrollments/<int:pk>/', ManageEnrollmentsView.as_view(), name="manage-enrollments"),
    path('teacher-sessions/', TeacherSessionsView.as_view(), name='teacher-sessions'),
    path('create-test/<int:session_id>/', CreateTestView.as_view(), name='create-test'),
    path('generate-questions/', GenerateQuestionsView.as_view(), name='generate-questions'),
    path('api/save-quiz/', SaveQuizView.as_view(), name='save-quiz'),
    path('api/tests/<test_id>/set-time-limit/', SetTimeLimitView.as_view(), name='set-time-limit'),
    path('sessions/enrolled/', EnrolledSessionsView.as_view(), name='sessions-enrolled'),
]