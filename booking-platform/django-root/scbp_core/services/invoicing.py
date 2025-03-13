from decimal import Decimal
from itertools import filterfalse
from typing import Optional

from django.db import models
from django.utils import timezone

from scbp_core.models import Booking
from scbp_core.models import Invoice
from scbp_core.models import InvoiceStatus
from scbp_core.models.booking_field_choices import BookingPaymentMethod
from scbp_core.models.booking_field_choices import BookingStatus

# Map invoice fields to invoice breakdown fields
BREAKDOWN_INVOICE_FIELD_MAP = {
    "invoice_total_amount": "booking_value",
    "fee_amount": "booking_fees",
    "company_fee_amount": "company_fee",
    "out_of_pocket_amount": "out_of_pocket",
    "time_surcharge_amount": "time_surcharge",
    "waiting_charge_amount": "waiting_charge",
    "variations_amount": "variations_charge",
    "requests_amount": "requests",
    "travel_charge_amount": "travel_charge",
}


def diff_invoice_breakdown(booking, new_invoice_breakdown):
    breakdown_aggregations = {
        key: models.Sum(key) for key in BREAKDOWN_INVOICE_FIELD_MAP
    }
    previous_invoices = booking.invoices.aggregate(**breakdown_aggregations)
    return {
        key: Decimal(new_invoice_breakdown.get(value, "0"))
        - previous_invoices.get(key, Decimal(0))
        for key, value in BREAKDOWN_INVOICE_FIELD_MAP.items()
    }


def create_invoice_for_booking(booking: Booking) -> Optional[Invoice]:
    """Create any outstanding invoice for a completed booking

    For bookings not yet invoiced it creates an invoice for the total amount of the booking

    For bookings that have already been invoiced it creates an invoice that is the
    difference between current booking total and previous invoice total

    For bookings that have been cancelled, we use 0 instead of the booking price total
    as the reference booking price - this creates an invoice that zeroes out the
    now-cancelled booking

    If no invoice was created returns None, otherwise returns the created invoice
    """
    last_invoice = (
        Invoice.objects.filter(booking=booking).order_by("-created_at").first()
    )
    new_price_total = booking.price_total
    new_price_breakdown = booking.price_breakdown
    new_invoice_breakdown = booking.invoice_breakdown
    if booking.booking_status == BookingStatus.CANCELLED:
        new_price_total = Decimal(0)
        new_price_breakdown = {"total": Decimal(0)}

    payment_method = booking.booking_payment_method
    new_invoice = Invoice(
        booking=booking,
        booking_price_total=new_price_total,
        booking_price_breakdown=new_price_breakdown,
        payment_method=payment_method,
        invoice_total_amount=new_price_total,
        issued_on=timezone.datetime.today(),
    )
    # If driver collect then it's already been paid direct to driver
    if payment_method == BookingPaymentMethod.DRIVER_COLLECT:
        new_invoice.invoice_status = InvoiceStatus.PAID
        new_invoice.date_paid = timezone.now()
    if last_invoice:
        # diff_breakdown = diff_price_breakdowns_to_invoice_breakdown(
        #     old_price_breakdown=last_invoice.booking_price_breakdown,
        #     new_price_breakdown=new_price_breakdown,
        # )
        diff_breakdown = diff_invoice_breakdown(booking, new_invoice_breakdown)
        # Detect whether any of the explicit invoice components have changed
        try:
            # diff_breakdown.values() gets the values from diff_breakdown (we don't care about the keys for this part)
            # filterfalse filters out the values which are equal to zero
            # finally, next tries to get the first item returned
            # (we don't actually care about the item, only the StopIteration exception raised if there isn't one)
            next(filterfalse(lambda item: item == Decimal(0), diff_breakdown.values()))
        except StopIteration:
            # If we're here, none of the invoice components have changed
            # If the total also has not changed, don't create an invoice
            # if new_price_total == last_invoice.booking_price_total:
            return None
        for key in diff_breakdown:
            setattr(new_invoice, key, diff_breakdown.get(key, Decimal(0)))
    elif booking.booking_status == BookingStatus.CANCELLED:
        # If there are no existing invoices for a cancelled booking, don't create one
        return None
    else:
        for key in BREAKDOWN_INVOICE_FIELD_MAP:
            setattr(
                new_invoice,
                key,
                Decimal(booking.invoice_breakdown[BREAKDOWN_INVOICE_FIELD_MAP[key]]),
            )

    new_invoice.save()
    return new_invoice
