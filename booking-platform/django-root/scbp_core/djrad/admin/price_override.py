from scbp_core.djrad.admin import ScbpAdminModelViewSet
from scbp_core.djrad.admin.base import ScbpAdminModelRegistration
from scbp_core.djrad.admin.base import ScbpAdminModelSerializer
from scbp_core.djrad.sites import admin_site
from scbp_core.models.pricing import PriceOverride


class PriceOverrideSerializer(ScbpAdminModelSerializer):
    class Meta:
        model = PriceOverride
        fields = (
            "account",
            "from_postcode",
            "to_postcode",
            "start_time",
            "end_time",
            "fixed_cost",
            "is_all_day",
        )


class PriceOverrideViewSet(ScbpAdminModelViewSet):
    serializer_class = PriceOverrideSerializer
    queryset = PriceOverride.objects.all()

    related_lookup_filter_fields = {"account": ("account_nickname", "account_no")}


class PriceOverrideRegistration(ScbpAdminModelRegistration):
    viewset_class = PriceOverrideViewSet


admin_site.register(PriceOverride, PriceOverrideRegistration)
