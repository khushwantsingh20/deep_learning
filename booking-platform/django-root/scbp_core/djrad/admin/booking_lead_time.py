from djrad_rest.mixins import ListModelMixin
from djrad_rest.mixins import UpdateModelMixin
from djrad_rest.util import DjradEntityResponse
from djrad_rest.viewsets import DjradGenericViewSet

from scbp_core.djrad.admin.base import ScbpAdminModelRegistration
from scbp_core.djrad.admin.base import ScbpAdminModelSerializer
from scbp_core.djrad.admin.base import ScbpAdminViewSetPermissions
from scbp_core.djrad.sites import admin_site
from scbp_core.models import BookingLeadTime
from scbp_core.models.pricing_type import HourRateDayType


class BookingLeadTimeSerializer(ScbpAdminModelSerializer):
    class Meta:
        model = BookingLeadTime
        fields = ("day_type", "hour", "lead_time")


class BookingLeadTimeViewSet(ListModelMixin, UpdateModelMixin, DjradGenericViewSet):
    serializer_class = BookingLeadTimeSerializer
    queryset = BookingLeadTime.objects.all()
    permission_classes = (ScbpAdminViewSetPermissions,)

    def list(self, request, *args, **kwargs):
        serializer = self.get_serializer(self.get_queryset(), many=True)
        return DjradEntityResponse(
            serializer, data={"day_types": HourRateDayType.choices.items()}
        )


class BookingLeadTimeRegistration(ScbpAdminModelRegistration):
    viewset_class = BookingLeadTimeViewSet


admin_site.register(BookingLeadTime, BookingLeadTimeRegistration)
