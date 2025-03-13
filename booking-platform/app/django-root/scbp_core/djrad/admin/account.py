from django.db import transaction
from django.db.models import Q
from django_filters import rest_framework as filters
from rest_framework import serializers
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response

from eway.serializers import EwayEncryptedCardSerializer
from scbp_core.djrad.admin.base import ScbpAdminModelArchivableRegistration
from scbp_core.djrad.admin.base import ScbpAdminModelArchivableViewSet
from scbp_core.djrad.admin.base import ScbpAdminModelSerializer
from scbp_core.djrad.admin.base import ScbpAdminViewSetPermissions
from scbp_core.djrad.admin.filters import RefineClientUserChoiceFilter
from scbp_core.djrad.common.account import create_or_update_token_payment
from scbp_core.djrad.common.creditcard import CreditCardSerializer
from scbp_core.djrad.sites import admin_site
from scbp_core.models import Account
from scbp_core.models import AccountDriverCollectMethod
from scbp_core.models import AccountPaymentMethodType
from scbp_core.models import AccountPaymentTermsType
from scbp_core.models import AccountToClient
from scbp_core.models import ClientUser

from .account_to_client import AccountToClientSerializer
from .base import ScbpArchivableViewSetPermissions
from .filters import ModelIdFilter


class AccountSerializer(ScbpAdminModelSerializer):
    account_to_client = AccountToClientSerializer(many=True, read_only=True)
    credit_card = CreditCardSerializer()
    encrypted_card = EwayEncryptedCardSerializer(
        required=False, allow_null=True, write_only=True
    )
    link_client = serializers.IntegerField(
        write_only=True, allow_null=True, required=False
    )

    class Meta:
        model = Account
        fields = (
            "account_no",
            "account_nickname",
            "account_email",
            "archived_at",
            "business_name",
            "contact_title",
            "contact_first_name",
            "contact_last_name",
            "contact_phone_mobile",
            "contact_phone_landline",
            "billing_address",
            "rate_schedule",
            "category",
            "payment_terms",
            "payment_method",
            "driver_collect_method",
            "approved_by",
            "invoicing_method",
            "credit_card_expiry_month",
            "credit_card_expiry_year",
            "account_to_client",
            "credit_card",
            "encrypted_card",
            "link_client",
        )
        extra_kwargs = {
            f: {"required": False}
            for f in ("account_nickname", "category", "invoicing_method")
        }

    def validate(self, attrs):
        self.link_client = attrs.pop("link_client", None)

        errors = {}

        for required in ("account_nickname", "category", "invoicing_method"):
            if not attrs.get(required, None) and (
                not self.instance or not getattr(self.instance, required, None)
            ):
                errors[required] = "This field is required."

        payment_method = (
            attrs["payment_method"]
            if "payment_method" in attrs
            else (self.instance.payment_method if self.instance else None)
        )
        if (
            payment_method == AccountPaymentMethodType.CREDIT_CARD
            and not attrs.get("encrypted_card")
            and (not self.instance or not self.instance.eway_token_customer_id)
        ):
            errors["payment_method"] = "You need to link a credit card to this account."

        if payment_method == AccountPaymentMethodType.CREDIT_CARD:
            contact_first_name = attrs.get("contact_first_name")
            contact_last_name = attrs.get("contact_last_name")
            if not contact_first_name and self.instance:
                contact_first_name = self.instance.contact_first_name
            if not contact_last_name and self.instance:
                contact_last_name = self.instance.contact_last_name

            if not contact_first_name:
                errors["contact_first_name"] = (
                    "When adding a credit card contact first name is required as eWay requires it"
                )
            if not contact_last_name:
                errors["contact_last_name"] = (
                    "When adding a credit card contact last name is required as eWay requires it"
                )

        if payment_method != AccountPaymentMethodType.DRIVER_COLLECT:
            attrs["driver_collect_method"] = AccountDriverCollectMethod.NONE

        payment_terms = (
            attrs["payment_terms"]
            if "payment_terms" in attrs
            else (self.instance.payment_terms if self.instance else None)
        )

        if payment_terms != AccountPaymentTermsType.COD:
            required_fields = [
                "account_email",
                "contact_first_name",
                "contact_last_name",
                "approved_by",
            ]

            for required_field in required_fields:
                # if this field is present in attrs, we dont allow it to be blank
                if required_field in attrs and not attrs[required_field]:
                    errors[required_field] = (
                        "This field is required when Payment Term is not COD."
                    )

                # if this field is not present, we will ask for it if backend record's empty
                if required_field not in attrs and (
                    not self.instance
                    or not getattr(self.instance, required_field, None)
                ):
                    errors[required_field] = (
                        "This field is required when Payment Term is not COD."
                    )

        if errors:
            raise ValidationError(errors)

        return super().validate(attrs)

    def create(self, validated_data):
        encrypted_card = validated_data.pop("encrypted_card", None)
        with transaction.atomic():
            instance: Account = super().create(validated_data)
            create_or_update_token_payment(
                instance,
                dict(
                    title=instance.contact_title,
                    first_name=instance.contact_first_name,
                    last_name=instance.contact_last_name,
                    email=instance.account_email,
                ),
                encrypted_card,
            )
        return instance

    def update(self, instance, validated_data):
        encrypted_card = validated_data.pop("encrypted_card", None)
        with transaction.atomic():
            instance: Account = super().update(instance, validated_data)
            if encrypted_card:
                create_or_update_token_payment(
                    instance,
                    dict(
                        title=instance.contact_title,
                        first_name=instance.contact_first_name,
                        last_name=instance.contact_last_name,
                        email=instance.account_email,
                    ),
                    encrypted_card,
                )
        return instance

    @transaction.atomic
    def save(self):
        instance = super().save()

        if self.link_client:
            if isinstance(self.link_client, ClientUser):
                link_client = self.link_client
            else:
                link_client = ClientUser.objects.filter(id=self.link_client).first()

            AccountToClient.objects.create(
                account=instance,
                client_user=link_client,
                is_default_account=True,
                is_account_admin=True,
            )

        return instance


