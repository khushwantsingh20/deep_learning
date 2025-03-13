from collections import OrderedDict
from decimal import Decimal

from django.db import connection
from django.db import models
from django.db import transaction
from django.db.migrations import RunSQL
from django.db.models import Q

from scbp_core.fields import CurrencyValueField
from scbp_core.fields import get_choices_check_constraint
from scbp_core.fields import PercentageValueField
from scbp_core.model_mixins import TimestampFieldsMixin
from scbp_core.models import AccountPaymentMethodType
from scbp_core.models import AccountPaymentTermsType
from scbp_core.models import BookingPaymentMethod
from scbp_core.models.payment import Payment
from scbp_core.models.payment import Refund
from scbp_core.models.payment_field_choices import PaymentStatus
from scbp_core.permissions import DefaultPermissionsMeta
from scbp_core.services.credit_card_surcharge import get_surcharge_rate
from scbp_core.util import DecimalJSONEncoder

INVOICE_NUMBER_START = 10000


class InvoiceStatus:
    PENDING = 1
    PAID = 2

    choices = OrderedDict(((PENDING, "Pending"), (PAID, "Paid")))


class InvoiceQuerySet(models.QuerySet):
    def with_successful_payment(self):
        return self.filter(payment__status=PaymentStatus.SUCCESS)

    def with_successful_credit_card_charge(self):
        return self.with_successful_payment().exclude(payment__transaction_id=None)

    def order_by_payment_date(self):
        return self.order_by("-payment__updated_at", "-issued_on", "-invoice_number")


