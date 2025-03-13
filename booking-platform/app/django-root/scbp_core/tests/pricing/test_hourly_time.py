import datetime
from datetime import timedelta

from scbp_core.tests.distance_mock_decorators import test_case_mock_distance_to_gpo
from scbp_core.tests.factory.booking import AddressFactory
from scbp_core.tests.factory.booking import HourlyBookingFactory
from scbp_core.tests.pricing.pricing_test_case import PricingTestCase


@test_case_mock_distance_to_gpo
class TimeHourlyPricingTestCase(PricingTestCase):
    def test_simplest_case(self):
        """
        Simplest scenario I could come up with
        - Exactly one hour
        - Any class car (no car class fee)
        - No options
        - No driving anywhere near the airport
        - Standard time
        Expect $89.10 (base fee of $88 + gov't booking fee of $1.10)
        """
        booking = HourlyBookingFactory.build(
            vehicle_class=self.vehicle_classes["Any Class"]
        )
        self.assert_price_equals(booking, "89.10")

    def test_peak_simple(self):
        """
        Variant of the simplest scenario, only this time during peak hours
        (using 4:30PM on Tuesday 2 July 2019)
        Expect $89.10
        """
        booking = HourlyBookingFactory.build(
            vehicle_class=self.vehicle_classes["Any Class"],
            travel_on=datetime.datetime(year=2019, month=7, day=2, hour=16, minute=30),
        )
        self.assert_price_equals(booking, "89.10")

    def test_quarter_hour(self):
        """
        Variant of the simplest scenario with a length of 1.25 hours
        Expect $113.10
        """
        booking = HourlyBookingFactory.build(
            vehicle_class=self.vehicle_classes["Any Class"],
            hourly_booking_duration=timedelta(hours=1, minutes=15),
        )
        self.assert_price_equals(booking, "113.10")

    def test_long_duration(self):
        """
        Variant of the simplest scenario with a length of 7.5 hours
        Expect $539.10
        """
        booking = HourlyBookingFactory.build(
            vehicle_class=self.vehicle_classes["Any Class"],
            hourly_booking_duration=timedelta(hours=7, minutes=30),
        )
        self.assert_price_equals(booking, "539.10")

    def test_out_of_hours(self):
        """
        Variant of the simplest scenario with out of hours pickup
        Expect $89.10
        """
        booking = HourlyBookingFactory(
            vehicle_class=self.vehicle_classes["Any Class"],
            travel_on=datetime.datetime(year=2019, month=7, day=3, hour=1, minute=30),
            from_address=AddressFactory(),
        )
        self.assert_price_breakdown_equals(
            booking,
            {
                "total": "89.10",
                "base": {
                    "time": "1:00",
                    "car_class": "0.00",
                    "first_hour": "88.00",
                    "subtotal": "88.00",
                },
                "fees": {"government": "1.10", "subtotal": "1.10"},
            },
        )
