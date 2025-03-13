from datetime import timedelta

from scbp_core.models.booking import BookingAddressType
from scbp_core.tests.distance_mock_decorators import test_case_mock_distance_to_gpo
from scbp_core.tests.factory.booking import HourlyBookingFactory
from scbp_core.tests.pricing.pricing_test_case import PricingTestCase


@test_case_mock_distance_to_gpo
class ComplexHourlyPricingTestCase(PricingTestCase):
    """
    This test covers complex scenarios that incorporate multiple pricing factors.
    """

    def test_ribbon_from_airport(self):
        """
        - Any class
        - Ribbon
        - From airport
        Expect $142.60
        """
        booking = HourlyBookingFactory.build(
            vehicle_class=self.vehicle_classes["Any Class"],
            requires_wedding_ribbons=True,
            from_address_type=BookingAddressType.AIRPORT,
        )
        self.assert_price_equals(booking, "142.60")

    def test_long_family_trip(self):
        """
        - LPM
        - 1 rear-facing child seat
        - 1 booster seat
        - 4 passengers
        - 8 hours
        Expect $733.10
        """
        booking = HourlyBookingFactory.build(
            vehicle_class=self.vehicle_classes["LPM"],
            rear_facing_baby_seat_count=1,
            booster_seat_count=1,
            passenger_count=4,
            hourly_booking_duration=timedelta(hours=8),
        )
        self.assert_price_equals(booking, "733.10")
