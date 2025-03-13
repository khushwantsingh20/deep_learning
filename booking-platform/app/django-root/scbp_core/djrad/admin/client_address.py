import warnings

from django_filters import rest_framework as filters
from rest_framework.response import Response

from scbp_core.djrad.admin import RefineClientUserChoiceFilter
from scbp_core.djrad.admin import ScbpAdminModelRegistration
from scbp_core.djrad.admin import ScbpAdminModelViewSet
from scbp_core.djrad.admin import ScbpAdminViewSetPermissions
from scbp_core.djrad.common.address import BaseAddressSerializer
from scbp_core.djrad.common.address import SetAddressSourceViewSetMixin
from scbp_core.djrad.sites import admin_site
from scbp_core.models import ClientAddress
from scbp_core.models import ClientUser


class ClientAddressFilterset(filters.FilterSet):
    # Allow listing of clients that are archived. Some bookings are against an
    # archived client but still need to be managed. Without this you can't list
    # the addresses for the client on the booking page.
    client = RefineClientUserChoiceFilter(queryset=ClientUser.all_objects.all())
    account = filters.NumberFilter(method="filter_account")

    class Meta:
        model = ClientAddress
        fields = ("client", "account")

    def filter_account(self, qs, name, value):
        return qs.filter(client__accounts=value)


class ClientAddressSerializer(BaseAddressSerializer):
    class Meta:
        model = ClientAddress
        fields = (
            "address_type",
            "address_label",
            "address_instructions",
            "client",
        ) + BaseAddressSerializer.BASE_FIELDS


class ClientAddressViewSetPermissions(ScbpAdminViewSetPermissions):
    actions_to_perms_map = {
        "set_address_source_id": ["%(app_label)s.change_%(model_name)s"]
    }


class ClientAddressViewSet(ScbpAdminModelViewSet, SetAddressSourceViewSetMixin):
    serializer_class = ClientAddressSerializer
    queryset = ClientAddress.objects.all().order_by("address_label")
    pagination_class = None
    filterset_class = ClientAddressFilterset
    permission_classes = (ClientAddressViewSetPermissions,)

    def list(self, request, *args, **kwargs):
        if not request.query_params.get("client") and not request.query_params.get(
            "account"
        ):
            warnings.warn(
                "ClientAddressViewSet must be filtered by client or account - "
                "unfiltered results are not available due to being unpaginated"
            )
            return Response([])
        return super().list(request, *args, **kwargs)

    def get_filter_paginator_class(self, *args, **kwargs):
        return None


class ClientAddressRegistration(ScbpAdminModelRegistration):
    viewset_class = ClientAddressViewSet

    def get_related_lookup_field_names(self):
        return []


client_address_registration = admin_site.register(
    ClientAddress, ClientAddressRegistration
)
