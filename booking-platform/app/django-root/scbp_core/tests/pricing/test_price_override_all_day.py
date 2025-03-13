from datetime import datetime

from scbp_core.services.places import MELBOURNE_GPO_PLACE_ID
from scbp_core.tests.distance_mock_decorators import test_case_mock_distance_to_gpo
from scbp_core.tests.factory.account import AccountFactory
from scbp_core.tests.factory.booking import AddressFactory
from scbp_core.tests.factory.booking import OneWayBookingFactory
from scbp_core.tests.factory.pricing import PriceOverrideFactory
from scbp_core.tests.pricing.pricing_test_case import PricingTestCase


@test_case_mock_distance_to_gpo
class PriceOverrideTestCase(PricingTestCase):
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
        Luxury Sedan
        """
        self.override_booking = OneWayBookingFactory(
            account=self.booking_account,
            vehicle_class=self.vehicle_classes["Any Class"],
            from_address=self.from_address,
            destination_address=self.to_address,
            travel_on=datetime(year=2019, month=7, day=17, hour=11),
        )
        self.mock_distance(self.override_booking, "19.0")
        self.price_breakdown_without_override = {
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
            "base": {"distance": "19.0", "special": "60.00", "subtotal": "60.00"},
            "fees": {"government": "1.10", "subtotal": "1.10"},
        }

    def test_all_day_override(self):
        """
        Test finding all day override w/o booking account
        Expect $61.10
        """
        price_override = PriceOverrideFactory.create(
            from_postcode="3131", to_postcode="3000", is_all_day=True
        )
        self.assert_price_calculator_method_result(
            self.override_booking,
            expected=price_override,
            method_name="_booking_price_override",
        )
        self.assert_price_breakdown_equals(
            self.override_booking,
            {
                "total": "61.10",
                "base": {
                    "distance": "19.0",
                    "special": "60.00",
                    "car_class": "0.00",
                    "subtotal": "60.00",
                },
                "fees": {"government": "1.10", "subtotal": "1.10"},
            },
        )

    def test_all_day_override_with_account(self):
        """
        Test finding all day override with booking account
        Expect $61.10
        """
        price_override = PriceOverrideFactory.create(
            account=self.booking_account,
            from_postcode="3131",
            to_postcode="3000",
            is_all_day=True,
        )
        self.assert_price_calculator_method_result(
            self.override_booking,
            expected=price_override,
            method_name="_booking_price_override",
        )
        self.assert_price_breakdown_equals(
            self.override_booking,
            {
                "total": "61.10",
                "base": {
                    "distance": "19.0",
                    "special": "60.00",
                    "car_class": "0.00",
                    "subtotal": "60.00",
                },
                "fees": {"government": "1.10", "subtotal": "1.10"},
            },
        )

    def test_all_day_override_other_account(self):
        """
        Test all day override with wrong account
        Expect $59.10
        """
        PriceOverrideFactory.create(
            account=self.other_account,
            from_postcode="3131",
            to_postcode="3000",
            is_all_day=True,
        )
        self.assert_price_calculator_method_result(
            self.override_booking, expected=None, method_name="_booking_price_override"
        )
        self.assert_price_breakdown_equals(
            self.override_booking, self.price_breakdown_without_override
        )
