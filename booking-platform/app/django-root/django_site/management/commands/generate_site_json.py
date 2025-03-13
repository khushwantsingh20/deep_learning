from django.core.management import BaseCommand
from django.db import transaction
from django.http import HttpRequest
from rest_framework.utils import json

from django_site.views import FrontendContextView
from scbp_core.djrad.sites import admin_site
from scbp_core.djrad.sites import app_site
from scbp_core.tests.factory.user import UserFactory


class Command(BaseCommand):
    """Command to dump site and app context data for use in javascript unit tests

    See jest.config.js for where this is used.
    """

    def handle(self, *app_labels, **options):
        with transaction.atomic():
            r = HttpRequest()
            r.user = UserFactory(is_superuser=True)
            r.session = {}
            r.META["SERVER_NAME"] = "localhost"
            r.META["SERVER_PORT"] = 80
            context = FrontendContextView(site=admin_site).get_app_context(r)
            data = {
                "appContext": context,
                "admin": json.loads(admin_site.generate_frontend_json()),
                "app": json.loads(app_site.generate_frontend_json()),
            }
            print(json.dumps(data))  # noqa
            # Return, rolling back transaction when atomic block exits
            transaction.set_rollback(True)
            return
