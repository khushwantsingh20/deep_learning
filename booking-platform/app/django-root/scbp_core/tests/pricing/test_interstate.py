from decimal import Decimal

from scbp_core.models import PriceVariationType
from scbp_core.tests.distance_mock_decorators import test_case_mock_distance_to_gpo
from scbp_core.tests.factory.account import AccountFactory
from scbp_core.tests.factory.booking import AddressFactory
from scbp_core.tests.factory.booking import HourlyBookingFactory
from scbp_core.tests.factory.booking import OneWayBookingFactory
from scbp_core.tests.factory.pricing import BookingPriceVariationFactory
from scbp_core.tests.factory.user import ClientUserFactory
from scbp_core.tests.pricing.pricing_test_case import PricingTestCase


@test_case_mock_distance_to_gpo
class InterstatePricingTestCase(PricingTestCase):
    def test_hourly_interstate(self):
        booking = HourlyBookingFactory(
            vehicle_class=self.vehicle_classes["Any Class"],
            from_address=AddressFactory(postal_code="2000"),
        )
        self.assertTrue(booking.is_interstate())
        self.assert_price_equals(booking, "11.00")
        self.assert_price_breakdown_equals(
            booking,
            {"total": "11.00", "fees": {"interstate": "11.00", "subtotal": "11.00"}},
        )

        self.assert_invoice_breakdown_equals(
            booking,
            {
                "booking_value": "11.00",
                "booking_fees": "11.00",
                "company_fee": "0.00",
                "out_of_pocket": "0.00",
                "driver_value": "0.00",
                "travel_charge": "0.00",
                "time_surcharge": "0.00",
                "requests": "0.00",
                "variations_charge": "0.00",
                "waiting_charge": "0.00",
            },
        )

    def test_one_way_interstate(self):
        booking = OneWayBookingFactory(
            vehicle_class=self.vehicle_classes["Any Class"],
            from_address=AddressFactory(postal_code="2000"),
            destination_address=AddressFactory(postal_code="2001"),
        )
        self.assertTrue(booking.is_interstate())
        self.assert_price_equals(booking, "11.00")
        self.assert_price_breakdown_equals(
            booking,
            {"total": "11.00", "fees": {"interstate": "11.00", "subtotal": "11.00"}},
        )

        self.assert_invoice_breakdown_equals(
            booking,
            {
                "booking_value": "11.00",
                "booking_fees": "11.00",
                "company_fee": "0.00",
                "out_of_pocket": "0.00",
                "driver_value": "0.00",
                "travel_charge": "0.00",
                "time_surcharge": "0.00",
                "requests": "0.00",
                "variations_charge": "0.00",
                "waiting_charge": "0.00",
            },
        )

    def test_interstate_variation(self):
        destination_address = AddressFactory(postal_code="2001")
        destination_address.save()
        from_address = AddressFactory(postal_code="2000")
        from_address.save()
        client = ClientUserFactory()
        account = AccountFactory()
        booking = OneWayBookingFactory(
            from_address=from_address,
            destination_address=destination_address,
            created_by=client,
            vehicle_class=self.vehicle_classes["Any Class"],
            client_user=client,
            passenger=client,
            account=account,
            price_list=self.price_list,
        )
        booking.save()
        transfer_rate = BookingPriceVariationFactory(
            variation_type=PriceVariationType.INTERSTATE_TRANSFER_RATE,
            amount=Decimal("55.20"),
            booking=booking,
        )
        waiting = BookingPriceVariationFactory(
            variation_type=PriceVariationType.WAITING,
            amount=Decimal("10.30"),
            booking=booking,
        )
        fee = Decimal("11")
        total = transfer_rate.amount + waiting.amount + fee
        self.assertTrue(booking.is_interstate())
        self.assert_price_equals(booking, total)
        self.assert_price_breakdown_equals(
            booking,
            {
                "total": total,
                "fees": {"interstate": "11.00", "subtotal": "11.00"},
                "price_variations": {
                    "items": [
                        ("Interstate Transfer Rate", Decimal("55.20")),
                        ("Waiting", Decimal("10.30")),
                    ],
                    "subtotal": Decimal("65.50"),
                },
            },
        )

        self.assert_invoice_breakdown_equals(
            booking,
            {
                "booking_value": "76.50",
                "booking_fees": "11.00",
                "company_fee": "0.00",
                "out_of_pocket": "0.00",
                "driver_value": "65.50",
                "travel_charge": "65.50",
                "time_surcharge": "0.00",
                "requests": "0.00",
                "variations_charge": "0.00",
                "waiting_charge": "0.00",
            },
        )
