from django.conf import settings
from django.conf.urls import include
from django.urls import re_path

from .views import call_python
from .views import end_server
from .views import login
from .views import rollback

app_name = "django_cypress"

assert settings.DEBUG or getattr(
    settings, "AUTOMATED_TESTS", False
), "django_cypress IS VERY DANGEROUS! It should only be enabled for testing"

urlpatterns = [
    re_path(r"^call/(?P<func>[.a-zA-Z0-9_]+)/$", call_python, name="call"),
    re_path(r"^kill/$", end_server, name="kill"),
    re_path(r"^login/(?P<username>.*)/$", login, name="login"),
    re_path(r"^rollback/$", rollback, name="rollback"),
]

if "django_cypress.test_django_cypress" in settings.INSTALLED_APPS:
    urlpatterns += [
        re_path(
            r"^test/",
            include("django_cypress.test_django_cypress.urls", namespace="test"),
        )
    ]
