from django.apps import AppConfig


class SmartassessConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'smartassess'


class CoreConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'core'

    def ready(self):
        import signals  # Add this line