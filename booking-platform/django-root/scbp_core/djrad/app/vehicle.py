from djrad_rest import mixins
from djrad_rest.viewsets import DjradGenericViewSet

from scbp_core.djrad.app.base import ScbpAppModelRegistration
from scbp_core.djrad.app.base import ScbpAppModelSerializer
from scbp_core.djrad.sites import app_site
from scbp_core.models import VehicleClass
from scbp_core.models import VehicleColor


class VehicleColorSerializer(ScbpAppModelSerializer):
    class Meta:
        model = VehicleColor
        fields = ("title", "color_code")


class VehicleClassSerializer(ScbpAppModelSerializer):
    available_colors = VehicleColorSerializer(many=True)

    class Meta:
        model = VehicleClass
        fields = (
            "title",
            "description",
            "max_passenger_count",
            "max_baggage_count",
            "max_child_seat_count",
            "image",
            "available_colors",
            "is_any_class",
            "is_first_child_seat_free",
            "is_interstate",
        )


class VehicleClassViewSet(
    DjradGenericViewSet, mixins.ListModelMixin, mixins.RetrieveModelMixin
):
    serializer_class = VehicleClassSerializer
    queryset = VehicleClass.objects.all()
    permission_classes = []
    pagination_class = None


class VehicleClassRegistration(ScbpAppModelRegistration):
    viewset_class = VehicleClassViewSet

    def get_related_lookup_field_names(self):
        return []


vehicle_class_registration = app_site.register(VehicleClass, VehicleClassRegistration)
