from djrad_rest.mixins import UpdateModelMixin
from djrad_rest.util import DjradEntityResponse
from djrad_rest.viewsets import DjradGenericViewSet
from rest_framework.decorators import action

from scbp_core.djrad.admin.base import ScbpAdminModelRegistration
from scbp_core.djrad.admin.base import ScbpAdminModelSerializer
from scbp_core.djrad.admin.base import ScbpAdminViewSetPermissions
from scbp_core.djrad.sites import admin_site
from scbp_core.models import PriceList


class PriceListSerializer(ScbpAdminModelSerializer):
    class Meta:
        model = PriceList
        fields = (
            "hourly_initial_fee",
            "hourly_tier1_start_at",
            "hourly_tier2_start_at",
            "block_size_minutes",
            "hourly_tier1_rate_per_block",
            "hourly_tier2_rate_per_block",
            "out_of_area_boundary_km",
            "interstate_fee",
            "airport_surcharge",
            "airport_parking_fee",
            "government_booking_fee",
            "company_booking_fee",
            "off_peak_discount_percentage",
            "peak_percent",
            "peak_max_amount",
            "out_of_hours_fee",
            "public_holiday_out_of_hours_fee",
            "public_holiday_fee",
            "off_peak_minimum_fee",
            "standard_minimum_fee",
            "saturday_night_minimum_fee",
            "wedding_ribbon_fee",
            "child_seat_fee",
            "additional_stop_fee",
            "color_selection_fee",
            "car_park_pass_fee",
            "rate_schedule_standard",
            "rate_schedule_retail",
            "rate_schedule_corporate",
            "rate_schedule_institution",
            "scheduled_from",
        )


class PriceListViewSetPermissions(ScbpAdminViewSetPermissions):
    actions_to_perms_map = {
        "current": ScbpAdminViewSetPermissions.default_actions_to_perms_map["list"],
        "future": ScbpAdminViewSetPermissions.default_actions_to_perms_map["list"],
    }


class PriceListViewSet(UpdateModelMixin, DjradGenericViewSet):
    serializer_class = PriceListSerializer
    queryset = PriceList.objects.all()
    permission_classes = (PriceListViewSetPermissions,)

    def perform_update(self, serializer):
        serializer.save(created_by=self.request.user)

    @action(methods=["GET"], detail=False)
    def current(self, request):
        return DjradEntityResponse(self.get_serializer(PriceList.get_current()))

    @action(methods=["GET"], detail=False)
    def future(self, request):
        return DjradEntityResponse(self.get_serializer(PriceList.get_future()))


class PriceListRegistration(ScbpAdminModelRegistration):
    viewset_class = PriceListViewSet

    action_permissions = {**ScbpAdminModelRegistration.action_permissions}


admin_site.register(PriceList, PriceListRegistration)
