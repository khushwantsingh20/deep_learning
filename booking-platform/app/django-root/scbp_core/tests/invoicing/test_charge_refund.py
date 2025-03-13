from decimal import Decimal
from unittest.mock import patch

from django.test import TestCase
import factory

from scbp_core.models import AccountPaymentMethodType
from scbp_core.tasks.charge_payment import refund_payment
from scbp_core.tests.factory.account import AccountFactory
from scbp_core.tests.factory.booking import BookingFactory
from scbp_core.tests.factory.invoice import InvoiceFactory
from scbp_core.tests.factory.invoice import PaymentFactory
from scbp_core.tests.factory.invoice import RefundFactory
from scbp_core.tests.factory.util import FuzzyPositiveInteger


class MockRefundReturn:
    def __init__(self):
        self.TransactionID = FuzzyPositiveInteger()


@patch("scbp_core.models.payment.Payment.charge")
@patch("scbp_core.tasks.charge_payment")
class RefundTest(TestCase):
    fixtures = ["vehicle_class.json"]

    def setUp(self):
        self.account = AccountFactory.create(
            payment_method=AccountPaymentMethodType.CREDIT_CARD, credit_card_type="Visa"
        )
        self.payment = PaymentFactory.create(
            account=self.account,
            base_amount=Decimal("25.00"),
            total_amount=Decimal("25.50"),
        )

    @patch(
        "scbp_core.tasks.charge_payment.Transaction.refund",
        return_value=MockRefundReturn(),
    )
    def test_refund_includes_surcharge(self, mock_refund, *_):
        refund = RefundFactory.create(
            account=self.account,
            base_amount=Decimal("-10.00"),
            refund_of=self.payment,
            invoice=factory.SubFactory(
                InvoiceFactory,
                payment_method=AccountPaymentMethodType.CREDIT_CARD,
                invoice_total_amount=Decimal("-10.00"),
                booking=factory.SubFactory(
                    BookingFactory,
                    account=self.account,
                    booking_payment_method=AccountPaymentMethodType.CREDIT_CARD,
                ),
            ),
        )
        self.assertEqual(refund.invoice.get_credit_card_surcharge(), Decimal("-0.20"))
        refund_payment.run(payment_id=refund.id)
        mock_refund.assert_called_with(self.payment.transaction_id, 1020)
