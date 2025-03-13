from decimal import Decimal

from django.conf import settings
from django.contrib.staticfiles import finders
from django.db.models import Sum
from django.template.loader import render_to_string
from django.utils import timezone
from django.utils.timezone import localdate
import pdfkit

from scbp_core.models import AccountPaymentMethodType
from scbp_core.models import PriceVariationType
from scbp_core.services.formatters import formatted_address

default_date_format = "%d/%m/%Y"


def get_invoice_item_context(invoice):
    booking = invoice.booking
    airport_fee = Decimal(
        invoice.booking_price_breakdown.get("fees", {}).get("airport_parking", 0)
    )
    if booking.dropoff_time and booking.pickup_time:
        raw_total_time = booking.dropoff_time - booking.pickup_time
        total_time_hours, remainder = divmod(raw_total_time.seconds, 3600)
        total_time_minutes = remainder // 60
        total_time = f"{total_time_hours}:{'0' if total_time_minutes < 10 else ''}{total_time_minutes}"
    else:
        total_time = "0:00"

    if booking.additional_stops.count() > 0:
        additional_stops = booking.additional_stops.values_list("suburb", flat=True)
    else:
        additional_stops = []

    ad_hoc_additional_stops = []

    for variation in booking.price_variations.all():
        if variation.variation_type == PriceVariationType.ADHOC:
            ad_hoc_additional_stops.append("Extra Stop")

    interstate_transfer_fee = booking.price_variations.filter(
        variation_type=PriceVariationType.INTERSTATE_TRANSFER_RATE
    ).aggregate(total_amount=Sum("amount"))["total_amount"] or Decimal(0)

    # Melbourne specific post code outputs.
    # For any 3000 or 3004 post codes, append the post code to the output.
    pickup = booking.from_address.suburb
    if (
        booking.from_address.postal_code == "3000"
        or booking.from_address.postal_code == "3004"
    ):
        pickup = f"{booking.from_address.suburb} {booking.from_address.postal_code}"

    destination = (
        booking.destination_address.suburb
        if booking.destination_address
        else "As Advised"
    )
    if booking.destination_address:
        if (
            booking.destination_address.postal_code == "3000"
            or booking.destination_address.postal_code == "3004"
        ):
            destination = f"{booking.destination_address.suburb} {booking.destination_address.postal_code}"

    return {
        "invoice_number": invoice.invoice_number,
        "booking_number": booking.booking_number,
        "reference_number": booking.supplier_confirmation_number,
        "booking_date": localdate(booking.travel_on).strftime(default_date_format),
        "passenger": (
            booking.passenger.get_full_name_with_title()
            if booking.passenger
            else booking.passenger_name
        ),
        "car_type": booking.vehicle_class.abbreviation,
        "pickup": pickup,
        "additional_stops": additional_stops,
        "ad_hoc_additional_stops": ad_hoc_additional_stops,
        "destination": destination,
        "booking_time": timezone.localtime(booking.travel_on).strftime("%H%M"),
        "pickup_time": timezone.localtime(
            (booking.pickup_time or booking.travel_on)
        ).strftime("%H%M"),
        "total_time": total_time,
        "travel_charge": invoice.travel_charge_amount
        + invoice.company_fee_amount
        + interstate_transfer_fee
        - airport_fee,
        "time_surcharge": invoice.time_surcharge_amount,
        "waiting_charge": invoice.waiting_charge_amount,
        "variation_charge": invoice.variations_amount - interstate_transfer_fee,
        "out_of_pocket_charge": invoice.out_of_pocket_amount + airport_fee,
        "requests": invoice.requests_amount,
        "booking_fee": invoice.fee_amount,
        "paid_to_driver": (
            invoice.invoice_total_amount
            if invoice.payment_method == AccountPaymentMethodType.DRIVER_COLLECT
            else Decimal(0)
        ),
        "total_charge": invoice.invoice_total_amount,
    }


