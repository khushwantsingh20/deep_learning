from scbp_core.djrad.admin import ScbpAdminModelViewSet
from scbp_core.djrad.admin.base import ScbpAdminModelRegistration
from scbp_core.djrad.admin.base import ScbpAdminModelSerializer
from scbp_core.djrad.sites import admin_site
from scbp_core.models import VehicleColor


class VehicleColorSerializer(ScbpAdminModelSerializer):
    class Meta:
        model = VehicleColor
        fields = ("title", "color_abbreviation", "color_code")


class VehicleColorViewSet(ScbpAdminModelViewSet):
    serializer_class = VehicleColorSerializer
    queryset = VehicleColor.objects.all()
    pagination_class = None


class VehicleColorRegistration(ScbpAdminModelRegistration):
    viewset_class = VehicleColorViewSet


admin_site.register(VehicleColor, VehicleColorRegistration)
