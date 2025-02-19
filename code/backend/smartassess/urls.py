from django.urls import path
from .views import *

urlpatterns = [
    path('api/register/', register, name='register'),
    path('api/login/', MyTokenObtainPairView.as_view(), name='token_obtain_pair'),
]