# EXCLUDE all accounts already linked to designated client
class ExcludeClientUserFilter(filters.NumberFilter):
    def filter(self, qs, value):
        if not value:
            return qs
        return qs.exclude(clients=value)


# Allow filtering by payment method (needed for statement screen)
class AccountPaymentMethodFilter(filters.Filter):
    def filter(self, qs, value):
        # 'undefined', '', and None are all valid indicators that
        # this filter should not be run (all three are passed from
        # the frontend)
        if value and value not in ["", "undefined"]:
            return qs.filter(payment_method=value)
        return qs


class AccountFilterSet(filters.FilterSet):
    query = filters.Filter(method="filter_keyword_search")
    account_nickname = filters.CharFilter(lookup_expr="icontains")
    exclude_client_user = ExcludeClientUserFilter()
    payment_method = AccountPaymentMethodFilter()
    client_user = RefineClientUserChoiceFilter(field_name="clients")
    ids = ModelIdFilter(queryset=Account.objects.all())
    is_archived = filters.BooleanFilter(method="filter_is_archived")

    class Meta:
        model = Account
        fields = (
            "client_user",
            "exclude_client_user",
            "payment_method",
            "account_nickname",
            "account_no",
        )

    def filter_is_archived(self, queryset, _, is_archived):
        return queryset.exclude(archived_at__isnull=is_archived)

    def filter_by_ids(self, queryset, *args):
        ids = self.request.query_params.getlist("ids")
        return queryset.filter(pk__in=ids)

    def filter_keyword_search(self, queryset, _, keyword_search):
        if keyword_search:
            for keyword in keyword_search.split():
                filters = Q(account_nickname__icontains=keyword)
                try:
                    account_no = int(keyword)
                    filters |= Q(account_no=account_no)
                except ValueError:
                    pass
                queryset = queryset.filter(filters)
        return queryset


class AccountViewSetPermissions(ScbpAdminViewSetPermissions):
    actions_to_perms_map = {
        **ScbpArchivableViewSetPermissions.actions_to_perms_map,
        "passenger_list": ["%(app_label)s.detail_%(model_name)s"],
        "is_card_expired": ["%(app_label)s.detail_%(model_name)s"],
    }


class AccountViewSet(ScbpAdminModelArchivableViewSet):
    serializer_class = AccountSerializer
    queryset = Account.all_objects.all().order_by("account_nickname", "account_no")
    filterset_class = AccountFilterSet
    permission_classes = (AccountViewSetPermissions,)

    @action(detail=True, methods=["get"], url_path="passenger-list")
    def passenger_list(self, request, pk):
        account = self.get_object()
        return Response(
            [
                {
                    "id": atoc.client_user_id,
                    "name": " ".join(
                        [atoc.client_user.first_name, atoc.client_user.last_name]
                    ),
                    "phone": atoc.client_user.contact_phone,
                }
                for atoc in account.account_to_client.all()
                .select_related("client_user")
                .order_by("client_user__first_name", "client_user__last_name")
            ]
        )

    @action(detail=True, methods=["get"], url_path="is-card-expired")
    def is_card_expired(self, request, pk):
        account = self.get_object()
        response = account.is_credit_card_expired()
        return Response(response)


class AccountRegistration(ScbpAdminModelArchivableRegistration):
    viewset_class = AccountViewSet
    detail_fields = (
        "account_no",
        "account_nickname",
        "account_email",
        "business_name",
        "contact_title",
        "contact_first_name",
        "contact_last_name",
        "contact_phone_mobile",
        "contact_phone_landline",
        "billing_address",
        "rate_schedule",
        "category",
        "payment_terms",
        "payment_method",
        "driver_collect_method",
        "approved_by",
        "invoicing_method",
        "account_to_client",
        "credit_card",
    )

    def get_filter_names(self, filters):
        names = super().get_filter_names(filters)
        return [n for n in names if n not in ["exclude_client_user"]]

    def get_default_value(self, field, model_field=None):
        # Adding the default directly to payment_method break
        if model_field and model_field.get_attname() == "payment_method":
            return AccountPaymentMethodType.CREDIT_CARD
        return super().get_default_value(field, model_field)


admin_site.register(Account, AccountRegistration)
