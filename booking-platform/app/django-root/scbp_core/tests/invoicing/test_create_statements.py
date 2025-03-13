from decimal import Decimal
from unittest.mock import MagicMock
from unittest.mock import Mock
from unittest.mock import patch

from django.test import TestCase
from django.utils import timezone

from scbp_core.models import AccountPaymentMethodType
from scbp_core.models import AccountPaymentTermsType
from scbp_core.models import Booking
from scbp_core.models import BookingDriverCollectMethod
from scbp_core.models import BookingPaymentMethod
from scbp_core.models import BookingPriceVariation
from scbp_core.models import BookingStatus
from scbp_core.models import InvoiceStatus
from scbp_core.models import PriceVariationType
from scbp_core.models import StatementStatus
from scbp_core.services.pricing import PriceCalculator
from scbp_core.tasks.charge_payment import charge_payment
from scbp_core.tasks.create_statements import create_statements
from scbp_core.tests.distance_mock_decorators import test_case_mock_distance_to_gpo
from scbp_core.tests.factory.account import AccountWithClientUserFactory
from scbp_core.tests.factory.booking import BookingFactory
from scbp_core.tests.factory.user import ClientUserFactory
from scbp_core.tests.factory.user import StaffFactory


@test_case_mock_distance_to_gpo
class CreateStatementsTestCase(TestCase):
    fixtures = ["vehicle_class.json", "hour_rate_type.json"]

    def setUp(self) -> None:
        client_user = ClientUserFactory()
        self.account = AccountWithClientUserFactory(
            clients__client_user=client_user,
            payment_terms=AccountPaymentTermsType.THIRTY_DAYS,
            payment_method=AccountPaymentMethodType.CREDIT_CARD,
            approved_by=StaffFactory(),
            eway_token_customer_id="12345",
        )

    def _create_booking(
        self, price_total, payment_method=BookingPaymentMethod.CREDIT_CARD
    ) -> Booking:
        fees = Decimal("5.00")
        without_fees = str(price_total - fees)
        invoice_breakdown = {
            "booking_value": str(price_total),
            "company_fee": "0.00",
            "booking_fees": fees,
            "out_of_pocket": "0.00",
            "driver_value": without_fees,
            "travel_charge": without_fees,
            "time_surcharge": "0.00",
            "requests": "0.00",
            "variations_charge": "0.00",
            "waiting_charge": "0.00",
        }

        booking = BookingFactory(
            account=self.account,
            booking_status=BookingStatus.UNVERIFIED,
            price_total=price_total,
            invoice_breakdown=invoice_breakdown,
            booking_payment_method=payment_method,
            driver_collect_method=(
                BookingDriverCollectMethod.CAB_CASH
                if payment_method == BookingPaymentMethod.DRIVER_COLLECT
                else BookingDriverCollectMethod.NONE
            ),
        )
        return booking

    @patch("eway.token_payment.TokenPayment.charge")
    @patch("scbp_core.models.payment.Payment.charge", autospec=True)
    def test_payment_charged(
        self, payment_charge: MagicMock, token_payment_charge: MagicMock
    ):
        booking = self._create_booking(Decimal(75))
        self.assertEqual(booking.invoices.count(), 0)
        booking.booking_status = BookingStatus.COMPLETED
        booking.save()
        self.assertEqual(booking.invoices.count(), 1)
        self.assertEqual(booking.invoices.first().invoice_status, InvoiceStatus.PENDING)
        lower = timezone.now() - timezone.timedelta(days=30)
        upper = timezone.now() + timezone.timedelta(days=30)

        payment_charge.side_effect = (
            lambda payment, defer, send_email=False: charge_payment.run(
                payment_id=payment.id, send_email=send_email
            )
        )

        class response:
            TransactionID = "123929321"

        token_payment_charge.return_value = response

        create_statements.run(
            raw_lower=lower.strftime("%Y-%m-%d"), raw_upper=upper.strftime("%Y-%m-%d")
        )

        self.assertEqual(self.account.statements.count(), 1)
        statement = self.account.statements.first()
        invoice = statement.invoices.first()
        self.assertTrue(payment_charge.called)
        self.assertEqual(invoice.invoice_status, InvoiceStatus.PAID)

    @patch("eway.token_payment.TokenPayment.charge")
    @patch("scbp_core.models.payment.Payment.charge", autospec=True)
    def test_statement_with_only_refund(
        self, payment_charge: MagicMock, token_payment_charge: MagicMock
    ):
        booking = self._create_booking(Decimal(75))
        self.assertEqual(booking.invoices.count(), 0)
        booking.booking_status = BookingStatus.COMPLETED
        booking.save()
        self.assertEqual(booking.invoices.count(), 1)
        self.assertEqual(booking.invoices.first().invoice_status, InvoiceStatus.PENDING)
        lower = timezone.now() - timezone.timedelta(days=30)
        upper = timezone.now() + timezone.timedelta(days=30)

        payment_charge.side_effect = (
            lambda payment, defer, send_email=False: charge_payment.run(
                payment_id=payment.id, send_email=send_email
            )
        )

        class response:
            TransactionID = "123929321"

        token_payment_charge.return_value = response

        create_statements.run(
            raw_lower=lower.strftime("%Y-%m-%d"), raw_upper=upper.strftime("%Y-%m-%d")
        )

        self.assertEqual(self.account.statements.count(), 1)
        statement = self.account.statements.first()
        invoice = statement.invoices.first()
        self.assertTrue(payment_charge.called)
        self.assertEqual(invoice.invoice_status, InvoiceStatus.PAID)

        variation = BookingPriceVariation.objects.create(
            booking=booking,
            variation_type=PriceVariationType.DISCOUNT,
            amount=Decimal("-20"),
        )
        booking.get_distance = Mock(name="get_distance")
        booking.get_distance.return_value = Decimal(booking.total_distance)
        calculator = PriceCalculator(
            booking,
            booking.price_list,
            price_variations=[variation],
            use_previous=True,
        )
        booking.update_from_calculator(calculator)
        booking.save()

        self.assertEqual(booking.invoices.count(), 2)

        self.assertEqual(self.account.statements.count(), 1)

        # Refunds should be ignored
        create_statements.run(
            raw_lower=lower.strftime("%Y-%m-%d"), raw_upper=upper.strftime("%Y-%m-%d")
        )
        self.assertEqual(self.account.statements.count(), 1)
        statement = self.account.statements.first()
        self.assertEqual(statement.statement_status, StatementStatus.PAID)
        self.assertIsNotNone(statement.date_paid)

        variation = BookingPriceVariation.objects.create(
            booking=booking,
            variation_type=PriceVariationType.DISCOUNT,
            amount=Decimal("20"),
        )
        calculator = PriceCalculator(
            booking,
            booking.price_list,
            price_variations=[variation],
            use_previous=True,
        )
        booking.update_from_calculator(calculator)
        booking.save()

        self.assertEqual(booking.invoices.count(), 3)
        create_statements.run(
            raw_lower=lower.strftime("%Y-%m-%d"), raw_upper=upper.strftime("%Y-%m-%d")
        )
        self.assertEqual(self.account.statements.count(), 2)

    @patch("eway.token_payment.TokenPayment.charge")
    @patch("scbp_core.models.payment.Payment.charge", autospec=True)
    def test_correct_payment_method_used(
        self, payment_charge: MagicMock, token_payment_charge: MagicMock
    ):
        """
        If the booking payment method is set to DRIVER_COLLECT, this payment method should be used over the account
        payment method. The invoice status should be set to PAID for a booking DRIVER_COLLECT payment method.

        An AccountStatement won't be created as the invoice will be paid and excluded. Payment should not be raised as
        the customer has already paid for the booking to the driver.
        """
        booking = self._create_booking(
            Decimal(75), payment_method=BookingPaymentMethod.DRIVER_COLLECT
        )
        self.assertEqual(booking.invoices.count(), 0)
        booking.booking_status = BookingStatus.COMPLETED
        booking.save()
        self.assertEqual(booking.invoices.count(), 1)
        self.assertEqual(booking.invoices.first().invoice_status, InvoiceStatus.PAID)
        lower = timezone.now() - timezone.timedelta(days=30)
        upper = timezone.now() + timezone.timedelta(days=30)

        # Set-up for mocking charge but charge should never be called as the statement save method will only call charge
        # if the invoice status is PENDING.
        payment_charge.side_effect = (
            lambda payment, defer, send_email=False: charge_payment.run(
                payment_id=payment.id, send_email=send_email
            )
        )

        class response:
            TransactionID = "123929321"

        token_payment_charge.return_value = response

        create_statements.run(
            raw_lower=lower.strftime("%Y-%m-%d"), raw_upper=upper.strftime("%Y-%m-%d")
        )

        self.assertEqual(self.account.statements.count(), 0)
        # Confirm that the 'charge_payment' method wasn't called.
        self.assertFalse(payment_charge.called)

    @patch("eway.token_payment.TokenPayment.charge")
    @patch("scbp_core.models.payment.Payment.charge", autospec=True)
    def test_statement_generation_excludes_paid_invoices(
        self, payment_charge: MagicMock, token_payment_charge: MagicMock
    ):
        """
        If the booking payment method is set to DRIVER_COLLECT, the invoice status should be set to PAID for a booking.
        An AccountStatement will be created only for invoices that have not been paid.
        """
        booking = self._create_booking(
            Decimal(75), payment_method=BookingPaymentMethod.DRIVER_COLLECT
        )
        self.assertEqual(booking.invoices.count(), 0)
        booking.booking_status = BookingStatus.COMPLETED
        booking.save()
        self.assertEqual(booking.invoices.count(), 1)
        self.assertEqual(booking.invoices.first().invoice_status, InvoiceStatus.PAID)

        booking_two = self._create_booking(Decimal(100))
        self.assertEqual(booking_two.invoices.count(), 0)
        booking_two.booking_status = BookingStatus.COMPLETED
        booking_two.save()
        self.assertEqual(booking_two.invoices.count(), 1)
        self.assertEqual(
            booking_two.invoices.first().invoice_status, InvoiceStatus.PENDING
        )

        lower = timezone.now() - timezone.timedelta(days=30)
        upper = timezone.now() + timezone.timedelta(days=30)

        payment_charge.side_effect = (
            lambda payment, defer, send_email=False: charge_payment.run(
                payment_id=payment.id, send_email=send_email
            )
        )

        class response:
            TransactionID = "123929321"

        token_payment_charge.return_value = response

        create_statements.run(
            raw_lower=lower.strftime("%Y-%m-%d"), raw_upper=upper.strftime("%Y-%m-%d")
        )

        self.assertEqual(self.account.statements.count(), 1)
        statement = self.account.statements.first()
        self.assertEqual(statement.invoices.count(), 1)
        invoice = statement.invoices.first()
        self.assertEqual(invoice.invoice_status, InvoiceStatus.PAID)
        self.assertTrue(payment_charge.called)
