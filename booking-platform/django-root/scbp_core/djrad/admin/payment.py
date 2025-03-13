from typing import Sequence

from djrad_rest.util import DjradEntityResponse
from rest_framework import serializers
from rest_framework.decorators import action

from scbp_core.djrad.admin import ScbpAdminModelRegistration
from scbp_core.djrad.admin import ScbpAdminModelSerializer
from scbp_core.djrad.admin import ScbpAdminModelViewSet
from scbp_core.djrad.admin import ScbpAdminViewSetPermissions
from scbp_core.djrad.admin.invoice import InvoiceSerializer
from scbp_core.djrad.sites import admin_site
from scbp_core.models import PaymentRecord
from scbp_core.models import PaymentStatus


class PaymentSerializer(ScbpAdminModelSerializer):
    amount = serializers.SerializerMethodField()
    payment_number = serializers.SerializerMethodField()
    invoice = InvoiceSerializer(read_only=True)
    invoices = InvoiceSerializer(many=True, read_only=True)

    class Meta:
        model = PaymentRecord
        fields = (
            "payment_number",
            "invoice",
            "invoices",
            "updated_at",
            "account",
            "amount",
            "payment_method",
            "error_message",
        )

    def get_amount(self, instance: PaymentRecord):
        return instance.base_amount + instance.get_expected_surcharge()

    def get_payment_number(self, instance: PaymentRecord):
        return instance.get_payment_number()


class PaymentViewSetPermissions(ScbpAdminViewSetPermissions):
    actions_to_perms_map = {
        "recharge_payment": ScbpAdminViewSetPermissions.default_actions_to_perms_map[
            "update"
        ],
        "mark_paid": ScbpAdminViewSetPermissions.default_actions_to_perms_map["update"],
    }


class PaymentViewSet(ScbpAdminModelViewSet):
    serializer_class = PaymentSerializer
    queryset = PaymentRecord.objects.exclude(status=PaymentStatus.SUCCESS).order_by(
        "-updated_at"
    )
    permission_classes = (PaymentViewSetPermissions,)

    @action(methods=["post"], detail=True)
    def recharge_payment(self, request, pk):
        deleted_entities = None
        record = self.get_object()
        record.process(defer=False, send_email=True)
        # record is stale after charge - refresh to get latest status
        record.refresh_from_db()
        if record.status == PaymentStatus.SUCCESS:
            deleted_entities = {"scbp_core.payment": [record.id]}
        return DjradEntityResponse(
            deleted_entities=deleted_entities,
            data={"status": record.status, "message": record.error_message},
        )

    @action(methods=["post"], detail=True)
    def mark_paid(self, request, pk):
        record = self.get_object()
        record.status = PaymentStatus.SUCCESS
        record.error_message = "Success manually recorded"
        record.save()
        return DjradEntityResponse(
            deleted_entities={"scbp_core.payment": [record.id]},
            data={"status": record.status, "message": record.error_message},
        )


class PaymentRegistration(ScbpAdminModelRegistration):
    viewset_class = PaymentViewSet

    action_permissions = {
        **ScbpAdminModelRegistration.action_permissions,
        "recharge_payment": ScbpAdminModelRegistration.action_permissions["update"],
        "mark_paid": ScbpAdminModelRegistration.action_permissions["update"],
    }

    def get_object_actions(self) -> Sequence[str]:
        return super().get_object_actions() + ["recharge_payment", "mark_paid"]


admin_site.register(PaymentRecord, PaymentRegistration)
