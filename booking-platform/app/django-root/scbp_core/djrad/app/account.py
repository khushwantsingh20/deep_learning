from django.db import transaction
from djrad_rest.util import DjradEntityResponse
from rest_framework import serializers
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from rest_framework.generics import get_object_or_404
from rest_framework.response import Response

from eway.serializers import EwayEncryptedCardSerializer
from scbp_core.djrad.app.base import ScbpAppModelRegistration
from scbp_core.djrad.app.base import ScbpAppModelSerializer
from scbp_core.djrad.app.base import ScbpAppModelViewSet
from scbp_core.djrad.app.base import ScbpAppViewSetPermissions
from scbp_core.djrad.common.account import create_or_update_token_payment
from scbp_core.djrad.common.creditcard import CreditCardSerializer
from scbp_core.djrad.sites import app_site
from scbp_core.models import Account
from scbp_core.models import AccountInvoicingMethodType
from scbp_core.models import AccountPaymentMethodType
from scbp_core.models import AccountToClient
from scbp_core.models import ClientUser
from scbp_core.services.accounts import set_account_for_session


class AppAccountSerializer(ScbpAppModelSerializer):
    account_email = serializers.CharField(read_only=True)
    contact_first_name = serializers.CharField(read_only=True)
    contact_last_name = serializers.CharField(read_only=True)

    credit_card = CreditCardSerializer()
    encrypted_card = EwayEncryptedCardSerializer(required=False, allow_null=True)

    class Meta:
        model = Account
        # WARNING: READ ME BEFORE MODIFYING THIS LIST OF FIELDS
        # If you add new fields you MUST test that a non-admin account user can still
        # properly interact with the frontend. See TODO in ScbpAppSite.get_active_account_context
        # for more details.
        fields = (
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
            "payment_terms",
            "payment_method",
            "invoicing_method",
            "category",
            "credit_card",
            "encrypted_card",
            "credit_card_expiry_month",
            "credit_card_expiry_year",
        )
        extra_kwargs = {
            "payment_method": {"default": AccountPaymentMethodType.CREDIT_CARD},
            "invoicing_method": {"default": AccountInvoicingMethodType.EMAIL},
        }

    def validate(self, attrs):
        encrypted_card = attrs.get("encrypted_card", None)
        if not encrypted_card and (
            not self.instance or not self.instance.eway_token_customer_id
        ):
            raise ValidationError("You need to link a credit card to this account.")
        return super().validate(attrs)

    def create(self, validated_data):
        encrypted_card = validated_data.pop("encrypted_card")
        with transaction.atomic():
            instance: Account = super().create(validated_data)
            user = self.context["request"].user
            client_user: ClientUser = user.get_profile()
            create_or_update_token_payment(
                instance,
                dict(
                    title=client_user.title,
                    first_name=client_user.first_name,
                    last_name=client_user.last_name,
                    email=client_user.email,
                ),
                encrypted_card,
            )
        return instance

    def update(self, instance, validated_data):
        encrypted_card = validated_data.pop("encrypted_card", None)
        with transaction.atomic():
            instance: Account = super().update(instance, validated_data)
            if encrypted_card:
                user = self.context["request"].user
                client_user: ClientUser = user.get_profile()
                create_or_update_token_payment(
                    instance,
                    dict(
                        title=client_user.title,
                        first_name=client_user.first_name,
                        last_name=client_user.last_name,
                        email=client_user.email,
                    ),
                    encrypted_card,
                )
        return instance

    def save(self, **kwargs):
        if not self.instance:
            user = self.context["request"].user
            email = user.email
            first_name = user.first_name
            last_name = user.last_name

            with transaction.atomic():
                account = super().save(
                    account_email=email,
                    contact_first_name=first_name,
                    contact_last_name=last_name,
                    **kwargs,
                )

                AccountToClient.objects.create(
                    client_user=user, account=account, is_account_admin=True
                )
        else:
            account = super().save(**kwargs)

        return account


class AppAccountViewSetPermissions(ScbpAppViewSetPermissions):
    actions_to_perms_map = {
        "set_active_for_session": ["%(app_label)s.travel_access_%(model_name)s"],
        # If you can travel you can list passengers. We add further restrictions in passenger_list
        "passenger_list": ["%(app_label)s.travel_access_%(model_name)s"],
        "is_card_expired": ["%(app_label)s.detail_%(model_name)s"],
        "archive": ["%(app_label)s.change_%(model_name)s"],
    }


class AppAccountViewSet(ScbpAppModelViewSet):
    serializer_class = AppAccountSerializer
    permission_classes = (AppAccountViewSetPermissions,)
    queryset = Account.all_objects.none()

    def get_queryset(self, list_view=False):
        if not self.request.user or self.request.user.is_anonymous:
            return Account.objects.none()
        profile = self.request.user.get_profile()
        if not isinstance(profile, ClientUser):
            return Account.objects.none()
        qs = Account.objects.filter(
            account_to_client__client_user=profile,
            account_to_client__archived_at__isnull=True,
        ).distinct()
        if list_view:
            # Only admins can get a listing. Non-admins can get their accounts from
            # AccountToClient
            qs = qs.filter(
                account_to_client__is_account_admin=True,
            )
        return qs

    def list(self, request, *args, **kwargs):
        """Only difference here is passing list_view=True to get_queryset"""
        queryset = self.filter_queryset(self.get_queryset(list_view=True))

        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    @action(methods=["POST"], detail=True)
    def archive(self, request, pk):
        instance = self.get_object()
        instance.archive(request.user)
        return DjradEntityResponse(
            deleted_entities={AppAccountSerializer: [instance.id]}
        )

    @action(detail=True, methods=["post"], url_path="set-active-for-session")
    def set_active_for_session(self, request, pk):
        account = self.get_object()
        set_account_for_session(request, account)
        return Response(self.get_serializer(account).data)

    @action(detail=True, methods=["get"], url_path="is-card-expired")
    def is_card_expired(self, request, pk):
        account = self.get_object()
        response = account.is_credit_card_expired()
        return Response(response)

    @action(detail=True, methods=["get"], url_path="passenger-list")
    def passenger_list(self, request, pk):
        account = self.get_object()
        account_to_client = get_object_or_404(
            account.account_to_client, client_user=request.user.get_profile()
        )
        if not account_to_client.is_account_admin:
            # You can only book for other users if you have management permissions
            return Response(
                [
                    # Return the current user as the only available passenger
                    {
                        "id": account_to_client.client_user_id,
                        "name": account_to_client.client_user.get_full_name(),
                        "phone": account_to_client.client_user.contact_phone,
                    }
                ]
            )

        return Response(
            [
                {
                    "id": atoc.client_user_id,
                    "name": atoc.client_user.get_full_name(),
                    "phone": atoc.client_user.contact_phone,
                }
                for atoc in account.account_to_client.all()
                .select_related("client_user")
                .order_by("client_user__first_name", "client_user__last_name")
            ]
        )


class AppAccountRegistration(ScbpAppModelRegistration):
    viewset_class = AppAccountViewSet

    action_permissions = {
        **ScbpAppModelRegistration.action_permissions,
        "user_management": ["%(app_label)s.user_management_%(model_name)s"],
        "archive": ["%(app_label)s.delete_%(model_name)s"],
    }

    def get_object_actions(self):
        return super().get_object_actions() + ["archive", "user_management"]


account_registration = app_site.register(Account, AppAccountRegistration)
