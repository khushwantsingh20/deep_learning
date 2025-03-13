import warnings

from django_filters import rest_framework as filters
from rest_framework.response import Response

from scbp_core.djrad.admin import RefineClientUserChoiceFilter
from scbp_core.djrad.admin import ScbpAdminModelRegistration
from scbp_core.djrad.admin.base import ScbpAdminFilterSet
from scbp_core.djrad.admin.base import ScbpAdminModelSerializer
from scbp_core.djrad.admin.base import ScbpAdminModelViewSet
from scbp_core.djrad.sites import admin_site
from scbp_core.models import ClientUser
from scbp_core.models.guest_traveller import GuestTraveller


class GuestTravellerSerializer(ScbpAdminModelSerializer):
    class Meta:
        model = GuestTraveller
        fields = ("name", "phone_number", "client_user")


class GuestTravellerFilterSet(ScbpAdminFilterSet):
    # Allow listing of clients that are archived. Some bookings are against an
    # archived client but still need to be managed. Without this you can't list
    # the guest travellers for the client on the booking page.
    client_user_id = RefineClientUserChoiceFilter(queryset=ClientUser.all_objects.all())
    account_id = filters.NumberFilter(method="filter_account")

    class Meta:
        model = GuestTraveller
        fields = ("client_user_id", "account_id")

    def filter_account(self, qs, name, value):
        return qs.filter(client_user__accounts=value)


class GuestTravellerViewSet(ScbpAdminModelViewSet):
    serializer_class = GuestTravellerSerializer
    queryset = GuestTraveller.objects.none()
    pagination_class = None
    filterset_class = GuestTravellerFilterSet

    def list(self, request, *args, **kwargs):
        if not request.query_params.get(
            "clientUserId"
        ) and not request.query_params.get("accountId"):
            warnings.warn(
                "GuestTravellerViewSet must be filtered by clientUserId or accountId"
                "unfiltered results are not available due to being unpaginated"
            )
            return Response([])
        return super().list(request, *args, **kwargs)

    def get_queryset(self):
        return GuestTraveller.objects.all()


class GuestTravellerRegistration(ScbpAdminModelRegistration):
    viewset_class = GuestTravellerViewSet


guest_traveller_registration = admin_site.register(
    GuestTraveller, GuestTravellerRegistration
)
