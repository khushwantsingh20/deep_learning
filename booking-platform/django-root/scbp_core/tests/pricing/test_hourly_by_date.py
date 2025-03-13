import datetime
from datetime import date

from django.utils.timezone import make_aware

from scbp_core.tests.distance_mock_decorators import test_case_mock_distance_to_gpo
from scbp_core.tests.factory.booking import AddressFactory
from scbp_core.tests.factory.booking import HourlyBookingFactory
from scbp_core.tests.factory.pricing import HolidayFactory
from scbp_core.tests.pricing.pricing_test_case import PricingTestCase


@test_case_mock_distance_to_gpo
class HourlyDateTestCase(PricingTestCase):
    def setUp(self):
        super().setUp()
        HolidayFactory(date=date(year=2019, month=12, day=25))
        self.booking = HourlyBookingFactory(
            vehicle_class=self.vehicle_classes["Any Class"],
            from_address=AddressFactory(),
        )

    def test_holiday_booking(self):
        self.booking.travel_on = make_aware(
            datetime.datetime(year=2019, month=12, day=25, hour=13, minute=30)
        )
        self.assert_price_breakdown_equals(
            self.booking,
            {
                "total": "89.10",
                "base": {
                    "car_class": "0.00",
                    "first_hour": "88.00",
                    "time": "1:00",
                    "subtotal": "88.00",
                },
                "fees": {"government": "1.10", "subtotal": "1.10"},
            },
        )
        self.assert_price_equals(self.booking, "89.10")

    def test_holiday_out_of_hours_booking(self):
        """
        Test that the holiday out of hours pricing is correctly not applied to hourly bookings
        Expect $89.10
        """
        self.booking.travel_on = make_aware(
            datetime.datetime(year=2019, month=12, day=25, hour=2, minute=30)
        )
        self.assert_price_breakdown_equals(
            self.booking,
            {
                "total": "89.10",
                "base": {
                    "car_class": "0.00",
                    "first_hour": "88.00",
                    "time": "1:00",
                    "subtotal": "88.00",
                },
                "fees": {"government": "1.10", "subtotal": "1.10"},
            },
        )
        self.assert_price_equals(self.booking, "89.10")
