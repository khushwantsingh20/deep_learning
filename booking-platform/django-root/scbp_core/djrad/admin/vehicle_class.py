from djrad_rest.serializers import RelatedLookupSerializer
from djrad_rest.util import DjradEntityResponse
from rest_framework.decorators import action

from scbp_core.djrad.admin import ScbpAdminModelViewSet
from scbp_core.djrad.admin.base import ScbpAdminModelRegistration
from scbp_core.djrad.admin.base import ScbpAdminModelSerializer
from scbp_core.djrad.admin.base import ScbpAdminViewSetPermissions
from scbp_core.djrad.sites import admin_site
from scbp_core.models import VehicleClass


class VehicleClassRelatedLookupSerializer(RelatedLookupSerializer):
    def get___str__(self, instance):
        if instance.abbreviation:
            return instance.abbreviation
        return str(instance)


class VehicleClassSerializer(ScbpAdminModelSerializer):
    class Meta:
        model = VehicleClass
        fields = (
            "title",
            "abbreviation",
            "description",
            "max_passenger_count",
            "max_baggage_count",
            "max_child_seat_count",
            "image",
            "available_colors",
            "is_any_class",
            "is_first_child_seat_free",
            "is_interstate",
            "min_hourly_surcharge_fixed",
            "min_hourly_surcharge_perc",
            "one_way_pickup_rate",
            "one_way_off_peak_pickup_rate",
            "one_way_rate_tier1",
            "one_way_rate_tier2",
            "one_way_rate_tier3",
            "one_way_off_peak_rate_tier1",
            "one_way_off_peak_rate_tier2",
            "one_way_off_peak_rate_tier3",
        )


class VehicleClassViewSetPermissions(ScbpAdminViewSetPermissions):
    actions_to_perms_map = {
        "move_up": ["%(app_label)s.change_%(model_name)s"],
        "move_down": ["%(app_label)s.change_%(model_name)s"],
    }


class VehicleClassViewSet(ScbpAdminModelViewSet):
    serializer_class = VehicleClassSerializer
    queryset = VehicleClass.objects.all()
    pagination_class = None
    permission_classes = (VehicleClassViewSetPermissions,)

    @action(methods=["POST"], detail=True, url_path="move-up")
    def move_up(self, request, pk):
        vehicle_class = self.get_object()
        vehicle_class.up()

        return DjradEntityResponse(self.get_serializer(self.get_queryset(), many=True))

    @action(methods=["POST"], detail=True, url_path="move-down")
    def move_down(self, request, pk):
        vehicle_class = self.get_object()
        vehicle_class.down()

        return DjradEntityResponse(self.get_serializer(self.get_queryset(), many=True))


class VehicleClassRegistration(ScbpAdminModelRegistration):
    viewset_class = VehicleClassViewSet

    action_permissions = {
        **ScbpAdminModelRegistration.action_permissions,
        "move_up": ["%(app_label)s.change_%(model_name)s"],
        "move_down": ["%(app_label)s.change_%(model_name)s"],
    }

    def get_object_actions(self):
        return super().get_object_actions() + ["move_up", "move_down"]


admin_site.register(VehicleClass, VehicleClassRegistration)
