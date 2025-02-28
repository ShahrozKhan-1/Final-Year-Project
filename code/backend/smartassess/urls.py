from django.urls import path
from .views import *

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', LoginView.as_view(), name='login'),
    path('approve-teacher/<int:pk>/', ApproveTeacherView.as_view(), name='approve-teacher'),
]
