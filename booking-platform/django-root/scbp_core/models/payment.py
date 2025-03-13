from decimal import Decimal

from django.db import models

from scbp_core.fields import CurrencyValueField
from scbp_core.fields import get_choices_check_constraint
from scbp_core.models.account import Account
from scbp_core.models.account_field_choices import AccountPaymentMethodType
from scbp_core.models.payment_field_choices import PaymentStatus
from scbp_core.permissions import DefaultPermissionsMeta
from scbp_core.tasks.charge_payment import charge_payment
from scbp_core.tasks.charge_payment import refund_payment


class PaymentRecord(models.Model):
    """
    Base model class for payment records - allows access to all payment records regardless of amount
    Do not use this directly unless absolutely necessary - use Payment or Refund instead depending
        on the payment amount
    """

    # Track creation date - used to determine the most recent payment attempt for an invoice/statement
    # e.g. on outstanding CC screen
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    # References to the account and payment method used at the time of this payment
    account = models.ForeignKey(Account, on_delete=models.PROTECT)
    payment_method = models.PositiveSmallIntegerField(
        choices=AccountPaymentMethodType.choices.items()
    )

    # The amount incorporated in this payment attempt
    base_amount = CurrencyValueField()
    total_amount = CurrencyValueField(blank=True, null=True)

    # Payment status
    status = models.PositiveSmallIntegerField(
        choices=PaymentStatus.choices.items(), default=PaymentStatus.PENDING
    )
    error_message = models.CharField(blank=True, max_length=256)
    transaction_id = models.BigIntegerField(blank=True, null=True)

    # Reference of refunded transaction - related name "refunds" reflects the fact
    # that any record having this record as its refund_of is a refund of this payment
    refund_of = models.ForeignKey(
        "Payment", on_delete=models.PROTECT, null=True, related_name="refunds"
    )

    # Invoice - enforces the one-to-many relationship between refunds and invoices
    # Must be set for refunds and Must not be set for payments
    invoice = models.ForeignKey(
        "Invoice", on_delete=models.PROTECT, null=True, related_name="refunds"
    )

    class Meta(DefaultPermissionsMeta):
        db_table = "scbp_core.payment_record"
        default_related_name = "payments"

        constraints = [
            get_choices_check_constraint(
                AccountPaymentMethodType.choices,
                "payment_method",
                "scbp_core_payment_payment_method",
            ),
            get_choices_check_constraint(
                PaymentStatus.choices, "status", "scbp_core_payment_status"
            ),
            # Enforce that the base amount is non-zero
            models.CheckConstraint(
                check=~models.Q(base_amount=0),
                name="scbp_core_payment_record_amount_nonzero",
            ),
            # Enforce that records with negative base_amount have refund_of set
            models.CheckConstraint(
                check=models.Q(refund_of__isnull=True) | models.Q(base_amount__lt=0),
                name="scbp_core_payment_record_negative_amount_with_refund_of",
            ),
            # Enforce that invoice is set if base_amount < 0 and is not set if base_amount > 0
            models.CheckConstraint(
                check=models.Q(invoice__isnull=True, base_amount__gt=0)
                | models.Q(invoice__isnull=False, base_amount__lt=0),
                name="scbp_core_payment_record_invoice_base_amount_validation",
            ),
        ]

    def get_payment_number(self):
        return f"PMT-{self.id}"

    def get_expected_surcharge(self):
        return sum(
            [invoice.get_credit_card_surcharge() for invoice in self.invoices.all()],
            Decimal(0),
        )

    def get_with_type(self):
        if self.base_amount < 0:
            return Refund.objects.get(pk=self.pk)
        return Payment.objects.get(pk=self.pk)

    def process(self, *, defer, **kwargs):
        return self.get_with_type().process(defer=defer, **kwargs)


class PaymentManager(models.Manager):
    def get_queryset(self):
        return super().get_queryset().filter(base_amount__gt=0)


class Payment(PaymentRecord):
    """
    PaymentRecord proxy filtered to only include records with positive payment amount
    Use for records with positive payment amounts in preference to PaymentRecord
    """

    objects = PaymentManager()

    class Meta(DefaultPermissionsMeta):
        proxy = True

    def process(self, *, defer, **kwargs):
        return self.charge(defer=defer, **kwargs)

    def charge(self, *, defer, send_email=False):
        """
        Triggers the implementation of the credit card charge process for this payment
        :param defer: Whether to run the charge process in the background
        :param send_email: Whether to send invoice email after charge is successful (not sent if fails)
        :return:
        """
        if defer:
            charge_payment.delay(payment_id=self.id, send_email=send_email)
        else:
            charge_payment.run(payment_id=self.id, send_email=send_email)

    def get_available_for_refund(self, invoice) -> Decimal:
        if invoice.payment != self:
            return Decimal(0)
        return invoice.invoice_total_amount + (
            self.refunds.aggregate(models.Sum("base_amount"))["base_amount__sum"]
            or Decimal(0)
        )


class RefundManager(models.Manager):
    def get_queryset(self):
        return super().get_queryset().filter(base_amount__lt=0)


class Refund(PaymentRecord):
    """
    PaymentRecord proxy filtered to only include records with negative payment amount
    Use for records with negative payment amounts in preference to PaymentRecord
    """

    objects = RefundManager()

    class Meta(DefaultPermissionsMeta):
        proxy = True

    def process(self, *, defer, **kwargs):
        return self.refund(defer=defer, **kwargs)

    def refund(self, *, defer, **kwargs):
        """
        Triggers the implementation of the credit card refund process for this refund
        :param defer: Whether to run the refund process in the background
        """
        if defer:
            refund_payment.delay(payment_id=self.id, **kwargs)
        else:
            refund_payment.run(payment_id=self.id, **kwargs)
