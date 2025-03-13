import warnings

from django_filters import rest_framework as filters
from djrad_rest.viewsets import DjradDjangoFilterBackend
from rest_framework import serializers
from rest_framework.exceptions import ValidationError
from rest_framework.fields import SerializerMethodField
from rest_framework.response import Response

from scbp_core.djrad.admin.base import ScbpAdminModelRegistration
from scbp_core.djrad.admin.base import ScbpAdminModelSerializer
from scbp_core.djrad.admin.base import ScbpAdminModelViewSet
from scbp_core.djrad.base import ScbpOrderingFilter
from scbp_core.djrad.sites import admin_site
from scbp_core.models import AccountToClient


class AccountToClientSerializer(ScbpAdminModelSerializer):
    account_name = SerializerMethodField()
    client_name = SerializerMethodField()
    client_email = serializers.EmailField(
        read_only=True, source="client_user.email", required=False
    )

    class Meta:
        model = AccountToClient
        fields = (
            "account",
            "account_name",
            "client_user",
            "client_name",
            "client_email",
            "is_account_admin",
        )

    def get_account_name(self, instance):
        return str(instance.account)

    def get_client_name(self, instance):
        return f"{instance.client_user.first_name} {instance.client_user.last_name}"


class AccountToClientFilterSet(filters.FilterSet):
    class Meta:
        model = AccountToClient
        fields = ("client_user", "account", "is_default_account")


class ACTFilterBackend(DjradDjangoFilterBackend):
    def filter_queryset(self, request, queryset, view):
        try:
            super(DjradDjangoFilterBackend, self).filter_queryset(
                request, queryset, view
            )
        except ValidationError:
            return queryset.none()
        return super().filter_queryset(request, queryset, view)


class AccountToClientViewSet(ScbpAdminModelViewSet):
    serializer_class = AccountToClientSerializer
    queryset = AccountToClient.objects.all()
    pagination_class = None
    filterset_class = AccountToClientFilterSet
    filter_backends = (ACTFilterBackend, ScbpOrderingFilter)

    def list(self, request, *args, **kwargs):
        if not request.query_params.get("clientUser") and not request.query_params.get(
            "account"
        ):
            warnings.warn(
                "AccountToClientFilterFilterSet must be filtered with either account or "
                "client_user - unfiltered results are not available due to being unpaginated"
            )
            return Response([])
        return super().list(request, *args, **kwargs)

    def get_filter_paginator_class(self, *args, **kwargs):
        return None


class AccountToClientRegistration(ScbpAdminModelRegistration):
    viewset_class = AccountToClientViewSet


admin_site.register(AccountToClient, AccountToClientRegistration)
