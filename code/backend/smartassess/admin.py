from django.contrib import admin
from .models import *
# Register your models here.

admin.site.register(User)
admin.site.register(Session)
admin.site.register(Question)
admin.site.register(Test)
admin.site.register(StudentAnswer)