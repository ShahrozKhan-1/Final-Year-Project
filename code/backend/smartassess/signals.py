from django.db.models.signals import m2m_changed, post_save
from django.dispatch import receiver
from utils.notification import send_notification
from .models import Test, TestAttempt, Session, User
import logging

logger = logging.getLogger(__name__)

# Notify teacher when student requests enrollment
@receiver(m2m_changed, sender=Session.pending_students.through)
def notify_enrollment_request(sender, instance, action, pk_set, **kwargs):
    if action == "post_add":
        teacher = instance.teacher
        for student_id in pk_set:
            student = User.objects.get(id=student_id)
            message = f"{student.username} requested enrollment in '{instance.session_name}'"
            send_notification(
                recipient=teacher,
                notification_type='enrollment_request',
                message=message,
                sender=student,
                content_object=instance
            )

# Notify student when teacher approves enrollment
@receiver(m2m_changed, sender=Session.enrolled_students.through)
def notify_enrollment_approval(sender, instance, action, pk_set, **kwargs):
    if action == "post_add":
        for student_id in pk_set:
            student = User.objects.get(id=student_id)
            message = f"Your enrollment in '{instance.session_name}' was approved"
            send_notification(
                recipient=student,
                notification_type='enrollment_approved',
                message=message,
                sender=instance.teacher,
                content_object=instance
            )

# Notify students when new test is created
@receiver(post_save, sender=Test)
def notify_new_test(sender, instance, created, **kwargs):
    if created:
        for student in instance.session.enrolled_students.all():
            message = f"New test '{instance.title}' available in session '{instance.session.session_name}'"
            send_notification(
                recipient=student,
                notification_type='new_test',
                message=message,
                content_object=instance
            )

# Notify teacher when test is attempted
@receiver(post_save, sender=TestAttempt)
def notify_test_attempt(sender, instance, created, **kwargs):
    if created and instance.is_submitted:
        message = f"{instance.student.username} attempted '{instance.test.title}'"
        send_notification(
            recipient=instance.test.teacher,
            notification_type='test_attempt',
            message=message,
            sender=instance.student,
            content_object=instance
        )