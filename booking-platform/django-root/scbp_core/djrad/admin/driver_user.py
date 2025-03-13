from django.db.models import Value
from django.db.models.functions import Concat
from django_filters import OrderingFilter
from django_filters import rest_framework as filters
from djrad_rest.util import DjradEntityResponse
from rest_framework.fields import SerializerMethodField

from scbp_core.djrad.admin.base import ScbpAdminModelArchivableViewSet
from scbp_core.djrad.admin.user import AdminUserArchivableRegistration
from scbp_core.djrad.base import ScbpFilterSet
from scbp_core.djrad.common.user import BaseUserSerializer
from scbp_core.djrad.sites import admin_site
from scbp_core.models.user import DriverUser


class DriverUserSerializer(BaseUserSerializer):
    dispatch_label = SerializerMethodField()

    class Meta:
        model = DriverUser
        fields = (
            "name",
            "first_name",
            "last_name",
            "email",
            "activated_at",
            "driver_no",
            "title",
            "home_phone",
            "mobile",
            "date_of_birth",
            "address",
            "partner_name",
            "partner_phone",
            "commision_rate",
            "has_driver_agreement_signed",
            "abn",
            "is_abn_verified",
            "start_date",
            "end_date",
            "drivers_license_number",
            "drivers_license_expiry_date",
            "driver_certificate_number",
            "driver_certificate_expiry_date",
            "operations_manual_number",
            "operations_manual_version",
            "operations_manual_issued_date",
            "operations_manual_returned_date",
            "dispatch_label",
            "is_active",
            "current_vehicle",
        )
        extra_kwargs = {
            "first_name": {"required": True},
            "last_name": {"required": True},
        }

    def get_dispatch_label(self, instance):
        return f"{instance.driver_no} - {instance.first_name} {instance.last_name}"


class DriverUserFilterSet(ScbpFilterSet):
    name = filters.CharFilter(method="filter_name")
    email = filters.CharFilter(lookup_expr="icontains")
    date_joined = filters.DateFromToRangeFilter()

    ordering = OrderingFilter(
        fields=(("email", "email"), ("first_name", "name"), ("last_name", "name"))
    )

    class Meta:
        model = DriverUser
        fields = (
            "name",
            "email",
            "is_superuser",
            "date_joined",
            "is_active",
        )

    def filter_name(self, queryset, name, value):
        return queryset.annotate(
            name=Concat("first_name", Value(" "), "last_name")
        ).filter(name__icontains=value)


class DriverUserViewSet(ScbpAdminModelArchivableViewSet):
    serializer_class = DriverUserSerializer
    queryset = DriverUser.all_objects.order_by("driver_no", "start_date").annotate(
        name=Concat("first_name", Value(" "), "last_name")
    )
    filterset_class = DriverUserFilterSet

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop("partial", False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)

        if getattr(instance, "_prefetched_objects_cache", None):
            # If 'prefetch_related' has been applied to a queryset, we need to
            # forcibly invalidate the prefetch cache on the instance.
            instance._prefetched_objects_cache = {}

        extra_data = {}
        if instance.current_vehicle:
            existing = DriverUser.objects.exclude(pk=instance.pk).filter(
                current_vehicle=instance.current_vehicle
            )
            if existing:
                extra_data["other_drivers"] = []
                for driver in existing:
                    extra_data["other_drivers"].append(
                        {"name": driver.get_full_name(), "id": driver.pk}
                    )
        return DjradEntityResponse(serializer, data=extra_data)


class DriverUserRegistration(AdminUserArchivableRegistration):
    viewset_class = DriverUserViewSet


admin_site.register(DriverUser, DriverUserRegistration)
