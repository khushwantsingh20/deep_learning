import uuid

from django.conf import settings
from django.db.models import Q
from django.db.models import Value
from django.db.models.functions import Concat
from django.db.models.functions import Replace
from django_filters import OrderingFilter
from django_filters import rest_framework as filters
from rest_framework import serializers
from rest_framework.exceptions import ValidationError

from scbp_core.djrad.admin import AccountToClientSerializer
from scbp_core.djrad.admin import ModelIdFilter
from scbp_core.djrad.admin import ScbpAdminModelArchivableViewSet
from scbp_core.djrad.admin.user import AdminUserArchivableRegistration
from scbp_core.djrad.base import ScbpFilterSet
from scbp_core.djrad.common.user import BaseUserSerializer
from scbp_core.djrad.sites import admin_site
from scbp_core.models import ClientAddress
from scbp_core.models import ClientAddressType
from scbp_core.models.user import ClientUser
from scbp_core.models.user import ClientUserPriority
from scbp_core.models.user import User
from scbp_core.services.campaign_monitor import create_or_update_subscription


class ClientUserSerializer(BaseUserSerializer):
    account_to_client = AccountToClientSerializer(many=True, read_only=True)

    password = serializers.CharField(
        write_only=True, min_length=8, allow_blank=True, allow_null=True, required=False
    )
    confirm_password = serializers.CharField(
        write_only=True, min_length=8, allow_blank=True, allow_null=True, required=False
    )
    generate_email = serializers.BooleanField(default=False, required=False)
    name_phone_suburb_email = serializers.SerializerMethodField()

    def __init__(self, instance=None, **kwargs):
        super().__init__(instance, **kwargs)
        # Cache addresses for client if name_phone_suburb_email field requested
        self._client_home_address_cache = {}
        self._cache_field_names = [
            field_name
            for field_name in ["name_phone_suburb_email"]
            if field_name in self.fields
        ]
        if instance and "name_phone_suburb_email" in self.fields:
            try:
                ids = [item.pk for item in instance]
            except TypeError:
                ids = [instance.pk]
            addresses = ClientAddress.objects.filter(
                address_type=ClientAddressType.HOME, client_id__in=ids
            )
            self._client_home_address_cache = {
                address.client_id: address for address in addresses
            }

    class Meta:
        model = ClientUser
        fields = (
            "name",
            "first_name",
            "last_name",
            "email",
            "password",
            "confirm_password",
            "activated_at",
            "user_type",
            "title",
            "contact_phone",
            "contact_phone_alternate",
            "account_to_client",
            "driver_instructions",
            "internal_instructions",
            "priority",
            "is_active",
            "generate_email",
            "name_phone_suburb_email",
        )
        extra_kwargs = {
            "email": {"required": False},
            "confirm_password": {"required": False},
            "password": {"required": False},
            "priority": {"initial": ClientUserPriority.LOW},
        }

    def validate(self, attrs):
        generate_email = attrs.pop("generate_email", False)
        if generate_email:
            attrs["email"] = settings.LEGACY_CLIENT_EMAIL_ADDRESS_TEMPLATE.format(
                uuid.uuid4()
            )
            self._was_email_generated = True
        elif not attrs.get("email"):
            raise ValidationError({"email": "Email must be specified"})
        elif (
            User.objects.filter(email__iexact=attrs.get("email").lower())
            .exclude(pk=self.instance.pk if self.instance else None)
            .exists()
        ):
            raise ValidationError({"email": "Email already exists"})
        return super().validate(attrs)

    def create(self, validated_data):
        instance = super().create(validated_data)
        if getattr(self, "_was_email_generated", None):
            new_email = settings.LEGACY_CLIENT_EMAIL_ADDRESS_TEMPLATE.format(
                instance.pk
            )
            if not ClientUser.objects.filter(email=new_email):
                instance.email = new_email
                instance.save()
        else:
            create_or_update_subscription.delay(instance.pk)
        return instance

    def get_djrad_label(self, instance):
        return str(instance)

    def get_name_phone_suburb_email(self, instance):
        address = self._client_home_address_cache.get(instance.id)
        suburb = ""
        if address:
            suburb = address.suburb
        return [
            instance.get_full_name(),
            filter(None, [instance.contact_phone, instance.contact_phone_alternate]),
            suburb,
            instance.email,
        ]


# EXCLUDE all clients already linked to designated account
class ExcludeAccountFilter(filters.NumberFilter):
    def filter(self, qs, value):
        if not value:
            return qs
        return qs.exclude(accounts=value)


class ClientUserFilterSet(ScbpFilterSet):
    id = ModelIdFilter(queryset=ClientUser.objects.all())
    ids = ModelIdFilter(queryset=ClientUser.objects.all())
    name = filters.CharFilter(method="filter_name")
    email = filters.CharFilter(lookup_expr="icontains")
    date_joined = filters.DateFromToRangeFilter()
    exclude_account = ExcludeAccountFilter()
    query = filters.CharFilter(method="filter_query")
    account = filters.Filter(method="filter_account")
    contact_phone = filters.Filter(method="filter_contact_phone")

    ordering = OrderingFilter(
        fields=(("email", "email"), ("first_name", "name"), ("last_name", "name"))
    )

    class Meta:
        model = ClientUser
        fields = (
            "id",
            "ids",
            "name",
            "email",
            "is_superuser",
            "date_joined",
            "exclude_account",
            "is_active",
            "contact_phone",
        )

    def filter_contact_phone(self, qs, _, value):
        value = str(value).replace(" ", "")
        return qs.annotate(
            contact_phone_stripped=Replace("contact_phone", Value(" "), Value("")),
            contact_phone_alt_stripped=Replace(
                "contact_phone_alternate", Value(" "), Value("")
            ),
        ).filter(
            Q(contact_phone_stripped__icontains=value)
            | Q(contact_phone_alt_stripped__icontains=value)
        )

    # Filter for query params.
    def filter_query(self, qs, _, keywords):
        if not keywords:
            return qs
        qs = qs.annotate(
            contact_phone_stripped=Replace("contact_phone", Value(" "), Value("")),
            contact_phone_alt_stripped=Replace(
                "contact_phone_alternate", Value(" "), Value("")
            ),
        )
        filter = Q()
        for keyword in keywords.split():
            if "@" in keyword:
                filter = filter & Q(email__icontains=keyword)
            else:
                filter = filter & (
                    Q(first_name__icontains=keyword)
                    | Q(last_name__icontains=keyword)
                    | Q(contact_phone_stripped__icontains=keyword)
                    | Q(contact_phone_alt_stripped__icontains=keyword)
                )
        return qs.filter(filter)

    def filter_name(self, queryset, name, value):
        return queryset.annotate(
            name=Concat("first_name", Value(" "), "last_name")
        ).filter(name__icontains=value)

    def filter_account(self, queryset, name, account):
        return queryset.filter(
            account_to_client__account=account, account_to_client__archived_at=None
        )


class ClientUserViewSet(ScbpAdminModelArchivableViewSet):
    serializer_class = ClientUserSerializer
    queryset = ClientUser.all_objects.all().annotate(
        name=Concat("first_name", Value(" "), "last_name")
    )
    filterset_class = ClientUserFilterSet

    def perform_create(self, serializer):
        user = serializer.save()
        user.send_welcome_email()


class ClientUserRegistration(AdminUserArchivableRegistration):
    viewset_class = ClientUserViewSet

    def get_filter_names(self, filters):
        names = super().get_filter_names(filters)
        return [n for n in names if n not in ["exclude_account"]]


admin_site.register(ClientUser, ClientUserRegistration)
