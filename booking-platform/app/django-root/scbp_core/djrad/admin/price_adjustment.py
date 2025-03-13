from scbp_core.djrad.admin import ScbpAdminModelViewSet
from scbp_core.djrad.admin.base import ScbpAdminModelRegistration
from scbp_core.djrad.admin.base import ScbpAdminModelSerializer
from scbp_core.djrad.sites import admin_site
from scbp_core.models.pricing import PriceAdjustment


class PriceAdjustmentSerializer(ScbpAdminModelSerializer):
    class Meta:
        model = PriceAdjustment
        fields = ("from_postcode", "to_postcode", "percentage")


class PriceAdjustmentViewSet(ScbpAdminModelViewSet):
    serializer_class = PriceAdjustmentSerializer
    queryset = PriceAdjustment.objects.all()


class PriceAdjustmentRegistration(ScbpAdminModelRegistration):
    viewset_class = PriceAdjustmentViewSet


admin_site.register(PriceAdjustment, PriceAdjustmentRegistration)
