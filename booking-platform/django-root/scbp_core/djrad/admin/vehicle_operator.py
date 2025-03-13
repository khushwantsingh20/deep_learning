from djrad_rest.registration.fields import CharFieldDescriptor
from djrad_rest.registration.fields import ListFieldContainerDescriptor
from rest_framework.fields import SerializerMethodField

from scbp_core.djrad.admin.base import ScbpAdminModelArchivableRegistration
from scbp_core.djrad.admin.base import ScbpAdminModelArchivableViewSet
from scbp_core.djrad.admin.base import ScbpAdminModelSerializer
from scbp_core.djrad.sites import admin_site
from scbp_core.models import VehicleOperator


class VehicleOperatorSerializer(ScbpAdminModelSerializer):
    vehicles = SerializerMethodField()
    contact_full_name = SerializerMethodField()

    class Meta:
        model = VehicleOperator
        fields = (
            "vehicle_operator_no",
            "company_name",
            "lat",
            "long",
            "address",
            "abn",
            "is_abn_verified",
            "contact_title",
            "contact_first_name",
            "contact_last_name",
            "contact_phone",
            "contact_mobile",
            "contact_email",
            "classification",
            "has_agreement_with_sc",
            "agreement_date",
            "renewal_date",
            "service_fee_percent",
            "marketing_levy",
            "monthly_depot_fee",
            "bank_name",
            "bank_account_name",
            "bank_bsb",
            "bank_account_number",
            "contact_full_name",
            "vehicles",
        )
        extra_kwargs = {"lat": {"write_only": True}, "long": {"write_only": True}}

    def get_vehicles(self, instance):
        return [str(vehicle) for vehicle in instance.vehicles.all()]

    def get_contact_full_name(self, instance):
        return f"{instance.contact_first_name} {instance.contact_last_name}"


class VehicleOperatorViewSet(ScbpAdminModelArchivableViewSet):
    serializer_class = VehicleOperatorSerializer
    queryset = VehicleOperator.objects.all().order_by("company_name")
    pagination_class = None


class VehicleOperatorRegistration(ScbpAdminModelArchivableRegistration):
    viewset_class = VehicleOperatorViewSet

    def create_field_descriptor(self, serializer, field_name, *args, **kwargs):
        if field_name == "vehicles":
            return CharFieldDescriptor(
                "vehicles",
                label="Vehicles",
                contained_in=ListFieldContainerDescriptor(),
            )
        else:
            return super().create_field_descriptor(
                serializer, field_name, *args, **kwargs
            )


admin_site.register(VehicleOperator, VehicleOperatorRegistration)
