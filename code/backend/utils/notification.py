from django.contrib.contenttypes.models import ContentType
from smartassess.models import Notification

def send_notification(recipient, notification_type, message, sender=None, content_object=None):
    """
    Creates a notification for a user
    """
    notification = Notification.objects.create(
        recipient=recipient,
        notification_type=notification_type,
        message=message,
        sender=sender
    )
    
    if content_object:
        content_type = ContentType.objects.get_for_model(content_object)
        notification.content_type = content_type
        notification.object_id = content_object.id
        notification.save()
    
    return notification