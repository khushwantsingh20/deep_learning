from decimal import Decimal
import re
from unittest.mock import patch

from django.test import TestCase

from scbp_core.models import AccountPaymentMethodType
from scbp_core.models import BookingDriverCollectMethod
from scbp_core.models import BookingPaymentMethod
from scbp_core.models import BookingStatus
from scbp_core.models import InvoiceStatus
from scbp_core.tests.factory.booking import BookingFactory


@patch("scbp_core.models.payment.Payment.charge")
@patch("scbp_core.tasks.charge_payment")
class CreateInvoiceTestCase(TestCase):
    fixtures = ["vehicle_class.json"]

    def assert_invoice_component(self, invoice, field_name, expected_value):
        invoice_amounts = {
            key: getattr(invoice, key)
            for key in invoice.__dict__
            if re.search("amount$", key) or key == "booking_price_total"
        }
        self.assertEqual(
            getattr(invoice, field_name, None),
            expected_value,
            f"Expected {field_name} to have value {expected_value} within {invoice_amounts}",
        )

    def test_create_when_complete(self, *_):
        """
        Test invoice created whenever a completed booking is created

        Either creates initial invoice for full amount or invoice corresponding
        to difference between last invoice and current booking total
        """
        low_invoice_breakdown = {
            "booking_value": "75.00",
            "company_fee": "0.00",
            "booking_fees": "5.00",
            "out_of_pocket": "0.00",
            "driver_value": "70.00",
            "travel_charge": "70.00",
            "time_surcharge": "0.00",
            "requests": "0.00",
            "variations_charge": "0.00",
            "waiting_charge": "0.00",
        }
        high_invoice_breakdown = {
            "booking_value": "85.00",
            "company_fee": "0.00",
            "booking_fees": "5.00",
            "out_of_pocket": "0.00",
            "driver_value": "80.00",
            "travel_charge": "80.00",
            "time_surcharge": "0.00",
            "requests": "0.00",
            "variations_charge": "0.00",
            "waiting_charge": "0.00",
        }
        booking = BookingFactory(
            booking_status=BookingStatus.UNVERIFIED,
            price_total=Decimal("75.00"),
            invoice_breakdown=low_invoice_breakdown,
        )

        self.assertEqual(booking.invoices.count(), 0)
        booking.booking_status = BookingStatus.VERIFIED
        booking.save()
        self.assertEqual(booking.invoices.count(), 0)
        booking.booking_status = BookingStatus.COMPLETED
        booking.save()
        self.assertEqual(booking.invoices.count(), 1)
        invoice = booking.invoices.first()
        self.assert_invoice_component(
            invoice, "booking_price_total", booking.price_total
        )
        self.assert_invoice_component(
            invoice, "invoice_total_amount", booking.price_total
        )
        booking.save()
        self.assertEqual(booking.invoices.count(), 1)
        # Increase booking price, should create invoice for difference allocated to travel_charge_amount
        booking.price_total = booking.price_total + Decimal("10")
        booking.invoice_breakdown = high_invoice_breakdown
        booking.save()
        self.assertEqual(booking.invoices.count(), 2)
        invoice = booking.invoices.order_by("-created_at").first()
        self.assert_invoice_component(
            invoice, "booking_price_total", booking.price_total
        )
        self.assert_invoice_component(invoice, "invoice_total_amount", Decimal("10"))
        self.assert_invoice_component(invoice, "travel_charge_amount", Decimal("10"))

        # Decrease booking price, should create invoice (credit) for difference
        booking.price_total = booking.price_total - Decimal("10")
        booking.invoice_breakdown = low_invoice_breakdown
        booking.save()
        self.assertEqual(booking.invoices.count(), 3)
        invoice = booking.invoices.order_by("-created_at").first()
        self.assert_invoice_component(
            invoice, "booking_price_total", booking.price_total
        )
        self.assertEqual(invoice.booking_price_total, booking.price_total)
        self.assert_invoice_component(invoice, "invoice_total_amount", Decimal("-10"))
        self.assert_invoice_component(invoice, "travel_charge_amount", Decimal("-10"))

    def test_first_invoice_price_breakdown(self, *_):
        """
        Tests whether the price breakdown is correctly converted to the invoice breakdown when creating
        the initial invoice - handling of subsequent invoices is the subject of another test
        """
        price_breakdown = {
            "total": "280.10",
            "base": {
                "distance": "53.5",
                "car_class": "25.00",
                "peak": "5.00",
                "tier1": "20.00",
                "tier2": "80.00",
                "tier3": "45.00",
                "subtotal": "175.00",
            },
            "options": {
                "ribbon": "10.00",
                "child_seats": "10.00",
                "color": "10.00",
                "car_park_pass": "5.00",
                "additional_stops": "15.00",
                "subtotal": "50.00",
            },
            "price_variations": {
                "items": [("Waiting", "10.00"), ("Other", "12.00")],
                "subtotal": "22.00",
            },
            "out_of_pockets": {
                "items": [("Test out of pocket", "10.00")],
                "subtotal": "10.00",
            },
            "fees": {
                "government": "1.10",
                "company": "2.00",
                "airport": "10.00",
                "out_of_area": "5.00",
                "airport_parking": "5.00",
                "subtotal": "23.10",
            },
        }
        invoice_breakdown = {
            "booking_value": "280.10",
            "company_fee": "2.00",
            "booking_fees": "1.10",
            "out_of_pocket": "10.00",
            "driver_value": "267.00",
            "travel_charge": "190.00",
            "time_surcharge": "5.00",
            "requests": "50.00",
            "variations_charge": "12.00",
            "waiting_charge": "10.00",
        }
        booking = BookingFactory.create(
            booking_status=BookingStatus.COMPLETED,
            price_total=Decimal("280.10"),
            price_breakdown=price_breakdown,
            invoice_breakdown=invoice_breakdown,
        )
        self.assertEqual(booking.invoices.count(), 1)
        invoice = booking.invoices.first()
        self.assert_invoice_component(invoice, "booking_price_total", Decimal("280.10"))
        self.assert_invoice_component(invoice, "requests_amount", Decimal("50.00"))
        self.assert_invoice_component(invoice, "time_surcharge_amount", Decimal("5.00"))
        self.assert_invoice_component(
            invoice, "waiting_charge_amount", Decimal("10.00")
        )
        self.assert_invoice_component(invoice, "variations_amount", Decimal("12.00"))
        self.assert_invoice_component(invoice, "out_of_pocket_amount", Decimal("10.00"))
        self.assert_invoice_component(invoice, "fee_amount", Decimal("1.10"))
        self.assert_invoice_component(invoice, "company_fee_amount", Decimal("2.00"))
        self.assert_invoice_component(
            invoice, "travel_charge_amount", Decimal("190.00")
        )

    def test_additional_invoice_variation_price_breakdown(self, *_):
        """
        Tests whether subsequent invoices correctly set the breakdown
        - This test focuses on the price variation components
        """
        initial_price_breakdown = {
            "total": "75.00",
            "base": {"tier1": "25.00", "tier2": "45.00", "subtotal": "70.00"},
            "fees": {"government": "1.10", "company": "3.90", "subtotal": "5.00"},
        }
        final_price_breakdown = {
            "total": "110.00",
            "base": {"tier1": "25.00", "tier2": "45.00", "subtotal": "70.00"},
            "fees": {"government": "1.10", "company": "3.90", "subtotal": "5.00"},
            "price_variations": {
                "items": [("Waiting", "15.00"), ("Ad Hoc Additional Stop", "20.00")]
            },
        }
        initial_invoice_breakdown = {
            "booking_value": "75.00",
            "company_fee": "0.00",
            "booking_fees": "5.00",
            "out_of_pocket": "0.00",
            "driver_value": "70.00",
            "travel_charge": "70.00",
            "time_surcharge": "0.00",
            "requests": "0.00",
            "variations_charge": "0.00",
            "waiting_charge": "0.00",
        }
        final_invoice_breakdown = {
            "booking_value": "110.00",
            "company_fee": "0.00",
            "booking_fees": "5.00",
            "out_of_pocket": "0.00",
            "driver_value": "105.00",
            "travel_charge": "70.00",
            "time_surcharge": "0.00",
            "requests": "0.00",
            "variations_charge": "20.00",
            "waiting_charge": "15.00",
        }
        booking = BookingFactory.create(
            booking_status=BookingStatus.COMPLETED,
            price_total=Decimal("75.00"),
            price_breakdown=initial_price_breakdown,
            invoice_breakdown=initial_invoice_breakdown,
        )
        self.assertEqual(booking.invoices.count(), 1)
        invoice = booking.invoices.first()
        self.assert_invoice_component(invoice, "booking_price_total", Decimal("75.00"))
        self.assert_invoice_component(invoice, "invoice_total_amount", Decimal("75.00"))
        self.assert_invoice_component(invoice, "variations_amount", Decimal("0.00"))
        self.assert_invoice_component(invoice, "waiting_charge_amount", Decimal("0.00"))
        booking.price_total = Decimal("110.00")
        booking.price_breakdown = final_price_breakdown
        booking.invoice_breakdown = final_invoice_breakdown
        booking.save()
        self.assertEqual(booking.invoices.count(), 2)
        invoice = booking.invoices.order_by("-created_at").first()
        self.assert_invoice_component(invoice, "booking_price_total", Decimal("110.00"))
        self.assert_invoice_component(invoice, "invoice_total_amount", Decimal("35.00"))
        self.assert_invoice_component(invoice, "variations_amount", Decimal("20.00"))
        self.assert_invoice_component(
            invoice, "waiting_charge_amount", Decimal("15.00")
        )
        booking.price_total = Decimal("75.00")
        booking.price_breakdown = initial_price_breakdown
        booking.invoice_breakdown = initial_invoice_breakdown
        booking.save()
        invoice = booking.invoices.order_by("-created_at").first()
        self.assert_invoice_component(invoice, "booking_price_total", Decimal("75.00"))
        self.assert_invoice_component(
            invoice, "invoice_total_amount", Decimal("-35.00")
        )
        self.assert_invoice_component(invoice, "variations_amount", Decimal("-20.00"))
        self.assert_invoice_component(
            invoice, "waiting_charge_amount", Decimal("-15.00")
        )

    def test_additional_invoice_out_of_pocket_price_breakdown(self, *_):
        """
        Tests whether subsequent invoices correctly set the breakdown
        - This test focuses on the out of pocket component
        """
        initial_price_breakdown = {
            "total": "75.00",
            "base": {"tier1": "25.00", "tier2": "45.00", "subtotal": "70.00"},
            "fees": {"government": "1.10", "company": "3.90", "subtotal": "5.00"},
        }
        final_price_breakdown = {
            "total": "90.00",
            "base": {"tier1": "25.00", "tier2": "45.00", "subtotal": "70.00"},
            "fees": {"government": "1.10", "company": "3.90", "subtotal": "5.00"},
            "out_of_pockets": {
                "subtotal": "15.00",
                "items": [("Test out of pocket", "15.00")],
            },
        }
        initial_invoice_breakdown = {
            "booking_value": "75.00",
            "company_fee": "0.00",
            "booking_fees": "5.00",
            "out_of_pocket": "0.00",
            "driver_value": "70.00",
            "travel_charge": "70.00",
            "time_surcharge": "0.00",
            "requests": "0.00",
            "variations_charge": "0.00",
            "waiting_charge": "0.00",
        }
        final_invoice_breakdown = {
            "booking_value": "90.00",
            "company_fee": "0.00",
            "booking_fees": "5.00",
            "out_of_pocket": "15.00",
            "driver_value": "70.00",
            "travel_charge": "70.00",
            "time_surcharge": "0.00",
            "requests": "0.00",
            "variations_charge": "0.00",
            "waiting_charge": "0.00",
        }
        booking = BookingFactory.create(
            booking_status=BookingStatus.COMPLETED,
            price_total=Decimal("75.00"),
            price_breakdown=initial_price_breakdown,
            invoice_breakdown=initial_invoice_breakdown,
        )
        self.assertEqual(booking.invoices.count(), 1)
        invoice = booking.invoices.first()
        self.assert_invoice_component(invoice, "booking_price_total", Decimal("75.00"))
        self.assert_invoice_component(invoice, "invoice_total_amount", Decimal("75.00"))
        self.assert_invoice_component(invoice, "out_of_pocket_amount", Decimal("0.00"))
        booking.price_total = Decimal("90.00")
        booking.price_breakdown = final_price_breakdown
        booking.invoice_breakdown = final_invoice_breakdown
        booking.save()
        self.assertEqual(booking.invoices.count(), 2)
        invoice = booking.invoices.order_by("-created_at").first()
        self.assert_invoice_component(invoice, "booking_price_total", Decimal("90.00"))
        self.assert_invoice_component(invoice, "invoice_total_amount", Decimal("15.00"))
        self.assert_invoice_component(invoice, "out_of_pocket_amount", Decimal("15.00"))
        self.assertEqual(invoice.out_of_pocket_amount, Decimal("15.00"))
        booking.price_total = Decimal("75.00")
        booking.price_breakdown = initial_price_breakdown
        booking.invoice_breakdown = initial_invoice_breakdown
        booking.save()
        invoice = booking.invoices.order_by("-created_at").first()
        self.assert_invoice_component(invoice, "booking_price_total", Decimal("75.00"))
        self.assert_invoice_component(
            invoice, "invoice_total_amount", Decimal("-15.00")
        )
        self.assert_invoice_component(
            invoice, "out_of_pocket_amount", Decimal("-15.00")
        )

    def test_create_driver_collect(self, *_):
        """
        Test invoice creation for driver collect methods. Should create invoice and mark it paid
        right away.
        """
        invoice_breakdown = {
            "booking_value": "75.00",
            "company_fee": "0.00",
            "booking_fees": "5.00",
            "out_of_pocket": "0.00",
            "driver_value": "70.00",
            "travel_charge": "70.00",
            "time_surcharge": "0.00",
            "requests": "0.00",
            "variations_charge": "0.00",
            "waiting_charge": "0.00",
        }
        for method in [
            BookingDriverCollectMethod.CABCHARGE,
            BookingDriverCollectMethod.CAB_CASH,
            BookingDriverCollectMethod.CAB_CARD,
        ]:
            with self.subTest(
                f"Driver collect method {BookingDriverCollectMethod.choices[method]}"
            ):
                booking = BookingFactory(
                    booking_status=BookingStatus.UNVERIFIED,
                    price_total=Decimal("75.00"),
                    booking_payment_method=BookingPaymentMethod.DRIVER_COLLECT,
                    driver_collect_method=method,
                    invoice_breakdown=invoice_breakdown,
                    account__payment_method=BookingPaymentMethod.DRIVER_COLLECT,
                )

                self.assertEqual(booking.invoices.count(), 0)
                booking.booking_status = BookingStatus.COMPLETED
                booking.save()
                self.assertEqual(booking.invoices.count(), 1)
                invoice = booking.invoices.first()
                self.assert_invoice_component(
                    invoice, "booking_price_total", booking.price_total
                )
                self.assert_invoice_component(
                    invoice, "invoice_total_amount", booking.price_total
                )
                self.assertEqual(
                    invoice.payment_method, AccountPaymentMethodType.DRIVER_COLLECT
                )
                self.assertEqual(invoice.invoice_status, InvoiceStatus.PAID)
                self.assertIsNotNone(invoice.date_paid)
                self.assertIsNone(invoice.payment)
