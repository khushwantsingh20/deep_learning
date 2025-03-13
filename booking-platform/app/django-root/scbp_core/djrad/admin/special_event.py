from django_filters import rest_framework as filters

from scbp_core.djrad.admin import ScbpAdminModelViewSet
from scbp_core.djrad.admin.base import ScbpAdminModelRegistration
from scbp_core.djrad.admin.base import ScbpAdminModelSerializer
from scbp_core.djrad.base import ScbpFilterSet
from scbp_core.djrad.sites import admin_site
from scbp_core.models.pricing import SpecialEvent


class SpecialEventSerializer(ScbpAdminModelSerializer):
    class Meta:
        model = SpecialEvent
        fields = (
            "title",
            "date",
            "start_time",
            "end_time",
            "pickup_postcode",
            "dropoff_postcode",
            "event_surcharge",
            "event_minimum_hours",
            "event_minimum_charge",
        )


class SpecialEventFilterSet(ScbpFilterSet):
    date_from = filters.DateFilter(field_name="date", lookup_expr="gte")
    date_to = filters.DateFilter(field_name="date", lookup_expr="lte")

    class Meta:
        model = SpecialEvent
        fields = ("date_from", "date_to")


class SpecialEventViewSet(ScbpAdminModelViewSet):
    serializer_class = SpecialEventSerializer
    queryset = SpecialEvent.objects.all()
    filterset_class = SpecialEventFilterSet


class SpecialEventRegistration(ScbpAdminModelRegistration):
    viewset_class = SpecialEventViewSet


admin_site.register(SpecialEvent, SpecialEventRegistration)
