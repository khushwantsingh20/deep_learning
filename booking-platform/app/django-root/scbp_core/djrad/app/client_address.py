from django.core.exceptions import ValidationError as CoreValidationError
from django.db.models import Q
from django.db.models.functions import Lower
from django_filters import rest_framework as filters

from scbp_core.djrad.app import ScbpAppViewSetPermissions
from scbp_core.djrad.app.base import ScbpAppModelRegistration
from scbp_core.djrad.app.base import ScbpAppModelViewSet
from scbp_core.djrad.base import django_validation_error_to_drf
from scbp_core.djrad.base import ScbpFilterSet
from scbp_core.djrad.common.address import BaseAddressSerializer
from scbp_core.djrad.common.address import SetAddressSourceViewSetMixin
from scbp_core.djrad.sites import app_site
from scbp_core.models import Account
from scbp_core.models import ClientAddress
from scbp_core.models import ClientUser


class ClientAddressSerializer(BaseAddressSerializer):
    class Meta:
        model = ClientAddress
        fields = (
            "client",
            "address_type",
            "address_label",
            "address_instructions",
        ) + BaseAddressSerializer.BASE_FIELDS
        extra_kwargs = {"client": {"read_only": True}}


class ClientAddressFilterSet(ScbpFilterSet):
    account = filters.NumberFilter(method="filter_account")

    class Meta:
        model = ClientAddress
        fields = ("client", "account")

    def filter_account(self, qs, name, value):
        return qs.filter(client__accounts=value)


class ClientAddressViewSetPermissions(ScbpAppViewSetPermissions):
    actions_to_perms_map = {
        "set_address_source_id": ["%(app_label)s.change_%(model_name)s"]
    }


class ClientAddressViewSet(ScbpAppModelViewSet, SetAddressSourceViewSetMixin):
    serializer_class = ClientAddressSerializer
    queryset = ClientAddress.objects.none()
    filterset_class = ClientAddressFilterSet
    pagination_class = None
    permission_classes = (ClientAddressViewSetPermissions,)

    def get_queryset(self):
        # Client can only manage their own addresses
        if not self.request.user or self.request.user.is_anonymous:
            return ClientAddress.objects.none()
        profile = self.request.user.get_profile()
        if not isinstance(profile, ClientUser):
            return ClientAddress.objects.none()
        accounts = Account.objects.filter(
            account_to_client__is_account_admin=True,
            account_to_client__client_user=profile,
        )
        qs = (
            ClientAddress.objects.filter(
                Q(client=profile) | Q(client__accounts__in=accounts)
            )
            .distinct()
            .select_related("client")
            .order_by(Lower("address_label"))
        )

        return qs

    def perform_create(self, serializer):
        try:
            client_user = self.request.data.get("client", None)
            user = self.request.user

            if client_user is not None:
                client_user = ClientUser.objects.get(id=client_user)

                if not user.has_perm("can_manage_user", client_user):
                    self.permission_denied(
                        self.request,
                        message="You do not have permissions to manage this user",
                    )

                user = client_user

            serializer.save(client=user)
        except CoreValidationError as cve:
            raise django_validation_error_to_drf(cve)


class ClientAddressRegistration(ScbpAppModelRegistration):
    viewset_class = ClientAddressViewSet

    def get_filter_names(self, filters):
        return []

    def get_related_lookup_field_names(self):
        return []


client_address_registration = app_site.register(
    ClientAddress, ClientAddressRegistration
)
