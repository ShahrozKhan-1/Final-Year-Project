from django.urls import path, include
from .views import *
from rest_framework.routers import DefaultRouter



router = DefaultRouter()
router.register(r'notifications', NotificationViewSet, basename='notifications')

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
    path("sessions/enrolled-with-tests/", enrolled_sessions_with_tests, name="enrolled-sessions-with-tests"),
    path('sessions/<int:session_id>/tests/', StudentSessionTestsView.as_view(), name='session-tests'),
    path('student/attempt-test/<int:test_id>/', get_test_for_attempt, name='attempt-test'),
    path('student/submit-test/<int:test_id>/', SubmitTestView.as_view(), name='submit-test'),
    path('practice/generate-questions/', PracticeGenerateQuestionsView.as_view()),
    path("practice/check/", PracticeCheckView.as_view(), name="practice-check"),
    path('student/test-result/<int:attempt_id>/', TestResultView.as_view(), name='test-result'),
    path("teacher/session/<int:session_id>/tests/", TeacherSessionTestsView.as_view(), name="session-tests"),
    path('teacher-tests/', TeacherTestListView.as_view(), name='teacher-tests'),
    path('api/tests/<int:test_id>/', TestDetailView.as_view(), name='test-detail'),
    path('api/sessions/<int:session_id>/', DeleteTeacherSessionDetailView.as_view(), name='teacher-session-detail'),
    path('sessions/<int:session_id>/students/', EnrolledStudentsView.as_view(), name='enrolled-students'),
    # path('report/student/<int:student_id>/pdf/', StudentReportPDFView.as_view(), name='student_pdf_report'),
    path('session/<int:session_id>/detail/', session_detail, name='session-detail'),
    path('student/attempted-tests/', student_attempted_tests, name='student-attempted-tests'),
    path('student/attempted-tests/<int:attempt_id>/', attempted_test_detail, name='attempted-test-detail'), 
    path('student/attempted-tests/<int:attempt_id>/pdf/', download_attempt_pdf, name='attempted-test-pdf'),
    path('teacher/attempts/<int:attempt_id>/', teacher_attempt_detail),
    path('teacher/attempts/<int:attempt_id>/download/', teacher_download_attempt_pdf),
    path('teacher/tests/<int:test_id>/attempts/', teacher_test_attempts), 
    path('teacher/session/<int:session_id>/results/', teacher_session_result),
    path('teacher-sessions/', teacher_sessions),
    path('sessions/<int:session_id>/', SessionDetailView.as_view(), name='session-detail'),
    path('api/', include(router.urls)),
    path('api/notifications/count/', NotificationCountView.as_view(), name='notification-count'),
    path('test-notification/', test_notification, name='test-notification'),
    path("stats/", UserStatsView.as_view(), name="user-stats"),
    path('api/admin/sessions/', AdminSessionListView.as_view(), name='admin-sessions'),
    path('api/admin/users/', AdminUserListView.as_view(), name='admin-users'),
    path('api/admin/users/<int:user_id>/', AdminUserDeleteView.as_view(), name='admin-delete-user'),
]