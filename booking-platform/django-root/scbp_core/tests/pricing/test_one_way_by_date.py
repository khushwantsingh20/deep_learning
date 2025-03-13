import datetime
from datetime import date

from django.utils.timezone import make_aware

from scbp_core.tests.distance_mock_decorators import test_case_mock_distance_to_gpo
from scbp_core.tests.factory.booking import AddressFactory
from scbp_core.tests.factory.booking import OneWayBookingFactory
from scbp_core.tests.factory.pricing import HolidayFactory
from scbp_core.tests.pricing.pricing_test_case import PricingTestCase


@test_case_mock_distance_to_gpo
class OneWayDateTestCase(PricingTestCase):
    def setUp(self):
        super().setUp()
        HolidayFactory(date=date(year=2019, month=12, day=25))
        self.booking = OneWayBookingFactory(
            vehicle_class=self.vehicle_classes["Any Class"],
            from_address=AddressFactory(),
            destination_address=AddressFactory(),
        )

    def test_holiday_booking(self):
        self.booking.travel_on = make_aware(
            datetime.datetime(year=2019, month=12, day=25, hour=1, minute=30)
        )
        self.mock_distance(self.booking, "10.0")
        self.assert_price_breakdown_equals(
            self.booking,
            {
                "total": "86.10",
                "base": {
                    "car_class": "33.00",
                    "tier1": "15.00",
                    "tier2": "10.00",
                    "out_of_hours": "16.00",
                    "holiday_fee": "11.00",
                    "distance": "10.0",
                    "subtotal": "85.00",
                },
                "fees": {"government": "1.10", "subtotal": "1.10"},
            },
        )
        self.assert_price_equals(self.booking, "86.10")
