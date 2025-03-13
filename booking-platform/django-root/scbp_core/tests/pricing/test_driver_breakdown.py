from decimal import Decimal
from unittest import skipIf

from django.conf import settings

from scbp_core.models.booking_field_choices import PriceVariationType
from scbp_core.tests.factory.booking import AddressFactory
from scbp_core.tests.factory.booking import OneWayBookingFactory
from scbp_core.tests.factory.pricing import BookingOutOfPocketFactory
from scbp_core.tests.factory.pricing import BookingPriceVariationFactory
from scbp_core.tests.pricing.pricing_test_case import PricingTestCase


class DriverBreakdownTest(PricingTestCase):
    def setUp(self):
        """
        Use the same basic booking between
        234 Whitehorse Rd, Nunawading VIC 3131 (place ID ChIJi7iHMsk41moR_7dXVxseiZ4) and
        Melbourne's GPO, 350 Bourke St, Melbourne VIC 3000 (place ID ChIJlVWPC7VC1moRwANVqtx_3eQ)
        Tests will adapt this booking as needed to generate the expected driver breakdowns
        """
        super().setUp()
        self.booking = OneWayBookingFactory.build(
            vehicle_class=self.vehicle_classes["Any Class"],
            from_address=AddressFactory(source_id="ChIJi7iHMsk41moR_7dXVxseiZ4"),
            destination_address=AddressFactory(source_id="ChIJlVWPC7VC1moRwANVqtx_3eQ"),
        )
        self.mock_distance(self.booking, "19.0")

    @skipIf(settings.SKIP_GOOGLE_API_TESTS, "Skipping Google Maps unit-tests")
    def test_basic_booking(self):
        self.assert_invoice_breakdown_equals(
            self.booking,
            {
                "booking_value": "77.10",
                "booking_fees": "1.10",
                "company_fee": "0.00",
                "out_of_pocket": "0.00",
                "driver_value": "76.00",
                "travel_charge": "76.00",
                "time_surcharge": "0.00",
                "requests": "0.00",
                "variations_charge": "0.00",
                "waiting_charge": "0.00",
            },
        )

    @skipIf(settings.SKIP_GOOGLE_API_TESTS, "Skipping Google Maps unit-tests")
    def test_option_booking(self):
        """
        Verify that options fall under requests in the driver breakdown
        """
        self.booking.requires_wedding_ribbons = True
        self.assert_invoice_breakdown_equals(
            self.booking,
            {
                "booking_value": "121.10",
                "booking_fees": "1.10",
                "company_fee": "0.00",
                "out_of_pocket": "0.00",
                "driver_value": "120.00",
                "travel_charge": "76.00",
                "time_surcharge": "0.00",
                "requests": "44.00",
                "variations_charge": "0.00",
                "waiting_charge": "0.00",
            },
        )

    @skipIf(settings.SKIP_GOOGLE_API_TESTS, "Skipping Google Maps unit-tests")
    def test_out_of_hours(self):
        """
        Verify that out of hours fee falls under time_surcharge
        """
        self.booking.travel_on = self.booking.travel_on.replace(hour=1)
        self.assert_invoice_breakdown_equals(
            self.booking,
            {
                "booking_value": "88.10",
                "booking_fees": "1.10",
                "company_fee": "0.00",
                "out_of_pocket": "0.00",
                "driver_value": "87.00",
                "travel_charge": "76.00",
                "time_surcharge": "11.00",
                "requests": "0.00",
                "variations_charge": "0.00",
                "waiting_charge": "0.00",
            },
        )

    @skipIf(settings.SKIP_GOOGLE_API_TESTS, "Skipping Google Maps unit-tests")
    def test_variations(self):
        """
        Verify that variations are properly sorted
        (waiting into waiting_charge, the rest into variations_charge)
        """
        self.assert_invoice_breakdown_equals(
            self.booking,
            {
                "booking_value": "107.10",
                "booking_fees": "1.10",
                "company_fee": "0.00",
                "out_of_pocket": "0.00",
                "driver_value": "106.00",
                "travel_charge": "76.00",
                "time_surcharge": "0.00",
                "requests": "0.00",
                "variations_charge": "20.00",
                "waiting_charge": "10.00",
            },
            price_variations=[
                BookingPriceVariationFactory.build(
                    variation_type=PriceVariationType.WAITING, amount=Decimal("10.00")
                ),
                BookingPriceVariationFactory.build(amount=Decimal("20.00")),
            ],
        )

    @skipIf(settings.SKIP_GOOGLE_API_TESTS, "Skipping Google Maps unit-tests")
    def test_company_booking_fee(self):
        """
        Verify that company booking fee is included in booking_fees
        """
        with self.update_price_list() as price_list:
            price_list.company_booking_fee = Decimal("20.00")
        self.assert_invoice_breakdown_equals(
            self.booking,
            {
                "booking_value": "97.10",
                "booking_fees": "1.10",
                "company_fee": "20.00",
                "out_of_pocket": "0.00",
                "driver_value": "76.00",
                "travel_charge": "76.00",
                "time_surcharge": "0.00",
                "requests": "0.00",
                "variations_charge": "0.00",
                "waiting_charge": "0.00",
            },
        )

    @skipIf(settings.SKIP_GOOGLE_API_TESTS, "Skipping Google Maps unit-tests")
    def test_out_of_pockets(self):
        """
        Verify out of pocket expenses are properly handled
        """
        self.assert_invoice_breakdown_equals(
            self.booking,
            {
                "booking_value": "107.10",
                "booking_fees": "1.10",
                "company_fee": "0.00",
                "out_of_pocket": "30.00",
                "driver_value": "76.00",
                "travel_charge": "76.00",
                "time_surcharge": "0.00",
                "requests": "0.00",
                "variations_charge": "0.00",
                "waiting_charge": "0.00",
            },
            out_of_pockets=[
                BookingOutOfPocketFactory.build(
                    description="Test 1", amount=Decimal("10.00")
                ),
                BookingOutOfPocketFactory.build(
                    description="Test 2", amount=Decimal("20.00")
                ),
            ],
        )
