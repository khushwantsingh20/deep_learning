from decimal import Decimal
from unittest.mock import patch

from django.test import TestCase

from scbp_core.models import AccountPaymentMethodType
from scbp_core.models import InvoiceStatus
from scbp_core.models import PaymentStatus
from scbp_core.tasks.charge_payment import charge_payment
from scbp_core.tests.factory.account import AccountFactory
from scbp_core.tests.factory.invoice import InvoiceFactory
from scbp_core.tests.factory.invoice import PaymentFactory


class PaymentTest(TestCase):
    fixtures = ["vehicle_class.json"]

    def setUp(self):
        self.account = AccountFactory.create(
            eway_token_customer_id="1234",
            payment_method=AccountPaymentMethodType.CREDIT_CARD,
            credit_card_type="Visa",
        )

    @patch("eway.token_payment.TokenPayment.charge")
    def test_payment_email_failure(self, token_charge):
        """Make sure payment still recorded even if invoice email fails"""
        payment = PaymentFactory.create(
            account=self.account,
            base_amount=Decimal("25.00"),
            total_amount=Decimal("25.50"),
            status=PaymentStatus.PENDING,
        )
        invoice = InvoiceFactory(payment=payment, invoice_status=InvoiceStatus.PENDING)

        class response:
            TransactionID = "12345"

        token_charge.return_value = response
        with patch(
            "scbp_core.tasks.charge_payment.send_invoice_email",
        ) as email_mock:
            with self.assertRaises(ValueError):
                email_mock.side_effect = ValueError()
                email_mock.return_value = 666
                charge_payment.run(payment_id=payment.id, send_email=True)
            # Even if email sending fails the payment should still be saved
            payment.refresh_from_db()
            self.assertEqual(payment.status, PaymentStatus.SUCCESS)
            invoice.refresh_from_db()
            self.assertEqual(invoice.invoice_status, InvoiceStatus.PAID)
