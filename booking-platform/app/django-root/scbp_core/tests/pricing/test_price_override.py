from datetime import datetime
from datetime import time
from datetime import timedelta
from decimal import Decimal

from scbp_core.services.places import MELBOURNE_GPO_PLACE_ID
from scbp_core.tests.distance_mock_decorators import test_case_mock_distance_to_gpo
from scbp_core.tests.factory.account import AccountFactory
from scbp_core.tests.factory.booking import AddressFactory
from scbp_core.tests.factory.booking import HourlyBookingFactory
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
        Any Class
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
            "base": {
                "distance": "19.0",
                "car_class": "0.00",
                "special": "60.00",
                "subtotal": "60.00",
            },
            "fees": {"government": "1.10", "subtotal": "1.10"},
        }

    def test_override_not_applicable_to_hourly(self):
        """
        Scenario gleaned from the sample cost calculation spreadsheet
        - 2 hours
        - Starts in Nunawading
        - Ends at GPO
        - No airport
        - Standard time
        - Family People Mover class
        - 1 booster seat
        Expect $183.10

        Verify that overrides are not applied to hourly bookings
        """
        booking = HourlyBookingFactory(
            vehicle_class=self.vehicle_classes["FPM"],
            from_address=self.from_address,
            hourly_booking_duration=timedelta(hours=2),
            booster_seat_count=1,
            child_under8_count=1,
        )
        PriceOverrideFactory.create(from_postcode="3131", to_postcode="3131")
        self.assert_price_breakdown_equals(
            booking,
            {
                "total": "183.10",
                "base": {
                    "time": "2:00",
                    "first_hour": "88.00",
                    "tier1": "72.00",
                    "car_class": "22.00",
                    "subtotal": "182.00",
                },
                "options": {"child_seats": "0.00", "subtotal": "0.00"},
                "fees": {"government": "1.10", "subtotal": "1.10"},
            },
        )

    def test_without_override(self):
        """
        No overrides in the system
        Expect $84.10
        """
        self.assert_price_breakdown_equals(
            self.override_booking, self.price_breakdown_without_override
        )

    def test_with_matching_override(self):
        """
        One matching override in the system
        Expect $61.10
        """
        PriceOverrideFactory.create(
            from_postcode="3131", to_postcode="3000", account=self.booking_account
        )
        self.assert_price_breakdown_equals(
            self.override_booking, self.price_breakdown_with_override
        )

    def test_with_matching_any_account_override(self):
        """
        One matching override in the system (no specific account)
        Expect $61.10
        """
        PriceOverrideFactory.create(from_postcode="3131", to_postcode="3000")
        self.assert_price_breakdown_equals(
            self.override_booking, self.price_breakdown_with_override
        )

    def test_wrong_from_postcode(self):
        """
        One override with a different from postcode
        Expect $84.10
        """
        PriceOverrideFactory.create(from_postcode="3130", to_postcode="3000")
        self.assert_price_breakdown_equals(
            self.override_booking, self.price_breakdown_without_override
        )

    def test_wrong_to_postcode(self):
        """
        One override with a different to postcode
        Expect $84.10
        """
        PriceOverrideFactory.create(from_postcode="3131", to_postcode="3001")
        self.assert_price_breakdown_equals(
            self.override_booking, self.price_breakdown_without_override
        )

    def test_wrong_account(self):
        """
        One override with a designated account
        Expect $84.10
        """
        PriceOverrideFactory.create(
            from_postcode="3131", to_postcode="3000", account=self.other_account
        )
        self.assert_price_breakdown_equals(
            self.override_booking, self.price_breakdown_without_override
        )

    def test_too_early(self):
        """
        One override starting after the pickup time
        Expect $84.10
        """
        PriceOverrideFactory.create(
            from_postcode="3131", to_postcode="3000", start_time=time(hour=12)
        )
        self.assert_price_breakdown_equals(
            self.override_booking, self.price_breakdown_without_override
        )

    def test_too_late(self):
        """
        One override ending before the pickup time
        Expect $84.10
        """
        PriceOverrideFactory.create(
            from_postcode="3131",
            to_postcode="3000",
            start_time=time(hour=4),
            end_time=time(hour=10),
        )
        self.assert_price_breakdown_equals(
            self.override_booking, self.price_breakdown_without_override
        )

    def test_without_account(self):
        """
        Test finding general override without booking account
        Expect $61.10
        """
        PriceOverrideFactory.create(from_postcode="3131", to_postcode="3000")
        self.override_booking.account = None
        self.assert_price_breakdown_equals(
            self.override_booking, self.price_breakdown_with_override
        )

    def test_specific_override_under(self):
        """
        Test finding both general and specific override
        Specific override should control
        Expect 51.10
        """
        PriceOverrideFactory.create(from_postcode="3131", to_postcode="3000")
        PriceOverrideFactory.create(
            account=self.booking_account,
            from_postcode="3131",
            to_postcode="3000",
            fixed_cost=Decimal(50),
        )
        self.assert_price_breakdown_equals(
            self.override_booking,
            {
                "total": "51.10",
                "base": {
                    "distance": "19.0",
                    "car_class": "0.00",
                    "special": "50.00",
                    "subtotal": "50.00",
                },
                "fees": {"government": "1.10", "subtotal": "1.10"},
            },
        )

    def test_specific_override_over(self):
        """
        Test finding both general and specific override
        Specific override should control
        Expect 71.10
        """
        PriceOverrideFactory.create(from_postcode="3131", to_postcode="3000")
        PriceOverrideFactory.create(
            account=self.booking_account,
            from_postcode="3131",
            to_postcode="3000",
            fixed_cost=Decimal(70),
        )
        self.assert_price_breakdown_equals(
            self.override_booking,
            {
                "total": "71.10",
                "base": {
                    "distance": "19.0",
                    "car_class": "0.00",
                    "special": "70.00",
                    "subtotal": "70.00",
                },
                "fees": {"government": "1.10", "subtotal": "1.10"},
            },
        )
