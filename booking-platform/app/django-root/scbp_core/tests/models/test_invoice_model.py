from unittest.mock import patch

from django.db import IntegrityError
from django.test import TransactionTestCase
from django.utils import timezone

from scbp_core.models import InvoiceStatus
from scbp_core.models.account_statement import StatementStatus
from scbp_core.tests.factory.invoice import AccountStatementFactory
from scbp_core.tests.factory.invoice import InvoiceFactory


@patch("scbp_core.models.payment.Payment.charge")
@patch("scbp_core.tasks.charge_payment")
class TestInvoiceModel(TransactionTestCase):
    fixtures = ["vehicle_class.json"]

    def test_invoice_date_set_when_paid(self, *_):
        with self.assertRaisesMessage(IntegrityError, "violates check"):
            InvoiceFactory(invoice_status=InvoiceStatus.PAID)

        with self.assertRaisesMessage(IntegrityError, "violates check"):
            InvoiceFactory(
                invoice_status=InvoiceStatus.PENDING, date_paid=timezone.now()
            )
        InvoiceFactory(invoice_status=InvoiceStatus.PAID, date_paid=timezone.now())

    def test_statement_date_set_when_paid(self, *_):
        with self.assertRaisesMessage(IntegrityError, "violates check"):
            AccountStatementFactory(statement_status=StatementStatus.PAID)

        with self.assertRaisesMessage(IntegrityError, "violates check"):
            AccountStatementFactory(
                statement_status=StatementStatus.PENDING, date_paid=timezone.now()
            )
        AccountStatementFactory(
            statement_status=StatementStatus.PAID, date_paid=timezone.now()
        )
