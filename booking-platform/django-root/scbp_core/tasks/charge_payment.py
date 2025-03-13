from decimal import Decimal
import logging
from smtplib import SMTPException

from celery import shared_task
from django.db import transaction
from django.utils import timezone

from eway import EwayError
from eway import TokenPayment
from eway import Transaction
from scbp_core.base_task import TransactionAwareTask
from scbp_core.models import AccountStatement
from scbp_core.models.account_field_choices import AccountPaymentMethodType
from scbp_core.models.payment_field_choices import PaymentStatus
from scbp_core.services.send_invoice_email import send_invoice_email

logger = logging.getLogger("payments")


@shared_task(base=TransactionAwareTask)
def charge_payment(*, payment_id: int, send_email=False):
    # Local import to avoid circular import
    from scbp_core.models import Payment

    invoices_to_send = []

    with transaction.atomic():
        payments = Payment.objects.filter(id=payment_id).select_for_update()
        payment = payments.first()
        if (
            payment
            and payment.payment_method == AccountPaymentMethodType.CREDIT_CARD
            and payment.status != PaymentStatus.SUCCESS
        ):
            try:
                eway_token_customer_id = int(payment.account.eway_token_customer_id)
            except ValueError:
                # Some imported records have invalid eway tokens
                payment.status = PaymentStatus.FAILURE
                payment.error_message = f"Invalid eWay token customer id '{payment.account.eway_token_customer_id}'. Check account should be credit card and if so re-add credit card."
                payment.save()
                return

            try:
                # Get the amount to charge including the CC surcharge rate
                invoices = (
                    payment.invoices.all().select_related("booking").select_for_update()
                )
                surcharge_amount = sum(
                    [invoice.get_credit_card_surcharge() for invoice in invoices],
                    Decimal(0),
                )
                amount = payment.base_amount + surcharge_amount
                amount_in_cents = int(amount * 100)
                invoice_numbers = []
                booking_numbers = []
                for invoice in invoices:
                    invoice_numbers.append(invoice.invoice_number)
                    booking_numbers.append(invoice.booking.booking_number)
                # Charge the payment
                data = TokenPayment.charge(
                    eway_token_customer_id,
                    amount_in_cents,
                    invoice_ref=", ".join(invoice_numbers),
                    invoice_description=", ".join(map(str, booking_numbers)),
                )
                # Record the payment success against the payment
                payment.status = PaymentStatus.SUCCESS
                payment.transaction_id = data.TransactionID
                payment.error_message = ""
                payment.total_amount = amount
                payment.save()
                # Update the invoices to fix the surcharge rate
                from scbp_core.models import InvoiceStatus
                from scbp_core.models import StatementStatus

                date_paid = timezone.now()
                statement_ids = set()
                for invoice in invoices:
                    invoice.credit_card_surcharge_rate = (
                        invoice.get_credit_card_surcharge_rate()
                    )
                    invoice.invoice_status = InvoiceStatus.PAID
                    invoice.date_paid = date_paid
                    invoice.save()
                    if invoice.statement_id:
                        # All invoices on a statement are paid together so once
                        # the invoice is paid mark statement as paid as well
                        statement_ids.add(invoice.statement_id)
                    if send_email:
                        # Do the sending outside the transaction in case it fails
                        invoices_to_send.append(invoice)
                if statement_ids:
                    AccountStatement.objects.filter(pk__in=statement_ids).update(
                        date_paid=date_paid, statement_status=StatementStatus.PAID
                    )
            except EwayError as e:
                payment.status = PaymentStatus.FAILURE
                payment.error_message = e.__str__()
                payment.save()

    for invoice in invoices_to_send:
        try:
            send_invoice_email(invoice)
        except SMTPException as e:
            logger.exception(
                e,
                f"Failed to send invoice for {invoice.id} ({invoice.invoice_number})",
            )


@shared_task(base=TransactionAwareTask)
def refund_payment(*, payment_id: int, send_email=False):
    # Local import to avoid circular import
    from scbp_core.models import Refund

    with transaction.atomic():
        refunds = Refund.objects.filter(id=payment_id).select_for_update()
        refund = refunds.first()
        if (
            refund
            and refund.refund_of
            and refund.payment_method == AccountPaymentMethodType.CREDIT_CARD
            and refund.status != PaymentStatus.SUCCESS
        ):
            try:
                # Get the amount to charge including the CC surcharge rate
                surcharge_amount = refund.invoice.get_credit_card_surcharge()
                amount_in_cents = -int((refund.base_amount + surcharge_amount) * 100)
                # Charge the payment
                data = Transaction.refund(
                    refund.refund_of.transaction_id, amount_in_cents
                )
                # Record the payment success against the payment
                refund.status = PaymentStatus.SUCCESS
                refund.transaction_id = data.TransactionID
                refund.error_message = ""
                refund.total_amount = refund.base_amount + surcharge_amount
                refund.save()
                if send_email:
                    send_invoice_email(refund.invoice)
            except EwayError as e:
                refund.status = PaymentStatus.FAILURE
                refund.error_message = e.__str__()
                refund.save()
