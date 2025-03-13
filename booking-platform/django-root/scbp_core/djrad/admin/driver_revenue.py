from datetime import date

from dateutil import parser
from dateutil.relativedelta import relativedelta
from django.conf import settings
from django.db import models
from django.db.models import Avg
from django.db.models import functions
from django.db.models import Sum
from django.db.models.functions import ExtractDay
from django.http import HttpResponse
from djrad_rest import mixins
from djrad_rest.filters import RefineModelChoiceFilter
from djrad_rest.util import DjradEntityResponse
from djrad_rest.viewsets import DjradGenericViewSet
import pytz
from rest_framework import serializers
from rest_framework.decorators import action

from scbp_core.djrad.admin import ScbpAdminModelRegistration
from scbp_core.djrad.admin import ScbpAdminModelSerializer
from scbp_core.djrad.admin import ScbpAdminViewSetPermissions
from scbp_core.djrad.admin.base import ScbpAdminFilterSet
from scbp_core.djrad.base import ScbpModelBaseViewSet
from scbp_core.djrad.sites import admin_site
from scbp_core.models import BookingStatus
from scbp_core.models import DriverUser
from scbp_core.models import HourRateDayType
from scbp_core.models import HourRateHourType
from scbp_core.services.driver_earnings_summary import make_parking_field_annotation
from scbp_core.services.generate_driver_statement_pdf import generate_driver_revenue_pdf


class DriverRevenueSerializer(ScbpAdminModelSerializer):
    name = serializers.SerializerMethodField()
    days_worked = serializers.IntegerField(read_only=True)
    weekend_days_worked = serializers.IntegerField(read_only=True)
    booking_count = serializers.IntegerField(read_only=True)
    out_of_hours_booking_count = serializers.IntegerField(read_only=True)
    earnings_amount = serializers.DecimalField(
        read_only=True, max_digits=8, decimal_places=2
    )
    daily_average_revenue = serializers.DecimalField(
        read_only=True, max_digits=8, decimal_places=2
    )
    booking_average_revenue = serializers.DecimalField(
        read_only=True, max_digits=8, decimal_places=2
    )

    class Meta:
        model = DriverUser
        fields = (
            "driver_no",
            "name",
            "days_worked",
            "weekend_days_worked",
            "booking_count",
            "out_of_hours_booking_count",
            "earnings_amount",
            "daily_average_revenue",
            "booking_average_revenue",
        )

    def get_name(self, instance):
        return instance.get_full_name()


class InvoiceViewSetPermissions(ScbpAdminViewSetPermissions):
    actions_to_perms_map = {"download": ["%(app_label)s.list_%(model_name)s"]}


class DriverRevenueDriverFilter(RefineModelChoiceFilter):
    default_label = "Driver"

    def __init__(self, **kwargs):
        def refine_choices(qs, keywords, request):
            qs = qs.order_by("first_name", "last_name", "email")
            if not keywords:
                return qs
            filter = models.Q()
            for keyword in keywords.split():
                filter = (
                    filter & models.Q(driver_no__icontains=keyword)
                    | models.Q(name_first_first__icontains=keyword)
                    | models.Q(name_last_first__icontains=keyword)
                )
            return qs.filter(filter)

        queryset = DriverUser.objects.all().annotate(
            name_last_first=functions.Concat(
                "last_name", models.Value(", "), "first_name"
            ),
            name_first_first=functions.Concat(
                "first_name", models.Value(" "), "last_name"
            ),
        )
        default_kwargs = dict(
            label=self.default_label, queryset=queryset, refine_choices=refine_choices
        )
        super().__init__(**{**default_kwargs, **kwargs})

    def filter(self, qs, value):
        return super().filter(qs, value.id) if value else qs


class DriverRevenueFilterSet(ScbpAdminFilterSet):
    driver = DriverRevenueDriverFilter(field_name="id")

    class Meta:
        model = DriverUser
        fields = ("driver",)


