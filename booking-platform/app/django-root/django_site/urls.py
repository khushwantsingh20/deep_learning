from allianceutils.api.permissions import SimpleDjangoObjectPermissions
from django.conf import settings
from django.conf.urls import include
from django.conf.urls.static import static
from django.contrib.auth.views import LogoutView
from django.urls import re_path
from django.views.generic import RedirectView
from rest_framework.permissions import BasePermission
from rest_framework.routers import APIRootView

import django_site.views
from scbp_core.djrad.sites import admin_site
from scbp_core.djrad.sites import app_site
from scbp_core.djrad.sites import driver_site

urlpatterns = []

if "silk" in settings.INSTALLED_APPS:
    urlpatterns += [re_path(r"^silk/", include("silk.urls", namespace="silk"))]

if settings.DEBUG:
    # SimpleDjangoObjectPermissions causes the BrowsableAPIRenderer to fail
    # (permission_required not set) so remove it in dev.
    # This's a weird place to patch this but can't find another that works.
    APIRootView.permission_classes = [
        x
        for x in APIRootView.permission_classes
        if not issubclass(x, SimpleDjangoObjectPermissions)
    ]
else:

    class NoEntryForAnyone(BasePermission):
        def has_permission(self, request, view):
            return False

    APIRootView.permission_classes = (NoEntryForAnyone,)

# Serve the SPA under a sub-directory to future proof against potential conflicts
# (eg. for SEO purposes, integration with a CMS etc).
urlpatterns += (
    app_site.get_urls()
    + admin_site.get_urls()
    + driver_site.get_urls()
    + [
        re_path(
            r"^admin(/.*)*/$",
            django_site.views.FrontendView.as_view(
                site=admin_site, basename="admin", entry_point="admin"
            ),
        ),
        re_path(
            r"^driver(/.*)*/$",
            django_site.views.FrontendView.as_view(
                site=driver_site, basename="driver", entry_point="driver"
            ),
        ),
        re_path(r"^hijack/", include("django_site.hijack_urls", namespace="hijack")),
    ]
)

urlpatterns += [
    re_path(r"^logout/$", LogoutView.as_view(), name="logout"),
]

# Serve media files in development (note: this is a no-op when DEBUG=False)
urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

if "debug_toolbar" in settings.INSTALLED_APPS:
    import debug_toolbar

    urlpatterns += [re_path(r"^__debug__/", include(debug_toolbar.urls))]

if "django_cypress" in settings.INSTALLED_APPS:
    urlpatterns += [
        re_path(
            r"^cypress/", include("django_cypress.urls", namespace="django_cypress")
        )
    ]

if settings.DEBUG:
    urlpatterns += [
        re_path(
            r"^frontend-context/$",
            django_site.views.FrontendContextView.as_view(site=admin_site),
            name="styleguidist",
        )
    ]


class AppRedirectView(RedirectView):
    """Redirect any requests to /app/.* to /.*

    This isn't needed long term - just makes transition for testing
    easier as we have been using /app/ since the beginning.
    """

    def get_redirect_url(self, *args, **kwargs):
        path = kwargs.get("path", "") or ""
        url = self.url + path.strip("/")
        if not url[-1] == "/":
            url += "/"
        args = self.request.META.get("QUERY_STRING", "")
        if args:
            url = "%s?%s" % (url, args)
        return url


# Wildcard - must come last
urlpatterns += [
    re_path(
        r"^app(?P<path>/.*)*/$",
        AppRedirectView.as_view(url="/", permanent=False),
        name="index",
    ),
    re_path(
        r"^.*",
        django_site.views.FrontendView.as_view(site=app_site, entry_point="app"),
        name="app-entry",
    ),
]
