from djrad_rest.mixins import ListModelMixin
from djrad_rest.mixins import UpdateModelMixin
from djrad_rest.util import DjradEntityResponse
from djrad_rest.viewsets import DjradGenericViewSet

from scbp_core.djrad.admin.base import ScbpAdminModelRegistration
from scbp_core.djrad.admin.base import ScbpAdminModelSerializer
from scbp_core.djrad.admin.base import ScbpAdminViewSetPermissions
from scbp_core.djrad.sites import admin_site
from scbp_core.models import HourRateType
from scbp_core.models.pricing_type import HourRateDayType


class HourRateTypeSerializer(ScbpAdminModelSerializer):
    class Meta:
        model = HourRateType
        fields = ("day_type", "hour", "hour_type")


class HourRateTypeViewSet(ListModelMixin, UpdateModelMixin, DjradGenericViewSet):
    serializer_class = HourRateTypeSerializer
    queryset = HourRateType.objects.all()
    permission_classes = (ScbpAdminViewSetPermissions,)

    def list(self, request, *args, **kwargs):
        serializer = self.get_serializer(self.get_queryset(), many=True)
        return DjradEntityResponse(
            serializer, data={"day_types": HourRateDayType.choices.items()}
        )


class HourRateTypeRegistration(ScbpAdminModelRegistration):
    viewset_class = HourRateTypeViewSet


admin_site.register(HourRateType, HourRateTypeRegistration)
