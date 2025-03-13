from datetime import datetime
from decimal import Decimal

from scbp_core.services.places import MELBOURNE_GPO_PLACE_ID
from scbp_core.tests.distance_mock_decorators import test_case_mock_distance_to_gpo
from scbp_core.tests.factory.account import AccountFactory
from scbp_core.tests.factory.booking import AddressFactory
from scbp_core.tests.factory.booking import OneWayBookingFactory
from scbp_core.tests.factory.pricing import PriceAdjustmentFactory
from scbp_core.tests.factory.pricing import PriceOverrideFactory
from scbp_core.tests.pricing.pricing_test_case import PricingTestCase


@test_case_mock_distance_to_gpo
class PriceAdjustmentTestCase(PricingTestCase):
    def setUp(self):
        super().setUp()
        self.from_address = AddressFactory(
            formatted_address="234 Whitehorse Rd, Nunawading VIC 3131",
            source_id="ChIJi7iHMsk41moR_7dXVxseiZ4",
            postal_code="3131",
        )
        self.to_address = AddressFactory(
            formatted_address="Melbourne's GPO, 350 Bourke St, Melbourne VIC 3000",
            source_id=MELBOURNE_GPO_PLACE_ID,
            postal_code="3000",
        )
        self.booking_account = AccountFactory()
        self.other_account = AccountFactory()
        """
        Standard booking for one-way tests
        From 234 Whiteforce Rd, Nunawading VIC 3131
        To Melbourne GPO, 350 Bourke St, Melbourne VIC 3000
        At 11:00 AM on Wednesday, 17 July 2019 (Off-peak)
        Distance mocked to 19.0 km
        Any Class
        """
        self.booking = OneWayBookingFactory(
            account=self.booking_account,
            vehicle_class=self.vehicle_classes["Any Class"],
            from_address=self.from_address,
            destination_address=self.to_address,
            travel_on=datetime(year=2019, month=7, day=17, hour=11),
        )
        self.mock_distance(self.booking, "19.0")
        self.price_breakdown = {
            "total": "56.40",
            "base": {
                "distance": "19.0",
                "tier1": "11.00",
                "tier2": "25.20",
                "car_class": "22.00",
                "peak": "-2.91",
                "subtotal": "55.29",
            },
            "fees": {"government": "1.10", "subtotal": "1.10"},
            "rounding": {"rounding": "0.01", "subtotal": "0.01"},
        }
        self.price_breakdown_with_override = {
            "total": "61.10",
            "base": {
                "distance": "19.0",
                "car_class": "0.00",
                "special": "60.00",
                "subtotal": "60.00",
            },
            "fees": {"government": "1.10", "subtotal": "1.10"},
        }

    def test_without_adjustment(self):
        self.assert_price_breakdown_equals(
            self.booking,
            {
                "total": "56.40",
                "base": {
                    "distance": "19.0",
                    "tier1": "11.00",
                    "tier2": "25.20",
                    "car_class": "22.00",
                    "peak": "-2.91",
                    "subtotal": "55.29",
                },
                "fees": {"government": "1.10", "subtotal": "1.10"},
                "rounding": {"rounding": "0.01", "subtotal": "0.01"},
            },
        )

    def test_positive_adjustment(self):
        PriceAdjustmentFactory(from_postcode="3131", to_postcode="3000", percentage=5)
        self.assert_price_breakdown_equals(
            self.booking,
            {
                "total": "59.20",
                "base": {
                    "distance": "19.0",
                    "tier1": "11.00",
                    "tier2": "25.20",
                    "adjustment": "2.76",
                    "car_class": "22.00",
                    "peak": "-2.91",
                    "subtotal": "58.05",
                },
                "fees": {"government": "1.10", "subtotal": "1.10"},
                "rounding": {"rounding": "0.05", "subtotal": "0.05"},
            },
        )

    def test_negative_adjustment(self):
        PriceAdjustmentFactory(from_postcode="3131", to_postcode="3000", percentage=-5)
        self.assert_price_breakdown_equals(
            self.booking,
            {
                "total": "53.70",
                "base": {
                    "distance": "19.0",
                    "tier1": "11.00",
                    "tier2": "25.20",
                    "adjustment": "-2.76",
                    "car_class": "22.00",
                    "peak": "-2.91",
                    "subtotal": "52.53",
                },
                "fees": {"government": "1.10", "subtotal": "1.10"},
                "rounding": {"rounding": "0.07", "subtotal": "0.07"},
            },
        )

    def test_override_overrules_adjustment(self):
        PriceAdjustmentFactory(from_postcode="3131", to_postcode="3000", percentage=-5)
        PriceOverrideFactory(
            from_postcode="3131", to_postcode="3000", fixed_cost=Decimal(40)
        )
        self.assert_price_breakdown_equals(
            self.booking,
            {
                "total": "41.10",
                "base": {
                    "distance": "19.0",
                    "car_class": "0.00",
                    "special": "40.00",
                    "subtotal": "40.00",
                },
                "fees": {"government": "1.10", "subtotal": "1.10"},
            },
        )

    def test_car_class_atop_adjustment(self):
        self.booking.vehicle_class = self.vehicle_classes["FPM"]
        PriceAdjustmentFactory(from_postcode="3131", to_postcode="3000", percentage=5)
        self.assert_price_breakdown_equals(
            self.booking,
            {
                "total": "83.00",
                "base": {
                    "distance": "19.0",
                    "tier1": "11.50",
                    "tier2": "26.60",
                    "adjustment": "3.90",
                    "car_class": "44.00",
                    "peak": "-4.10",
                    "subtotal": "81.90",
                },
                "fees": {"government": "1.10", "subtotal": "1.10"},
            },
        )

    def test_extras_atop_adjustment(self):
        self.booking.requires_wedding_ribbons = True
        PriceAdjustmentFactory(from_postcode="3131", to_postcode="3000", percentage=5)
        self.assert_price_breakdown_equals(
            self.booking,
            {
                "total": "103.20",
                "base": {
                    "distance": "19.0",
                    "tier1": "11.00",
                    "tier2": "25.20",
                    "adjustment": "2.76",
                    "car_class": "22.00",
                    "peak": "-2.91",
                    "subtotal": "58.05",
                },
                "options": {"ribbon": "44.00", "subtotal": "44.00"},
                "fees": {"government": "1.10", "subtotal": "1.10"},
                "rounding": {"rounding": "0.05", "subtotal": "0.05"},
            },
        )
