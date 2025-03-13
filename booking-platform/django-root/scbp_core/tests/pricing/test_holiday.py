from datetime import date
from decimal import Decimal

from scbp_core.models import RateScheduleType
from scbp_core.tests.distance_mock_decorators import test_case_mock_distance_to_gpo
from scbp_core.tests.factory.account import AccountFactory
from scbp_core.tests.factory.booking import AddressFactory
from scbp_core.tests.factory.booking import OneWayBookingFactory
from scbp_core.tests.factory.pricing import HolidayFactory
from scbp_core.tests.factory.user import ClientUserFactory
from scbp_core.tests.pricing.pricing_test_case import PricingTestCase


@test_case_mock_distance_to_gpo
class HolidayPricingTestCase(PricingTestCase):
    def setUp(self):
        """
        For all tests within this case, we're going between
        234 Whitehorse Rd, Nunawading VIC 3131 (place ID ChIJi7iHMsk41moR_7dXVxseiZ4) and
        Melbourne's GPO, 350 Bourke St, Melbourne VIC 3000 (place ID ChIJlVWPC7VC1moRwANVqtx_3eQ)
        Distance 19.0km
        in Any Class vehicle
        """
        super().setUp()
        creator = ClientUserFactory()
        self.booking_account = AccountFactory()
        self.booking = OneWayBookingFactory(
            vehicle_class=self.vehicle_classes["Any Class"],
            from_address=AddressFactory(source_id="ChIJi7iHMsk41moR_7dXVxseiZ4"),
            destination_address=AddressFactory(source_id="ChIJlVWPC7VC1moRwANVqtx_3eQ"),
            created_by=creator,
            client_user=creator,
            account=self.booking_account,
        )
        self.mock_distance(self.booking, "19.0")
        HolidayFactory.create(
            title="Test Holiday", date=date(year=2019, month=7, day=2)
        )

    def test_normal_hours(self):
        """
        Test travel at 12:30PM (Normal hours)
        Expect $89.60
        """
        with self.update_price_list() as price_list:
            price_list.public_holiday_fee = Decimal("12.50")
            price_list.out_of_hours_fee = Decimal("0.00")
            price_list.public_holiday_out_of_hours_fee = Decimal("0.00")
        self.booking.travel_on = self.set_hour(12)
        self.assert_price_breakdown_equals(
            self.booking,
            {
                "total": "89.60",
                "base": {
                    "distance": "19.0",
                    "car_class": "33.00",
                    "tier1": "15.00",
                    "tier2": "28.00",
                    "holiday_fee": "12.50",
                    "subtotal": "88.50",
                },
                "fees": {"government": "1.10", "subtotal": "1.10"},
            },
        )

    def test_out_of_hours(self):
        """
        Test travel at 2:30AM (Out of hours)
        Expect $93.10
        """
        with self.update_price_list() as price_list:
            price_list.public_holiday_out_of_hours_fee = Decimal("16.00")
            price_list.public_holiday_fee = Decimal("0.00")
            price_list.out_of_hours_fee = Decimal("0.00")
        self.booking.travel_on = self.set_hour(2)
        self.assert_price_breakdown_equals(
            self.booking,
            {
                "total": "93.10",
                "base": {
                    "distance": "19.0",
                    "car_class": "33.00",
                    "tier1": "15.00",
                    "tier2": "28.00",
                    "out_of_hours": "16.00",
                    "subtotal": "92.00",
                },
                "fees": {"government": "1.10", "subtotal": "1.10"},
            },
        )

    def test_adjustment_not_applicable_to_holiday_fee(self):
        """
        Test travel at 12:30PM (Normal hours) with rate schedule adjustment
        Expect $97.20
        """
        self.booking_account.rate_schedule = RateScheduleType.RETAIL
        self.booking_account.save()
        with self.update_price_list() as price_list:
            price_list.public_holiday_fee = Decimal("12.50")
            price_list.out_of_hours_fee = Decimal("0.00")
            price_list.public_holiday_out_of_hours_fee = Decimal("0.00")
        self.booking.travel_on = self.set_hour(12)
        self.assert_price_breakdown_equals(
            self.booking,
            {
                "total": "97.20",
                "base": {
                    "distance": "19.0",
                    "car_class": "36.30",
                    "tier1": "16.50",
                    "tier2": "30.80",
                    "holiday_fee": "12.50",
                    "subtotal": "96.10",
                },
                "fees": {"government": "1.10", "subtotal": "1.10"},
            },
        )

    def test_adjustment_not_applicable_to_holiday_out_of_hours_fee(self):
        """
        Test travel at 2:30AM (Out of hours) with rate schedule adjustment
        Expect $100.70
        """
        self.booking_account.rate_schedule = RateScheduleType.RETAIL
        self.booking_account.save()
        with self.update_price_list() as price_list:
            price_list.public_holiday_out_of_hours_fee = Decimal("16.00")
            price_list.public_holiday_fee = Decimal("0.00")
            price_list.out_of_hours_fee = Decimal("0.00")
        self.booking.travel_on = self.set_hour(2)
        self.assert_price_breakdown_equals(
            self.booking,
            {
                "total": "100.70",
                "base": {
                    "distance": "19.0",
                    "car_class": "36.30",
                    "tier1": "16.50",
                    "tier2": "30.80",
                    "out_of_hours": "16.00",
                    "subtotal": "99.60",
                },
                "fees": {"government": "1.10", "subtotal": "1.10"},
            },
        )
