from django.apps import AppConfig


class SmartassessConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'smartassess'

    def ready(self):
        import smartassess.signals  # Add this line