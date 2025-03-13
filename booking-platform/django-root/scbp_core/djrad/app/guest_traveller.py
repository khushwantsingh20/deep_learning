from django.core.exceptions import ValidationError as CoreValidationError
from django.db.models import Q
from django.db.models.functions import Lower
from django_filters import rest_framework as filters

from scbp_core.djrad.admin import RefineClientUserChoiceFilter
from scbp_core.djrad.app import ScbpAppModelRegistration
from scbp_core.djrad.app import ScbpAppViewSetPermissions
from scbp_core.djrad.app.base import ScbpAppClientUserOnlyPermission
from scbp_core.djrad.app.base import ScbpAppModelSerializer
from scbp_core.djrad.app.base import ScbpAppModelViewSet
from scbp_core.djrad.base import django_validation_error_to_drf
from scbp_core.djrad.base import ScbpFilterSet
from scbp_core.djrad.sites import app_site
from scbp_core.models import Account
from scbp_core.models import ClientUser
from scbp_core.models.guest_traveller import GuestTraveller


class GuestTravellerSerializer(ScbpAppModelSerializer):
    class Meta:
        model = GuestTraveller
        fields = ("name", "phone_number")


class GuestTravellerFilterSet(ScbpFilterSet):
    account_id = filters.NumberFilter(method="filter_account")
    client_user = RefineClientUserChoiceFilter()

    class Meta:
        model = GuestTraveller
        fields = ("client_user", "account_id")

    def filter_account(self, qs, name, value):
        return qs.filter(client_user__accounts=value)


class GuestTravellerViewSet(ScbpAppModelViewSet):
    serializer_class = GuestTravellerSerializer
    queryset = GuestTraveller.objects.none()
    pagination_class = None
    permission_classes = (ScbpAppClientUserOnlyPermission, ScbpAppViewSetPermissions)
    filterset_class = GuestTravellerFilterSet

    def get_queryset(self):
        if not self.request.user or self.request.user.is_anonymous:
            return GuestTraveller.objects.none()
        profile = self.request.user.get_profile()
        if not isinstance(profile, ClientUser):
            return GuestTraveller.objects.none()
        accounts = Account.objects.filter(
            account_to_client__is_account_admin=True,
            account_to_client__client_user=profile,
        )

        return (
            GuestTraveller.objects.filter(
                Q(client_user=profile) | Q(client_user__accounts__in=accounts)
            )
            .order_by(Lower("name"), "phone_number")
            .distinct()
        )

    def perform_create(self, serializer):
        try:
            serializer.save(client_user=self.request.user.get_profile())
        except CoreValidationError as cve:
            raise django_validation_error_to_drf(cve)


class GuestTravellerRegistration(ScbpAppModelRegistration):
    viewset_class = GuestTravellerViewSet


guest_traveller_registration = app_site.register(
    GuestTraveller, GuestTravellerRegistration
)
