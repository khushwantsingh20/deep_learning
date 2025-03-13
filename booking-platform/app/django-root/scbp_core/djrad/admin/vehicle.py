from scbp_core.djrad.admin.base import ScbpAdminModelArchivableRegistration
from scbp_core.djrad.admin.base import ScbpAdminModelArchivableViewSet
from scbp_core.djrad.admin.base import ScbpAdminModelSerializer
from scbp_core.djrad.sites import admin_site
from scbp_core.models import Vehicle


class VehicleSerializer(ScbpAdminModelSerializer):
    class Meta:
        model = Vehicle
        fields = (
            "car_no",
            "commerical_passenger_vehicle_license",
            "make",
            "model",
            "year_of_manufacture",
            "odometer",
            "car_class",
            "color",
            "inspection_date",
            "radio_serial_no",
            "vehicle_operator",
        )


class VehicleViewSet(ScbpAdminModelArchivableViewSet):
    serializer_class = VehicleSerializer
    queryset = Vehicle.objects.all()
    pagination_class = None


class VehicleRegistration(ScbpAdminModelArchivableRegistration):
    viewset_class = VehicleViewSet


admin_site.register(Vehicle, VehicleRegistration)
