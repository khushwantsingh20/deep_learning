from django_filters import rest_framework as filters

from scbp_core.djrad.admin import ScbpAdminModelViewSet
from scbp_core.djrad.admin.base import ScbpAdminModelRegistration
from scbp_core.djrad.admin.base import ScbpAdminModelSerializer
from scbp_core.djrad.base import ScbpFilterSet
from scbp_core.djrad.sites import admin_site
from scbp_core.models.pricing import Holiday


class HolidaySerializer(ScbpAdminModelSerializer):
    class Meta:
        model = Holiday
        fields = ("title", "date")


class HolidayFilterSet(ScbpFilterSet):
    date_from = filters.DateFilter(field_name="date", lookup_expr="gte")
    date_to = filters.DateFilter(field_name="date", lookup_expr="lte")

    class Meta:
        model = Holiday
        fields = ("date_from", "date_to")


class HolidayViewSet(ScbpAdminModelViewSet):
    serializer_class = HolidaySerializer
    queryset = Holiday.objects.all()
    filterset_class = HolidayFilterSet


class HolidayRegistration(ScbpAdminModelRegistration):
    viewset_class = HolidayViewSet


admin_site.register(Holiday, HolidayRegistration)
