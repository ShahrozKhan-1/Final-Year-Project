from django.urls import path
from .views import *

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', LoginView.as_view(), name='login'),
    path('approve-teacher/<int:pk>/', ApproveTeacherView.as_view(), name='approve-teacher'),
    path("unverified-teachers/", get_unverified_teachers, name="unverified-teachers"),
    path('sessions/create/', CreateSessionView.as_view(), name="create-session"),
    path('sessions/', ListSessionsView.as_view(), name="list-sessions"),
    path('sessions/enroll/<int:pk>/', EnrollSessionView.as_view(), name="enroll-session"),
]