class Invoice(TimestampFieldsMixin):
    objects = InvoiceQuerySet.as_manager()

    booking = models.ForeignKey(
        "scbp_core.Booking", on_delete=models.PROTECT, related_name="invoices"
    )
    invoice_number = models.CharField(max_length=50, unique=True)
    issued_on = models.DateField()

    # Pricing fields shown for this invoice
    invoice_total_amount = CurrencyValueField()
    # Includes grouping of breakdown specific to how we render invoices.
    travel_charge_amount = CurrencyValueField(default=Decimal(0))
    time_surcharge_amount = CurrencyValueField(default=Decimal(0))
    waiting_charge_amount = CurrencyValueField(default=Decimal(0))
    requests_amount = CurrencyValueField(default=Decimal(0))
    variations_amount = CurrencyValueField(default=Decimal(0))
    out_of_pocket_amount = CurrencyValueField(default=Decimal(0))
    fee_amount = CurrencyValueField(default=Decimal(0))
    company_fee_amount = CurrencyValueField(default=Decimal(0))
    # Credit card surcharge rate - we can calculate the surcharge from this value given the total amount
    credit_card_surcharge_rate = PercentageValueField(blank=True, null=True)

    # If this isn't the first invoice for a booking then invoice_amount and
    # booking_total will differ. invoice_amount will be the difference between
    # the total on last invoice and the current booking total
    booking_price_total = CurrencyValueField()
    booking_price_breakdown = models.JSONField(
        default=dict, blank=True, editable=False, encoder=DecimalJSONEncoder
    )
    payment_method = models.PositiveSmallIntegerField(
        choices=list(AccountPaymentMethodType.choices.items())
    )
    invoice_status = models.PositiveSmallIntegerField(
        choices=list(InvoiceStatus.choices.items()), default=InvoiceStatus.PENDING
    )
    date_paid = models.DateTimeField(null=True)
    statement = models.ForeignKey(
        "scbp_core.AccountStatement", on_delete=models.SET_NULL, null=True, blank=True
    )

    # Record the payment for this invoice
    payment = models.ForeignKey(Payment, on_delete=models.PROTECT, null=True)

    class Meta(DefaultPermissionsMeta):
        db_table = "scbp_core_invoice"
        default_related_name = "invoices"
        constraints = [
            # Enforce that date_paid is null if status is Pending and is not null if status is Paid
            models.CheckConstraint(
                check=Q(date_paid__isnull=True, invoice_status=InvoiceStatus.PENDING)
                | Q(date_paid__isnull=False, invoice_status=InvoiceStatus.PAID),
                name="scbp_core_invoice_date_paid_status",
            ),
            # Enforce that payment is not set if amount is less than or equal to zero
            models.CheckConstraint(
                check=Q(invoice_total_amount__gt=0) | Q(payment__isnull=True),
                name="scbp_core_invoice_total_amount_payment",
            ),
            get_choices_check_constraint(
                AccountPaymentMethodType.choices,
                "payment_method",
                "scbp_core_invoice_payment_method",
            ),
            get_choices_check_constraint(
                InvoiceStatus.choices,
                "invoice_status",
                "scbp_core_invoice_invoice_status",
            ),
        ]

    INVOICE_SEQUENCE_NAME = "scbp_core_invoice_number_sequence"

    @classmethod
    def get_custom_migration_commands(cls):
        return [
            RunSQL(
                f"CREATE SEQUENCE IF NOT EXISTS {cls.INVOICE_SEQUENCE_NAME} START {INVOICE_NUMBER_START}",
                f"DROP SEQUENCE {cls.INVOICE_SEQUENCE_NAME}",
                elidable=False,
            )
        ]

    def __str__(self):
        return self.invoice_number

    def get_next_invoice_number(self):
        with connection.cursor() as cursor:
            cursor.execute("SELECT nextval(%s)", [self.INVOICE_SEQUENCE_NAME])
            row = cursor.fetchone()
            return row[0]

    def get_credit_card_surcharge_rate(self) -> Decimal:
        if self.credit_card_surcharge_rate:
            return self.credit_card_surcharge_rate
        elif self.payment_method != AccountPaymentMethodType.CREDIT_CARD:
            return Decimal(0)
        return get_surcharge_rate(self.booking.account.credit_card_type)

    def get_credit_card_surcharge(self) -> Decimal:
        return (
            self.invoice_total_amount * self.get_credit_card_surcharge_rate() / 100
        ).quantize(Decimal("0.01"))

    def get_available_for_refund(self) -> Decimal:
        if self.invoice_total_amount > 0 and self.payment:
            return self.payment.get_available_for_refund(self)
        return Decimal(0)

    @transaction.atomic
    def save(self, *args, **kwargs):
        # Assign invoice number
        if not self.id:
            self.invoice_number = str(self.get_next_invoice_number())

        # Set payment tracking variable to null - it's set in the conditional if it needs to be created and charged
        payment = None

        # Determine whether we need to create a payment record now
        account = self.booking.account
        if (
            not self.payment
            # Filter out pay to driver - if the driver isn't paid the booking can be adjusted to
            # make the corresponding booking charge the normal processes
            and self.booking.booking_payment_method
            != BookingPaymentMethod.DRIVER_COLLECT
            and account.payment_terms == AccountPaymentTermsType.COD
            and self.payment_method == AccountPaymentMethodType.CREDIT_CARD
            and self.invoice_total_amount > 0
        ):
            # If so, create the payment record and update the tracking variable
            payment = Payment(
                account=account,
                payment_method=AccountPaymentMethodType.CREDIT_CARD,
                base_amount=self.invoice_total_amount,
            )
            payment.save()
            self.payment = payment

        # Save the record
        super().save(*args, **kwargs)
        self.refresh_from_db()

        # Determine whether to create refund records
        if (
            (not self.pk or self.refunds.count() == 0)
            # Filter out pay to driver - if the driver isn't paid the booking can be adjusted to
            # make the corresponding booking charge the normal processes
            and self.booking.booking_payment_method
            != BookingPaymentMethod.DRIVER_COLLECT
            and account.payment_terms == AccountPaymentTermsType.COD
            and self.payment_method == AccountPaymentMethodType.CREDIT_CARD
            and self.invoice_total_amount < 0
        ):
            # If so, create the refund records
            available_refunds = self.booking.get_refund_amounts(
                -self.invoice_total_amount
            )
            for [transaction_id, base_amount, surcharge_rate] in available_refunds:
                total_amount = (base_amount * (1 + (surcharge_rate / 100))).quantize(
                    Decimal("0.01")
                )
                refund = Refund(
                    account=account,
                    payment_method=AccountPaymentMethodType.CREDIT_CARD,
                    base_amount=-base_amount,
                    total_amount=-total_amount,
                    invoice=self,
                    refund_of=Payment.objects.filter(
                        transaction_id=transaction_id
                    ).first(),
                )
                refund.save()
                refund.refund(defer=True, send_email=True)
            remaining_refund = -(
                self.invoice_total_amount
                + sum([amount for [_, amount, _] in available_refunds])
            )
            # Handle any refund that can't be allocated to an existing transaction
            if remaining_refund > 0:
                Refund(
                    account=account,
                    payment_method=AccountPaymentMethodType.CREDIT_CARD,
                    base_amount=-remaining_refund,
                    invoice=self,
                    error_message="Insufficient eWay transactions to process refund",
                ).save()

        # Charge the payment for this invoice if it is newly created
        if payment:
            payment.charge(defer=True, send_email=True)
