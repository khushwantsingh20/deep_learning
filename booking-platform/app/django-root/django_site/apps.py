from allianceutils.checks import check_admins
from allianceutils.checks import CheckUrlTrailingSlash
from allianceutils.util import add_autoreload_extra_files
from django.apps.config import AppConfig
from django.conf import settings
from django.core.checks import register
from django.core.checks import Tags

from django_site.checks import check_explicit_table_names
from django_site.checks import check_permissions
from django_site.checks import make_site_check

ID_WARNING_GIT = "django_site.W001"
ID_WARNING_GIT_HOOKS = "django_site.W002"
ID_ERROR_GIT_HOOKS = "django_site.E003"
ID_ERROR_ADMINS = "django_site.W004"


def add_watchers(**kwargs):
    """In dev we watch our .env and permissions files for changes to trigger dev server reload"""
    from manage import find_file_recursive

    env_file = find_file_recursive(".env")
    if env_file:
        add_autoreload_extra_files(env_file)

    add_autoreload_extra_files(settings.CSV_PERMISSIONS_PATH)


class DjangoSiteAppConfig(AppConfig):
    name = "django_site"
    verbose_name = "Django Site"

    def ready(self):
        check = CheckUrlTrailingSlash(
            expect_trailing_slash=True, ignore_attrs={"_regex": ["^.*"]}
        )
        register(check=check, tags=Tags.urls)
        register(check=check_admins)
        register(check=check_explicit_table_names)

        from scbp_core.djrad.sites import admin_site
        from scbp_core.djrad.sites import app_site

        check_admin_site = make_site_check(admin_site)
        check_app_site = make_site_check(app_site)

        register(check=check_admin_site)
        register(check=check_app_site)
        register(check=check_permissions, tags=Tags.models)

        if settings.DEBUG:
            from django.utils.autoreload import autoreload_started

            autoreload_started.connect(add_watchers)

        import eway

        eway.api_key = settings.EWAY_API_KEY
        eway.api_key_password = settings.EWAY_API_KEY_PASSWORD
        if settings.EWAY_API_SANDBOX_ENABLED:
            eway.api_url = "https://api.sandbox.ewaypayments.com/"
