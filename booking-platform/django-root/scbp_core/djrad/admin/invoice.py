from django.db import models
from django.db.models import Q
from django.http import HttpResponse
from django_filters import BooleanFilter
from django_filters import CharFilter
from django_filters import DateFromToRangeFilter
from django_filters import RangeFilter
from djrad_rest import mixins
from djrad_rest.viewsets import DjradGenericViewSet
from rest_framework import serializers
from rest_framework import status
from rest_framework.decorators import action
from rest_framework.response import Response

from scbp_core.djrad.admin import ScbpAdminViewSetPermissions
from scbp_core.djrad.admin.base import ScbpAdminModelRegistration
from scbp_core.djrad.admin.base import ScbpAdminModelSerializer
from scbp_core.djrad.admin.filters import RefineAccountChoiceFilter
from scbp_core.djrad.admin.filters import RefineClientUserChoiceFilter
from scbp_core.djrad.base import ScbpFilterSet
from scbp_core.djrad.base import ScbpModelBaseViewSet
from scbp_core.djrad.sites import admin_site
from scbp_core.models import Invoice
from scbp_core.services.generate_invoice_pdf import generate_invoice_pdf
from scbp_core.services.send_invoice_email import send_invoice_email


class InvoiceFilterSet(ScbpFilterSet):
    booking_number = CharFilter(field_name="booking__booking_number")
    account = RefineAccountChoiceFilter(field_name="booking__account")
    client_user = RefineClientUserChoiceFilter(field_name="booking__client_user")
    issued_on_range = DateFromToRangeFilter(
        field_name="issued_on", label="Invoice Date"
    )
    invoice_total_amount = RangeFilter()
    is_interstate = BooleanFilter(
        label="Interstate Booking", method="filter_is_interstate"
    )

    class Meta:
        model = Invoice
        fields = (
            "invoice_number",
            "booking_number",
            "client_user",
            "account",
            "issued_on_range",
            "invoice_total_amount",
            "payment_method",
            "is_interstate",
        )

    def filter_is_interstate(self, queryset, _, is_interstate):
        return queryset.annotate(
            is_booking_interstate=models.Case(
                models.When(
                    ~Q(booking__from_address__postal_code__startswith="3")
                    & ~Q(booking__destination_address__postal_code__startswith="3"),
                    then=models.Value(True),
                ),
                default=models.Value(False),
                output_field=models.BooleanField(),
            )
        ).filter(is_booking_interstate=is_interstate)


class InvoiceSerializer(ScbpAdminModelSerializer):
    booking_id = serializers.PrimaryKeyRelatedField(source="booking", read_only=True)
    booking_number = serializers.IntegerField(
        source="booking.booking_number", read_only=True
    )
    client_user_id = serializers.PrimaryKeyRelatedField(
        source="booking.client_user", read_only=True
    )
    client_user_label = serializers.SerializerMethodField()
    account_id = serializers.PrimaryKeyRelatedField(
        source="booking.account", read_only=True
    )
    account_label = serializers.SerializerMethodField()

    class Meta:
        model = Invoice
        fields = (
            "booking_id",
            "booking_number",
            "client_user_id",
            "client_user_label",
            "account_id",
            "account_label",
            "invoice_number",
            "invoice_total_amount",
            "payment_method",
            "invoice_status",
            "issued_on",
        )
        extra_kwargs = {"issued_on": {"label": "Invoice Date"}}

    def get_account_label(self, invoice):
        return str(invoice.booking.account)

    def get_client_user_label(self, invoice):
        return str(invoice.booking.client_user)


class InvoiceViewSetPermissions(ScbpAdminViewSetPermissions):
    actions_to_perms_map = {
        "download": ["%(app_label)s.detail_%(model_name)s"],
        "resend_invoice_email": ["%(app_label)s.detail_%(model_name)s"],
        "associated_email_addresses": ["%(app_label)s.detail_%(model_name)s"],
    }


class InvoiceViewSet(
    ScbpModelBaseViewSet,
    mixins.ListModelMixin,
    mixins.RelatedModelLookupMixin,
    DjradGenericViewSet,
):
    serializer_class = InvoiceSerializer
    queryset = Invoice.objects.all().select_related("booking").order_by("-issued_on")
    filterset_class = InvoiceFilterSet
    permission_classes = (InvoiceViewSetPermissions,)
    ordering_fields = (
        "issued_on",
        "invoice_number",
        "invoice_total_amount",
        ("booking_number", ("booking__booking_number")),
        (
            "client_user_label",
            ("booking__client_user__first_name", "booking__client_user__last_name"),
        ),
        ("account_label", ("booking__account__account_nickname")),
    )

    @action(methods=["GET"], detail=True, url_path="download")
    def download(self, request, pk):
        invoice = self.get_object()
        default_filename = f"limomate_tax_invoice_{invoice.invoice_number}.PDF"
        response = HttpResponse(
            generate_invoice_pdf(invoice), content_type="application/pdf"
        )
        response["Content-Disposition"] = f'attachment; filename="{default_filename}"'
        return response

    @action(methods=["POST"], detail=True, url_path="resend-email")
    def resend_invoice_email(self, request, pk):
        invoice = self.get_object()
        email = request.data.get("email")
        send_invoice_email(invoice, email)
        return Response(status=status.HTTP_200_OK)

    @action(methods=["GET"], detail=True, url_path="associated-email-addresses")
    def associated_email_addresses(self, request, pk):
        """Get email addresses associated with invoice

        This is used to allow email address to be selected when sending an invoice email.

        Lists account email, client user email from booking & any other client users
        associated with the account.
        """
        invoice = self.get_object()
        booking = invoice.booking
        account = booking.account
        account_members = []
        for atoc in account.account_to_client.all():
            account_members.append(
                (atoc.client_user.get_full_name(), atoc.client_user.email)
            )
        emails = [
            (
                f"Account Contact for {account.account_nickname}",
                [
                    (
                        " ".join(
                            [account.contact_first_name, account.contact_last_name]
                        ),
                        account.account_email,
                    )
                ],
            ),
            (
                "Client from Booking",
                [(booking.client_user.get_full_name(), booking.client_user.email)],
            ),
            ("Other Account Members", account_members),
        ]
        return Response(emails, status=status.HTTP_200_OK)


class InvoiceRegistration(ScbpAdminModelRegistration):
    viewset_class = InvoiceViewSet

    action_permissions = {
        **ScbpAdminModelRegistration.action_permissions,
        "download": ["%(app_label)s.detail_%(model_name)s"],
        "resend_invoice_email": ["%(app_label)s.detail_%(model_name)s"],
    }

    def get_object_actions(self):
        return super().get_object_actions() + ["download", "resend_invoice_email"]


admin_site.register(Invoice, InvoiceRegistration)
