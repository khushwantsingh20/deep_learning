import logging
from smtplib import SMTPException

from django.core import signing
from django.db.models import Q
from django_filters import rest_framework as filters
from rest_framework import serializers
from rest_framework import status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.settings import api_settings

from scbp_core.djrad.app.base import ScbpAppModelRegistration
from scbp_core.djrad.app.base import ScbpAppModelSerializer
from scbp_core.djrad.app.base import ScbpAppModelViewSet
from scbp_core.djrad.app.base import ScbpAppViewSetPermissions
from scbp_core.djrad.sites import app_site
from scbp_core.models import Account
from scbp_core.models import AccountToClient
from scbp_core.models import ClientUser
from scbp_core.models import User
from scbp_core.models.user_type import UserType
from scbp_core.services.generate_invite_token import generate_invite_token
from scbp_core.services.get_invitation_details_from_token import (
    get_invitation_details_from_token,
)
from scbp_core.services.send_invitation_email import send_invitation_email


class AppAccountToClientSerializer(ScbpAppModelSerializer):
    account_nickname = serializers.CharField(
        read_only=True, source="account.account_nickname"
    )
    first_name = serializers.CharField(read_only=True, source="client_user.first_name")
    last_name = serializers.CharField(read_only=True, source="client_user.last_name")
    email = serializers.CharField(read_only=True, source="client_user.email")

    class Meta:
        model = AccountToClient
        fields = (
            "account",
            "account_nickname",
            "client_user",
            "is_account_admin",
            "is_default_account",
            "first_name",
            "last_name",
            "email",
        )
        extra_kwargs = {
            "is_default_account": {
                # To change default we use the set_as_default endpoint
                "read_only": True
            }
        }


class AccountToClientFilterset(filters.FilterSet):
    class Meta:
        model = AccountToClient
        fields = ("client_user", "account")


class AccountToClientViewSetPermissions(ScbpAppViewSetPermissions):
    actions_to_perms_map = {
        "set_as_default": ["%(app_label)s.has_client_user_link_%(model_name)s"],
        "invite_account": [],
        "get_invitation_status": [],
        "get_invitation_details": [],
        "invitation_link_account": [],
    }


class AccountToClientViewSet(ScbpAppModelViewSet):
    serializer_class = AppAccountToClientSerializer
    queryset = AccountToClient.objects.none()
    pagination_class = None
    filterset_class = AccountToClientFilterset
    permission_classes = (AccountToClientViewSetPermissions,)

    def get_filter_paginator_class(self, *args, **kwargs):
        return None

    def get_queryset(self):
        if not self.request.user or self.request.user.is_anonymous:
            return AccountToClient.objects.none()

        qs = (
            AccountToClient.objects.filter(
                Q(client_user=self.request.user.get_profile())
                | Q(
                    account__account_to_client__is_account_admin=True,
                    account__account_to_client__client_user=self.request.user.get_profile(),
                )
            )
            .distinct()
            .select_related("client_user", "account")
        )
        return qs

    @action(methods=["post"], detail=True)
    def set_as_default(self, request, pk):
        instance = self.get_object()

        try:
            # Get current default account
            previous_default_account = request.user.account_to_client.get(
                is_default_account=True
            )
        except AccountToClient.DoesNotExist:
            previous_default_account = None

        # Set is default on instance, save
        instance.is_default_account = True
        instance.save()
        # Call refresh_from_db() on previous_default_account
        previous_default_account.refresh_from_db()

        serializer = self.get_serializer(
            filter(None, [instance, previous_default_account]), many=True
        )

        return Response(serializer.data)

    @action(methods=["post"], detail=False, url_path="invite-account")
    def invite_account(self, request):
        name = request.data.get("invite_name", None)
        email = request.data.get("invite_email", None)
        is_account_admin = request.data.get("is_account_admin", None)
        account = request.data.get("account", None)

        user = User.objects.filter(email__iexact=email).first()

        # Don't allow invitations to non client accounts, if the email address already exists.
        if user and user.get_profile().user_type != UserType.CLIENT:
            raise serializers.ValidationError(
                {
                    "error": "Sorry this email already exits and this person cannot accept invitations to a billing account."
                }
            )
        if not email:
            raise serializers.ValidationError(
                {"error": "You must enter an email address"}
            )
        if not account:
            raise serializers.ValidationError(
                {"error": "Something went wrong, an account has not been provided."}
            )

        data = {
            "name": name,
            "email": email,
            "is_account_admin": is_account_admin,
            "account": account,
            "is_existing_user": True if user else False,
        }

        token = generate_invite_token(data)

        try:
            send_invitation_email(
                token, request, is_existing_user=True if user else False
            )
        except SMTPException:
            message = "Sending user activation email to %s" % (data["email"])
            logging.getLogger("registration").error(message).exception()
            return Response(
                {
                    api_settings.NON_FIELD_ERRORS_KEY: (
                        "An error has occurred while sending your activation email. Please try again."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response(status=status.HTTP_200_OK)

    @action(methods=["post"], detail=False, url_path="get-invitation-details")
    def get_invitation_details(self, request):
        token = request.data["token"]

        try:
            token_data = get_invitation_details_from_token(token)
            is_existing_user = token_data["is_existing_user"]

            if is_existing_user:
                user = ClientUser.objects.get(email__iexact=token_data["email"])
                user_data = {"email": user.email, "action": "login"}
                return Response(user_data, status=status.HTTP_200_OK)

            new_user_data = {
                "name": token_data["name"],
                "email": token_data["email"],
                "action": "register",
            }

            return Response(new_user_data, status=status.HTTP_200_OK)
        except signing.BadSignature:
            return Response(
                {"error": "Something went wrong"}, status=status.HTTP_400_BAD_REQUEST
            )

    @action(methods=["post"], detail=False, url_path="get-invitation-status")
    def get_invitation_status(self, request):
        token = request.data["token"]

        try:
            token_data = get_invitation_details_from_token(token)
            token_user = ClientUser.objects.get(email__iexact=token_data["email"])
            user = self.request.user.get_profile()
            if token_user != user:
                return Response(
                    {"error": "incorrect account"}, status=status.HTTP_400_BAD_REQUEST
                )
            if request.user.account_to_client.filter(
                client_user_id=token_user.id, account=token_data["account"]
            ).exists():
                return Response(
                    {"error": "already linked account"},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            return Response(status=status.HTTP_200_OK)
        except signing.SignatureExpired:
            return Response(
                {"error": "signature expired"}, status=status.HTTP_400_BAD_REQUEST
            )
        except (signing.BadSignature, ClientUser.DoesNotExist):
            return Response({"error": "bad token"}, status=status.HTTP_400_BAD_REQUEST)

    @action(methods=["POST"], detail=False, url_path="invitation-link-account")
    def invitation_link_account(self, request):
        token = request.data["token"]
        try:
            token_data = get_invitation_details_from_token(token)

            account = Account.objects.get(id=token_data["account"])

            AccountToClient.objects.create(
                client_user=self.request.user,
                account=account,
                is_account_admin=token_data["is_account_admin"],
            )

            return Response(status=status.HTTP_200_OK)
        except signing.SignatureExpired:
            return Response(
                {"error": "signature expired"}, status=status.HTTP_400_BAD_REQUEST
            )
        except signing.BadSignature:
            return Response({"error": "bad token"}, status=status.HTTP_400_BAD_REQUEST)


class AccountToClientRegistration(ScbpAppModelRegistration):
    viewset_class = AccountToClientViewSet


app_site.register(AccountToClient, AccountToClientRegistration)
