import shutil
import subprocess

from django.conf import settings
from django.core.management.base import BaseCommand
from django.utils import autoreload
import redis


class Command(BaseCommand):
    def handle(self, *args, **options):
        if not settings.DEBUG:
            raise ValueError("start_celery only usable when DEBUG=True")

        celery_path = shutil.which("celery")

        def run_celery(*args, **kwargs):
            self.stdout.write("Starting celery worker with autoreload...")

            subprocess.call(["pkill", "-f", celery_path])
            subprocess.call(
                # NOTE: If we need celery beat down the track add -B here
                [celery_path, "-A", "django_site", "worker", "-l", "info", "-c", "2"]
            )

        rs = redis.Redis.from_url(settings.CELERY_BROKER_URL)
        try:
            rs.client_list()
            rs.close()
            autoreload.run_with_reloader(run_celery, args=None, kwargs=None)
        except redis.exceptions.ConnectionError:
            self.stdout.write(
                "Redis is not running - start redis before running start_celery",
                style_func=self.style.ERROR,
            )
