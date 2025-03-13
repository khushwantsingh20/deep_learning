from django.apps import AppConfig


class ScbpAppConfig(AppConfig):
    name = "scbp_core"
    verbose_name = "Southern Cross"

    def ready(self):
        super().ready()
        import scbp_core.signals  # noqa