def get_invoice_context(invoice):
    invoice_items = [get_invoice_item_context(invoice)]

    booking = invoice.booking
    gst = (invoice.invoice_total_amount / 11).quantize(Decimal("0.01"))

    if booking.account.contact_title:
        account_contact_name = f"{booking.account.contact_title} {booking.account.contact_first_name} {booking.account.contact_last_name}"
    else:
        account_contact_name = (
            f"{booking.account.contact_first_name} {booking.account.contact_last_name}"
        )

    if booking.account.business_name:
        account_name = booking.account.business_name
    else:
        account_name = booking.account.account_nickname

    context = {
        "header": f"Tax Invoice {invoice.invoice_number}",
        "is_statement": False,
        "invoice": invoice.invoice_number,
        "invoice_issue_date": invoice.issued_on.strftime(default_date_format),
        "account_contact_name": account_contact_name,
        "account_number": booking.account.account_no,
        "account_name": account_name,
        "account_address": formatted_address(booking.account.billing_address),
        "account_email": booking.account.account_email,
        "invoice_items": invoice_items,
        "ex_tax_total": invoice.invoice_total_amount - gst,
        "tax_total": gst,
        "total_minus_credit_card_surcharge": invoice.invoice_total_amount,
        "credit_card_surcharge_rate": invoice.get_credit_card_surcharge_rate(),
        "credit_card_surcharge": invoice.get_credit_card_surcharge(),
        "invoice_total": invoice.invoice_total_amount
        + invoice.get_credit_card_surcharge(),
        "logo_path": finders.find("cabcredit-colour.png"),
    }

    return context


def get_statement_context(statement):
    period = f"{statement.get_period_start().strftime(default_date_format)} - {statement.get_period_end().strftime(default_date_format)}"
    invoices_total = statement.invoices.aggregate(Sum("invoice_total_amount"))[
        "invoice_total_amount__sum"
    ] or Decimal(0)
    gst = (invoices_total / 11).quantize(Decimal("0.01"))
    credit_card_surcharge = sum(
        [invoice.get_credit_card_surcharge() for invoice in statement.invoices.all()]
    )
    invoice_items = [
        get_invoice_item_context(invoice)
        for invoice in statement.invoices.order_by("booking__travel_on").all()
    ]

    if statement.account.contact_title:
        account_contact_name = f"{statement.account.contact_title} {statement.account.contact_first_name} {statement.account.contact_last_name}"
    else:
        account_contact_name = f"{statement.account.contact_first_name} {statement.account.contact_last_name}"

    if statement.account.business_name:
        account_name = statement.account.business_name
    else:
        account_name = statement.account.account_nickname

    context = {
        "header": f"Statement/Tax Invoice {statement.statement_number}",
        "is_statement": True,
        "statement_period": period,
        "invoice_issue_date": statement.issued_on.strftime(default_date_format),
        "account_contact_name": account_contact_name,
        "account_number": statement.account.account_no,
        "account_name": account_name,
        "account_address": statement.account.billing_address,
        "account_email": statement.account.account_email,
        "invoice_items": invoice_items,
        "custom_message": statement.custom_message,
        "ex_tax_total": invoices_total - gst,
        "tax_total": gst,
        "total_minus_credit_card_surcharge": invoices_total,
        "credit_card_surcharge_rate": statement.get_credit_card_surcharge_rate(),
        "credit_card_surcharge": credit_card_surcharge,
        "invoice_total": invoices_total + credit_card_surcharge,
        "logo_path": finders.find("cabcredit-colour.png"),
    }
    return context


def generate_pdf_from_context(context):
    wkhtml_to_pdf_path = settings.WKHTML_TO_PDF_PATH
    config = None
    if wkhtml_to_pdf_path:
        config = pdfkit.configuration(wkhtmltopdf=wkhtml_to_pdf_path)

    content = render_to_string("pdf/invoice.html", context)
    # Add `"zoom": 1.33,` to emulate staging/production printing
    # if developing on MacOS
    # Note that logo will then be 33% larger (specifically taller)
    # (I don't know of any way to fix the logo size)
    options = {
        "footer-font-size": 9,
        "footer-left": "Page [page] of [sitepages]",
        "orientation": "Landscape",
        "quiet": False,
        "enable-local-file-access": "",
    }
    return pdfkit.from_string(content, False, options=options, configuration=config)


def generate_invoice_pdf(invoice):
    context = get_invoice_context(invoice)
    return generate_pdf_from_context(context)


def generate_statement_pdf(statement):
    context = get_statement_context(statement)
    return generate_pdf_from_context(context)
