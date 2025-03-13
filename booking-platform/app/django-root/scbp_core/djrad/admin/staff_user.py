from django.db.models import Value
from django.db.models.functions import Concat
from django_filters import OrderingFilter
from django_filters import rest_framework as filters

from scbp_core.djrad.admin.base import ScbpAdminModelArchivableViewSet
from scbp_core.djrad.admin.user import AdminUserArchivableRegistration
from scbp_core.djrad.base import ScbpFilterSet
from scbp_core.djrad.common.user import BaseUserSerializer
from scbp_core.djrad.sites import admin_site
from scbp_core.models import StaffUser


class StaffUserSerializer(BaseUserSerializer):
    class Meta:
        model = StaffUser
        fields = (
            "name",
            "first_name",
            "last_name",
            "email",
            "password",
            "confirm_password",
            "activated_at",
            "user_type",
            "is_active",
        )


class StaffUserFilterSet(ScbpFilterSet):
    name = filters.CharFilter(method="filter_name")
    email = filters.CharFilter(lookup_expr="icontains")
    date_joined = filters.DateFromToRangeFilter()

    ordering = OrderingFilter(
        fields=(("email", "email"), ("first_name", "name"), ("last_name", "name"))
    )

    class Meta:
        model = StaffUser
        fields = (
            "name",
            "email",
            "is_superuser",
            "date_joined",
            "user_type",
            "is_active",
        )

    def filter_name(self, queryset, name, value):
        return queryset.annotate(
            name=Concat("first_name", Value(" "), "last_name")
        ).filter(name__icontains=value)


class StaffUserViewSet(ScbpAdminModelArchivableViewSet):
    serializer_class = StaffUserSerializer
    queryset = StaffUser.all_objects.all().annotate(
        name=Concat("first_name", Value(" "), "last_name")
    )
    filterset_class = StaffUserFilterSet


class StaffUserRegistration(AdminUserArchivableRegistration):
    viewset_class = StaffUserViewSet


admin_site.register(StaffUser, StaffUserRegistration)
