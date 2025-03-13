from datetime import timedelta

from scbp_core.tests.distance_mock_decorators import test_case_mock_distance_to_gpo
from scbp_core.tests.factory.booking import HourlyBookingFactory
from scbp_core.tests.pricing.pricing_test_case import PricingTestCase


@test_case_mock_distance_to_gpo
class VehicleClassHourlyPricingTestCase(PricingTestCase):
    def test_sedan_short(self):
        """
        Tests whether the rate for sedans is correctly calculated for short trips
        Expect $89.10
        """
        booking = HourlyBookingFactory.build(
            vehicle_class=self.vehicle_classes["Sedan"]
        )
        self.assert_price_equals(booking, "89.10")

    def test_sedan_long(self):
        """
        Tests whether the rate for sedans is correctly calculated for long trips
        Expect $449.10
        """
        booking = HourlyBookingFactory.build(
            vehicle_class=self.vehicle_classes["Any Class"],
            hourly_booking_duration=timedelta(hours=6),
        )
        self.assert_price_equals(booking, "449.10")

    def test_lpm_short(self):
        """
        Tests whether the rate for LPMs is correctly calculated for short trips
        This tests whether the fixed rate is correctly selected
        Expect $133.10
        """
        booking = HourlyBookingFactory.build(vehicle_class=self.vehicle_classes["LPM"])
        self.assert_price_equals(booking, "133.10")

    def test_lpm_long(self):
        """
        Tests whether the rate for sedans is correctly calculated for long trips
        This tests whether the percentage rate is correctly selected
        Expect $561.10
        """
        booking = HourlyBookingFactory.build(
            vehicle_class=self.vehicle_classes["LPM"],
            hourly_booking_duration=timedelta(hours=6),
        )
        self.assert_price_equals(booking, "561.10")
