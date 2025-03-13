from typing import List
from typing import Type

from django.conf import settings
from django.urls import reverse
from djrad_rest.registration.serializers import FrontendRegistrationSerializer
from djrad_rest.site import RestSite

from scbp_core.djrad.views import LoginViewSet
from scbp_core.models import ClientUser
from scbp_core.models import DriverUser
from scbp_core.models import StaffUser
from scbp_core.models import User
from scbp_core.services.accounts import get_account_for_session


class ScbpBaseSite(RestSite):
    login_viewset = LoginViewSet

    def get_supported_user_types(self) -> List[Type[User]]:
        """Should return the user classes that can access this site

        This is to handle things like admin users accessing the client portal or
        vice versa where it's just easier to not allow and force admin to login
        as correct user type (or impersonate)
        """
        raise NotImplementedError("get_supported_user_types must be implemented")

    def get_unsupported_user_type_redirect(self, user: User):
        """Should return the URL to redirect to for a user that is not in get_supported_user_types"""
        raise NotImplementedError(
            "get_unsupported_user_type_redirect must be implemented"
        )

    def get_frontend_serializer(self, **kwargs):
        if settings.DISABLE_DJRAD_DEVTOOLS:
            return FrontendRegistrationSerializer(self)
        return super().get_frontend_serializer(**kwargs)

    def get_global_permissions(self):
        """List any global non-model permissions you want to check on the frontend here"""
        return ["is_admin", "is_superuser"]

    def get_initial_model_data(self, request):
        """Return any model data to populate frontend redux store with"""
        return []

    def get_initial_state(self, request):
        """Return non-model specific state to populate redux store with"""
        return {
            "Auth": {
                "isLoggedIn": request.user and not request.user.is_anonymous,
                "userId": request.user and request.user.id,
                "isHijackedUser": request.session.get("is_hijacked_user", False),
            }
        }

    def get_extra_login_response_data(self, request):
        """Return extra data for use on frontend as part of login call"""
        return {}

    def get_frontend_settings(self):
        """Get any site specific settings to return to frontend

        Accessed on frontend with useSettings()
        """
        return {}


class ScbpAppSite(ScbpBaseSite):
    def get_supported_user_types(self) -> List[Type[User]]:
        return [ClientUser]

    def get_unsupported_user_type_redirect(self, user: User):
        return "/admin/redirect-from-app/"

    # Sets default class to use for auto registrations and enforces
    # that all registrations extend this base class
    @property
    def ModelRegistrationClass(self):
        from scbp_core.djrad.app.base import ScbpAppModelRegistration

        return ScbpAppModelRegistration

    def get_active_account_context(self, request, active_account):
        if active_account.account_to_client.get(
            client_user=request.user.get_profile()
        ).is_account_admin:
            return {"request": request}
        # Don't expose anything but the minimum required to the frontend for non-admins
        # TODO: This may break the frontend one day if we add new fields to the serializer...
        # we are only doing it this way as frontend expects it in _many_ places and is too
        # big of a refactor at this moment. We may revisit down the track.
        return {"request": request, "partial_fields": ["account_nickname", "category"]}

    def get_initial_model_data(self, request):
        active_account = get_account_for_session(request)
        initial_model_data = super().get_initial_model_data(request)
        if active_account:
            from scbp_core.djrad.app import AppAccountSerializer

            initial_model_data.append(
                AppAccountSerializer(
                    active_account,
                    context=self.get_active_account_context(request, active_account),
                )
            )
        return initial_model_data

    def get_initial_state(self, request):
        state = super().get_initial_state(request)
        active_account = get_account_for_session(request)
        if active_account:
            state["Auth"]["activeAccountId"] = active_account.pk
        return state

    def get_extra_login_response_data(self, request):
        """Return extra data for use on frontend as part of login call"""
        data = super().get_extra_login_response_data(request)
        active_account = get_account_for_session(request)
        if active_account:
            from scbp_core.djrad.app import AppAccountSerializer

            data["activeAccount"] = AppAccountSerializer(
                active_account,
                context=self.get_active_account_context(request, active_account),
            ).data
        return data


class ScbpAdminSite(ScbpBaseSite):
    def get_supported_user_types(self) -> List[Type[User]]:
        return [StaffUser, User]

    def get_unsupported_user_type_redirect(self, user: User):
        return reverse("logout") + "?next=/admin/"

    def get_frontend_settings(self):
        return {"dateTimeFormat": "YYYY-MM-DD HHmm"}

    # Sets default class to use for auto registrations and enforces
    # that all registrations extend this base class
    @property
    def ModelRegistrationClass(self):
        from scbp_core.djrad.admin.base import ScbpAdminModelRegistration

        return ScbpAdminModelRegistration


class ScbpDriverSite(ScbpBaseSite):
    def get_supported_user_types(self) -> List[Type[User]]:
        return [DriverUser]

    def get_unsupported_user_type_redirect(self, user: User):
        return reverse("logout") + "?next=/driver/"

    # Sets default class to use for auto registrations and enforces
    # that all registrations extend this base class
    @property
    def ModelRegistrationClass(self):
        from scbp_core.djrad.driver.base import ScbpDriverModelRegistration

        return ScbpDriverModelRegistration


app_site = ScbpAppSite("app")
admin_site = ScbpAdminSite(
    "admin", base_api_url="admin-api/", model_data_reverse_name="djrad_admin_model_data"
)
driver_site = ScbpDriverSite(
    "driver",
    base_api_url="driver-api/",
    model_data_reverse_name="djrad_driver_model_data",
)
