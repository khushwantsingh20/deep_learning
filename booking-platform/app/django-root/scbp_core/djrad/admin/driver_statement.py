import calendar
from datetime import date
from datetime import datetime
from datetime import timedelta

from dateutil.relativedelta import relativedelta
from django.conf import settings
from django.db import models
from django.db.models.functions import Coalesce
from django.db.models.functions import ExtractDay
from django.http import HttpResponse
from django.utils.timezone import make_aware
from djrad_rest import mixins
from djrad_rest.util import DjradEntityResponse
from djrad_rest.viewsets import DjradGenericViewSet
import pytz
from rest_framework import serializers
from rest_framework import status
from rest_framework.decorators import action
from rest_framework.response import Response

from scbp_core.djrad.admin import ScbpAdminModelRegistration
from scbp_core.djrad.admin import ScbpAdminModelSerializer
from scbp_core.djrad.admin import ScbpAdminViewSetPermissions
from scbp_core.djrad.base import ScbpModelBaseViewSet
from scbp_core.djrad.sites import admin_site
from scbp_core.models import BookingPaymentMethod
from scbp_core.models import BookingStatus
from scbp_core.models import DriverUser
from scbp_core.services.driver_earnings_summary import google_sheets_rgi_summary
from scbp_core.services.driver_earnings_summary import make_parking_field_annotation
from scbp_core.services.generate_driver_statement_pdf import (
    generate_driver_statement_pdf,
)
from scbp_core.tasks.email_driver_statements import email_driver_statements
from scbp_core.tasks.email_driver_statements import generate_driver_statement_email


class DriverStatementSerializer(ScbpAdminModelSerializer):
    name = serializers.SerializerMethodField()
    earnings_amount = serializers.DecimalField(
        read_only=True, max_digits=8, decimal_places=2
    )
    out_of_pocket_amount = serializers.DecimalField(
        read_only=True, max_digits=8, decimal_places=2
    )
    collected_amount = serializers.DecimalField(
        read_only=True, max_digits=8, decimal_places=2
    )
    days_worked = serializers.IntegerField(read_only=True)
    weekend_days_worked = serializers.IntegerField(read_only=True)
    booking_count = serializers.IntegerField(read_only=True)
    daily_average_revenue = serializers.DecimalField(
        read_only=True, max_digits=8, decimal_places=2
    )

    class Meta:
        model = DriverUser
        fields = (
            "driver_no",
            "name",
            "days_worked",
            "weekend_days_worked",
            "earnings_amount",
            "out_of_pocket_amount",
            "collected_amount",
            "booking_count",
            "daily_average_revenue",
        )

    def get_name(self, instance):
        return instance.get_full_name()


class DriverStatementViewSetPermissions(ScbpAdminViewSetPermissions):
    actions_to_perms_map = {
        "download": ["%(app_label)s.detail_%(model_name)s"],
        "send_all": ["%(app_label)s.list_%(model_name)s"],
        "rgi_statement": ["%(app_label)s.list_%(model_name)s"],
        "resend_statement_email": ["%(app_label)s.detail_%(model_name)s"],
        "associated_email_addresses": ["%(app_label)s.detail_%(model_name)s"],
    }


