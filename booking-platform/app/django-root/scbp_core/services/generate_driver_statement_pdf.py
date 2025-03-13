import calendar
from datetime import date
from datetime import datetime
from datetime import timedelta
from decimal import Decimal

from dateutil.relativedelta import relativedelta
from django.conf import settings
from django.contrib.staticfiles import finders
from django.db.models import Avg
from django.db.models import F
from django.db.models import Q
from django.db.models import Sum
from django.template.loader import render_to_string
from django.utils.timezone import localtime
from django.utils.timezone import make_aware
import pdfkit

from scbp_core.models import BookingPaymentMethod
from scbp_core.models import Invoice
from scbp_core.services.driver_earnings_summary import make_parking_field_annotation

date_format = "%d/%m/%Y"


def _invoices_to_context(invoices):
    return [
        {
            "booking_number": invoice.booking.booking_number,
            "booking_date": localtime(invoice.booking.travel_on).strftime("%d/%m/%Y"),
            "client": invoice.booking.client_user.get_full_name_with_title(),
            "pickup": invoice.booking.from_address.suburb,
            "destination": (
                invoice.booking.destination_address.suburb
                if invoice.booking.destination_address
                else "As Advised"
            ),
            "booking_time": localtime(invoice.booking.travel_on).strftime("%H:%M"),
            "travel_charge": invoice.travel_charge_amount - invoice.airport_parking,
            "time_charge": invoice.time_surcharge_amount,
            "waiting_charge": invoice.waiting_charge_amount,
            "requests": invoice.requests_amount,
            "variations": invoice.variations_amount,
            "job_value": (
                invoice.travel_charge_amount
                + invoice.time_surcharge_amount
                + invoice.waiting_charge_amount
                + invoice.requests_amount
                + invoice.variations_amount
                - invoice.airport_parking
            ),
            "extras": invoice.out_of_pocket_amount + invoice.airport_parking,
            "collected": (
                (
                    invoice.travel_charge_amount
                    + invoice.time_surcharge_amount
                    + invoice.waiting_charge_amount
                    + invoice.requests_amount
                    + invoice.variations_amount
                    + invoice.out_of_pocket_amount
                )
                if invoice.booking.booking_payment_method
                == BookingPaymentMethod.DRIVER_COLLECT
                else None
            ),
        }
        for invoice in invoices
    ]


def generate_driver_statement_pdf(driver, *, month, year):
    wkhtml_to_pdf_path = settings.WKHTML_TO_PDF_PATH
    config = None
    if wkhtml_to_pdf_path:
        config = pdfkit.configuration(wkhtmltopdf=wkhtml_to_pdf_path)

    date_range = calendar.monthrange(year, month)
    statement_period_start = make_aware(datetime(year, month, 1))
    statement_period_end = make_aware(
        datetime(
            year=year,
            month=month,
            day=date_range[1],
        )
    ) + timedelta(days=1)

    invoices = (
        Invoice.objects.filter(
            booking__in=driver.bookings.all(),
            booking__travel_on__gte=statement_period_start,
            booking__travel_on__lt=statement_period_end,
        )
        .annotate(
            airport_parking=make_parking_field_annotation("booking_price_breakdown"),
        )
        .order_by("booking__travel_on")
    )

    job_value_field_sum = (
        F("travel_charge_amount")
        + F("time_surcharge_amount")
        + F("waiting_charge_amount")
        + F("requests_amount")
        + F("variations_amount")
        - F("airport_parking")
    )

    invoice_sums = invoices.aggregate(
        value_sum=Sum(job_value_field_sum),
        extras_sum=Sum("out_of_pocket_amount") + Sum("airport_parking"),
        collected_sum=Sum(
            job_value_field_sum + F("out_of_pocket_amount"),
            filter=Q(
                booking__booking_payment_method=BookingPaymentMethod.DRIVER_COLLECT
            ),
        ),
    )

    context = {
        "logo_path": finders.find("cabcredit-colour.png"),
        "driver_name": driver.get_full_name(),
        "driver_number": driver.driver_no,
        "statement_period": date(year, month, 1).strftime("%B %Y"),
        "statement_period_range": f"for period {statement_period_start.strftime('%-d %b %Y')} - {(statement_period_end + timedelta(days=-1)).strftime('%-d %b %Y')}",
        "invoices": _invoices_to_context(invoices),
        "service_fee_base": invoice_sums["value_sum"] or Decimal(0),
        "extras_sum": invoice_sums["extras_sum"] or Decimal(0),
        "driver_collect_sum": invoice_sums["collected_sum"] or Decimal(0),
        "days_worked": driver.days_worked,
        "weekend_days_worked": driver.weekend_days_worked,
        "booking_count": driver.booking_count,
        "daily_average_revenue": driver.daily_average_revenue,
        "earnings_amount": driver.earnings_amount,
    }

    content = render_to_string("pdf/driver_statement.html", context)
    # Add `"zoom": 1.33,` to emulate staging/production printing
    # if developing on MacOS
    # Note that logo will then be 33% larger (specifically taller)
    # (I don't know of any way to fix the logo size)
    options = {
        "footer-font-size": 9,
        "footer-left": "Page [page] of [sitepages]",
        "footer-line": "",
        "orientation": "Landscape",
        "quiet": False,
        "enable-local-file-access": "",
    }
    return pdfkit.from_string(content, False, options=options, configuration=config)


def generate_driver_revenue_pdf(*, drivers, sdate, edate):
    wkhtml_to_pdf_path = settings.WKHTML_TO_PDF_PATH
    config = None
    if wkhtml_to_pdf_path:
        config = pdfkit.configuration(wkhtmltopdf=wkhtml_to_pdf_path)

    context = {
        "sdate": sdate.strftime("%a %d %b %Y"),
        "edate": (edate + relativedelta(days=-1)).strftime("%a %d %b %Y"),
        "total_days_worked": drivers.aggregate(Sum("days_worked"))["days_worked__sum"],
        "total_weekends_worked": drivers.aggregate(Sum("weekend_days_worked"))[
            "weekend_days_worked__sum"
        ],
        "total_bookings": drivers.aggregate(Sum("booking_count"))["booking_count__sum"],
        "total_out_of_hours": drivers.aggregate(Sum("out_of_hours_booking_count"))[
            "out_of_hours_booking_count__sum"
        ],
        "total_earnings": drivers.aggregate(Sum("earnings_amount"))[
            "earnings_amount__sum"
        ],
        "daily_average_average": drivers.aggregate(Avg("daily_average_revenue"))[
            "daily_average_revenue__avg"
        ],
        "booking_average_average": drivers.aggregate(Avg("booking_average_revenue"))[
            "booking_average_revenue__avg"
        ],
        "drivers": [
            {
                "driver_no": driver.driver_no,
                "name": driver.get_full_name,
                "days_worked": driver.days_worked,
                "weekend_days": driver.weekend_days_worked,
                "bookings": driver.booking_count,
                "out_of_hours": driver.out_of_hours_booking_count,
                "earnings": driver.earnings_amount,
                "daily_average": driver.daily_average_revenue,
                "booking_average": driver.booking_average_revenue,
            }
            for driver in drivers
        ],
    }

    content = render_to_string("pdf/driver_revenue.html", context)
    # Add `"zoom": 1.33,` to emulate staging/production printing
    # if developing on MacOS
    options = {
        "footer-font-size": 9,
        "footer-left": "Page [page] of [sitepages]",
        "orientation": "Landscape",
        "enable-local-file-access": "",
    }
    return pdfkit.from_string(content, False, options=options, configuration=config)