class DriverRevenueViewSet(
    ScbpModelBaseViewSet, mixins.ListModelMixin, DjradGenericViewSet
):
    serializer_class = DriverRevenueSerializer
    filterset_class = DriverRevenueFilterSet
    permission_classes = (InvoiceViewSetPermissions,)
    pagination_class = None

    ordering = "earnings_amount"
    ordering_fields = (
        ("driver_no", "driver_number"),
        ("name", ("last_name", "first_name")),
        "days_worked",
        "weekend_days_worked",
        "booking_count",
        "out_of_hours_booking_count",
        "earnings_amount",
        "daily_average_revenue",
        "booking_average_revenue",
    )

    @staticmethod
    def sum_field_annotations(fields):
        """
        :param fields: The list of fields on Invoice to be summed up in the annotation
        :return: The summed DriverUser annotation parameter
        """
        return sum(
            [models.F(f"bookings__invoices__{field_name}") for field_name in fields]
        )

    def get_date_range(self):
        start_of_month = date.today() + relativedelta(day=1)
        current_date_reference = date.today()
        if self.request:
            query_params = self.request.query_params
        else:
            query_params = {}
        try:
            sdate = parser.parse(query_params.get("sdate", ""))
        except ValueError:
            sdate = start_of_month
        try:
            edate = parser.parse(query_params.get("edate", ""))
        except ValueError:
            edate = current_date_reference
        return sdate, edate + relativedelta(days=1)

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
        sdate, edate = self.get_date_range()
        booking_range_filter = models.Q(
            bookings__booking_status=BookingStatus.COMPLETED,
            bookings__travel_on__gte=sdate,
            bookings__travel_on__lte=edate,
        )
        driver_value_fields = [
            "travel_charge_amount",
            "time_surcharge_amount",
            "waiting_charge_amount",
            "requests_amount",
            "variations_amount",
        ]

        airport_parking = make_parking_field_annotation(
            "bookings__invoices__booking_price_breakdown"
        )

        out_of_hours_sql = """SELECT COUNT("scbp_core_booking"."id") AS "count"
        FROM "scbp_core_booking"
        LEFT JOIN "scbp_core_holiday" ON "scbp_core_holiday"."date" = ("scbp_core_booking"."travel_on" AT TIME ZONE 'Australia/Melbourne')::date
        LEFT JOIN "scbp_core_hour_rate_type" ON "scbp_core_hour_rate_type"."day_type" = (
    CASE
        WHEN (scbp_core_holiday.id is not null) THEN %s
        -- 0 = Sunday, 6 = Saturday -->
        WHEN EXTRACT('dow' FROM "scbp_core_booking"."travel_on" AT TIME ZONE 'Australia/Melbourne') = 0 THEN %s
        WHEN EXTRACT('dow' FROM "scbp_core_booking"."travel_on" AT TIME ZONE 'Australia/Melbourne') = 6 THEN %s
        ELSE %s END
    ) AND "scbp_core_hour_rate_type"."hour" =
              (EXTRACT('hour' FROM "scbp_core_booking"."travel_on" AT TIME ZONE 'Australia/Melbourne'))
        AND "scbp_core_hour_rate_type"."hour_type" IN %s
        WHERE ("scbp_core_booking"."booking_status" = %s
        AND "scbp_core_booking"."driver_id" = ("scbp_core_driver_user"."user_ptr_id")
        AND "scbp_core_hour_rate_type"."id" IS NOT NULL
        AND "scbp_core_booking"."travel_on" >= %s
        AND "scbp_core_booking"."travel_on" <= %s)"""

        return DriverUser.objects.filter(booking_range_filter).annotate(
            driver_number=functions.Cast("driver_no", models.IntegerField()),
            days_worked=models.Count(
                # Using booking__travel_on__date didn't work... it ended up
                # coming through the SQL as just bookings__travel_on
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
            out_of_hours_booking_count=models.expressions.RawSQL(
                out_of_hours_sql,
                (
                    HourRateDayType.HOLIDAY,
                    HourRateDayType.SUNDAY,
                    HourRateDayType.SATURDAY,
                    HourRateDayType.WEEKDAY,
                    (
                        HourRateHourType.OUT_OF_HOURS,
                        HourRateHourType.HOLIDAY_OUT_OF_HOURS,
                        HourRateHourType.SATURDAY_NIGHT,
                    ),
                    BookingStatus.COMPLETED,
                    sdate,
                    edate,
                ),
                output_field=models.IntegerField(),
            ),
            earnings_amount=functions.Coalesce(
                models.Sum(
                    self.sum_field_annotations(driver_value_fields) - airport_parking,
                    filter=booking_range_filter,
                ),
                models.Value(0),
                output_field=models.DecimalField(),
            ),
            daily_average_revenue=models.Case(
                models.When(days_worked=0, then=models.Value(0)),
                default=models.ExpressionWrapper(
                    models.F("earnings_amount") / models.F("days_worked"),
                    output_field=models.DecimalField(),
                ),
                output_field=models.DecimalField(),
            ),
            booking_average_revenue=models.Case(
                models.When(booking_count=0, then=models.Value(0)),
                default=models.ExpressionWrapper(
                    models.F("earnings_amount") / models.F("booking_count"),
                    output_field=models.DecimalField(),
                ),
                output_field=models.DecimalField(),
            ),
        )

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        serializer = self.get_serializer(queryset, many=True)
        return DjradEntityResponse(
            serializer,
            data={
                "total_days_worked": queryset.aggregate(
                    Sum("days_worked", output_field=models.IntegerField())
                )["days_worked__sum"],
                "total_weekends_worked": queryset.aggregate(
                    Sum("weekend_days_worked", output_field=models.IntegerField())
                )["weekend_days_worked__sum"],
                "total_bookings": queryset.aggregate(
                    Sum("booking_count", output_field=models.IntegerField())
                )["booking_count__sum"],
                "total_out_of_hours": queryset.aggregate(
                    Sum(
                        "out_of_hours_booking_count", output_field=models.DecimalField()
                    )
                )["out_of_hours_booking_count__sum"],
                "total_earnings": queryset.aggregate(
                    Sum("earnings_amount", output_field=models.DecimalField())
                )["earnings_amount__sum"],
                "daily_average_average": queryset.aggregate(
                    Avg("daily_average_revenue", output_field=models.DecimalField())
                )["daily_average_revenue__avg"],
                "booking_average_average": queryset.aggregate(
                    Avg("booking_average_revenue", output_field=models.DecimalField())
                )["booking_average_revenue__avg"],
            },
        )

    @action(methods=["GET"], detail=False, url_path="download")
    def download(self, request):
        sdate, edate = self.get_date_range()
        default_filename = f"limomate_driver_revenue_{sdate}_{edate}.PDF"

        qs = self.filter_queryset(self.get_queryset())

        response = HttpResponse(
            generate_driver_revenue_pdf(drivers=qs, sdate=sdate, edate=edate),
            content_type="application/pdf",
        )
        response["Content-Disposition"] = f'attachment; filename="{default_filename}"'
        return response


class DriverRevenueRegistration(ScbpAdminModelRegistration):
    viewset_class = DriverRevenueViewSet
    registration_id = "scbp_core.driverrevenue"
    url_base = "scbp_core.driverrevenue"
    api_route_prefix = "scbp_core.driverrevenue"
    label = "Driver Revenue"
    label_plural = "Driver Revenue"

    action_permissions = {
        **ScbpAdminModelRegistration.action_permissions,
        "download": ["%(app_label)s.list_%(model_name)s"],
    }

    def get_global_actions(self):
        return super().get_global_actions() + ["download"]


admin_site.register(DriverUser, DriverRevenueRegistration)