class DriverStatementViewSet(
    ScbpModelBaseViewSet, mixins.ListModelMixin, DjradGenericViewSet
):
    serializer_class = DriverStatementSerializer
    permission_classes = (DriverStatementViewSetPermissions,)

    ordering_fields = [
        "driver_no",
        ("name", ("first_name", "last_name")),
        "earnings_amount",
        "out_of_pocket_amount",
        "collected_amount",
    ]

    @staticmethod
    def sum_field_annotations(fields):
        """
        :param fields: The list of fields on Invoice to be summed up in the annotation
        :return: The summed DriverUser annotation parameter
        """
        return sum(
            [models.F(f"bookings__invoices__{field_name}") for field_name in fields]
        )

    def get_month_and_year(self):
        reference_date = date.today() + relativedelta(months=-1)
        if self.request:
            query_params = self.request.query_params
        else:
            query_params = {}
        month = int(query_params.get("month", reference_date.month))
        year = int(query_params.get("year", reference_date.year))
        return month, year

    def get_queryset(self):
        """
        Returns the queryset with the drivers to display on the driver statement list view
        Filters by the given year and month passed from the client - assumes the previous month if none is passed
        Note the following annotations:
        - earnings_amount is the sum of the effective driver values (total value - fees amount - out of pocket amount)
            for all invoiced bookings for the given month
        - out_of_pocket_amount is the amount the driver spent out of pocket on all invoiced bookings
            for the given month
        - collected_amount is the total amount collected by the driver on bookings invoiced in the given month

        :return: The queryset with all drivers annotated as described above
        """
        month, year = self.get_month_and_year()

        date_range = calendar.monthrange(year, month)
        statement_period_start = make_aware(datetime(year, month, 1))
        statement_period_end = make_aware(
            datetime(
                year=year,
                month=month,
                day=date_range[1],
            )
        ) + timedelta(days=1)

        booking_range_filter = models.Q(
            bookings__booking_status=BookingStatus.COMPLETED,
            bookings__travel_on__gte=statement_period_start,
            bookings__travel_on__lt=statement_period_end,
        )

        driver_value_fields = [
            "travel_charge_amount",
            "time_surcharge_amount",
            "waiting_charge_amount",
            "requests_amount",
            "variations_amount",
            "out_of_pocket_amount",
        ]

        airport_parking = make_parking_field_annotation(
            "bookings__invoices__booking_price_breakdown"
        )

        return DriverUser.objects.order_by("driver_no").annotate(
            earnings_amount=Coalesce(
                models.Sum(
                    self.sum_field_annotations(
                        [
                            field_name
                            for field_name in driver_value_fields
                            if field_name != "out_of_pocket_amount"
                        ]
                    )
                    - airport_parking,
                    filter=booking_range_filter,
                    output_field=models.DecimalField(),
                ),
                0,
                output_field=models.DecimalField(),
            ),
            out_of_pocket_amount=Coalesce(
                models.Sum(
                    self.sum_field_annotations(["out_of_pocket_amount"])
                    + airport_parking,
                    filter=booking_range_filter,
                    output_field=models.DecimalField(),
                ),
                0,
                output_field=models.DecimalField(),
            ),
            collected_amount=Coalesce(
                models.Sum(
                    self.sum_field_annotations(driver_value_fields),
                    filter=booking_range_filter
                    & models.Q(
                        bookings__booking_payment_method=BookingPaymentMethod.DRIVER_COLLECT
                    ),
                    output_field=models.DecimalField(),
                ),
                0,
                output_field=models.DecimalField(),
            ),
            days_worked=models.Count(
                ExtractDay(
                    "bookings__travel_on", tzinfo=pytz.timezone(settings.TIME_ZONE)
                ),
                distinct=True,
                filter=booking_range_filter,
            ),
            weekend_days_worked=models.Count(
                ExtractDay(
                    "bookings__travel_on", tzinfo=pytz.timezone(settings.TIME_ZONE)
                ),
                distinct=True,
                filter=booking_range_filter
                & models.Q(bookings__travel_on__week_day__in=[1, 7]),
            ),
            booking_count=models.Count("bookings", filter=booking_range_filter),
            daily_average_revenue=models.Case(
                models.When(days_worked=0, then=models.Value(0)),
                default=models.ExpressionWrapper(
                    models.F("earnings_amount") / models.F("days_worked"),
                    output_field=models.DecimalField(),
                ),
                output_field=models.DecimalField(),
            ),
        )

    @action(methods=["GET"], detail=True, url_path="download")
    def download(self, request, pk):
        driver = self.get_object()
        month, year = self.get_month_and_year()
        default_filename = f"limomate_driver_statement_{driver.driver_no}.PDF"
        response = HttpResponse(
            generate_driver_statement_pdf(driver, month=month, year=year),
            content_type="application/pdf",
        )
        response["Content-Disposition"] = f'attachment; filename="{default_filename}"'
        return response

    @action(methods=["GET"], detail=False, url_path="rgi_statement")
    def rgi_statement(self, request):
        month, year = self.get_month_and_year()
        spreadsheet_url = google_sheets_rgi_summary(month=month, year=year)
        return DjradEntityResponse(data={"spreadsheetUrl": spreadsheet_url})

    @action(methods=["GET"], detail=False, url_path="send_all")
    def send_all(self, request):
        month, year = self.get_month_and_year()
        email_driver_statements.delay(month=month, year=year)
        return HttpResponse(status=204)

    @action(methods=["POST"], detail=True, url_path="resend-email")
    def resend_statement_email(self, request, pk):
        driver_user = self.get_object()
        email = request.data.get("email")
        month = request.data["month"]
        year = request.data["year"]
        generate_driver_statement_email(driver_user, month, year, email).send()
        return Response(status=status.HTTP_200_OK)

    @action(methods=["GET"], detail=True, url_path="associated-email-addresses")
    def associated_email_addresses(self, request, pk):
        """Get email addresses associated with driver

        This is used to allow email to be selected when sending an invoice
        """
        driver_user = self.get_object()
        emails = [
            (
                "Driver",
                [
                    (
                        driver_user.get_full_name(),
                        driver_user.email,
                    )
                ],
            ),
        ]
        return Response(emails, status=status.HTTP_200_OK)


class DriverStatementRegistration(ScbpAdminModelRegistration):
    viewset_class = DriverStatementViewSet
    registration_id = "scbp_core.driverstatement"
    url_base = "scbp_core.driverstatement"
    api_route_prefix = "scbp_core.driverstatement"
    label = "Driver Statement"
    label_plural = "Driver Statements"

    action_permissions = {
        **ScbpAdminModelRegistration.action_permissions,
        "download": ["%(app_label)s.detail_%(model_name)s"],
        "rgi_statement": ["%(app_label)s.list_%(model_name)s"],
        "send_all": ["%(app_label)s.list_%(model_name)s"],
    }

    def get_global_actions(self):
        return super().get_global_actions() + ["send_all", "rgi_statement"]

    def get_object_actions(self):
        return super().get_object_actions() + ["download"]


admin_site.register(DriverUser, DriverStatementRegistration)
