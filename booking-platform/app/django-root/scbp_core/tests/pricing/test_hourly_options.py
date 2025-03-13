from unittest.mock import Mock

from scbp_core.tests.distance_mock_decorators import test_case_mock_distance_to_gpo
from scbp_core.tests.factory.booking import AddressFactory
from scbp_core.tests.factory.booking import HourlyBookingFactory
from scbp_core.tests.pricing.pricing_test_case import PricingTestCase


@test_case_mock_distance_to_gpo
class OptionsHourlyPricingTestCase(PricingTestCase):
    def test_ribbon(self):
        """
        Tests whether the ribbon is correctly included in the cost
        Expect $133.10
        """
        booking = HourlyBookingFactory.build(
            vehicle_class=self.vehicle_classes["Any Class"],
            requires_wedding_ribbons=True,
        )
        self.assert_price_equals(booking, "133.10")

    def test_one_front_facing_seat(self):
        """
        Tests whether the first child seat is correctly included in the cost
        where the first seat is a front facing seat
        Expect $100.10
        """
        booking = HourlyBookingFactory.build(
            vehicle_class=self.vehicle_classes["Any Class"],
            forward_facing_baby_seat_count=1,
        )
        self.assert_price_equals(booking, "100.10")

    def test_one_rear_facing_seat(self):
        """
        Tests whether the first child seat is correctly included in the cost
        where the first seat is a rear facing seat
        Expect $100.10
        """
        booking = HourlyBookingFactory.build(
            vehicle_class=self.vehicle_classes["Any Class"],
            rear_facing_baby_seat_count=1,
        )
        self.assert_price_equals(booking, "100.10")

    def test_one_booster_seat(self):
        """
        Tests whether the first child seat is correctly included in the cost
        where the first seat is a booster seat
        Expect $100.10
        """
        booking = HourlyBookingFactory.build(
            vehicle_class=self.vehicle_classes["Any Class"],
            rear_facing_baby_seat_count=1,
        )
        self.assert_price_equals(booking, "100.10")

    def test_ribbon_rear_facing_seat(self):
        """
        Tests whether the combination of child seat and ribbon is correctly included in the cost
        Expect $144.10
        """
        booking = HourlyBookingFactory.build(
            vehicle_class=self.vehicle_classes["Any Class"],
            requires_wedding_ribbons=True,
            rear_facing_baby_seat_count=1,
        )
        self.assert_price_equals(booking, "144.10")

    def test_multiple_front_facing_seats(self):
        """
        Tests whether three seats are correctly included in the cost
        Note that this test reflects a situation that is impossible in reality - it is only used for testing
        Expect $122.10
        """
        booking = HourlyBookingFactory.build(
            vehicle_class=self.vehicle_classes["Any Class"],
            forward_facing_baby_seat_count=3,
        )
        self.assert_price_equals(booking, "122.10")

    def test_multiple_seat_types(self):
        """
        Tests whether a combination of different types of seats are correctly included in the cost
        Note that this test reflects a situation that is impossible in reality - it is only used for testing
        Expect $144.10
        """
        booking = HourlyBookingFactory.build(
            vehicle_class=self.vehicle_classes["Any Class"],
            forward_facing_baby_seat_count=2,
            rear_facing_baby_seat_count=1,
            booster_seat_count=2,
        )
        self.assert_price_equals(booking, "144.10")

    def test_free_car_seat(self):
        """
        Tests whether the free child seat is correctly accounted for
        Assume the prices of each seat type are identical
        Expect $133.10
        """
        booking = HourlyBookingFactory.build(
            vehicle_class=self.vehicle_classes["FPM"],
            forward_facing_baby_seat_count=1,
            rear_facing_baby_seat_count=1,
            booster_seat_count=1,
        )
        self.assert_price_equals(booking, "133.10")

    def test_with_pass(self):
        booking = HourlyBookingFactory(
            vehicle_class=self.vehicle_classes["Any Class"],
            from_address=AddressFactory(),
        )
        # Mock is_with_pass to return true to generate a car park pass fee
        booking.is_with_pass = Mock(name="is_with_pass")
        booking.is_with_pass.return_value = True
        self.assert_price_breakdown_equals(
            booking,
            {
                "total": "111.10",
                "base": {
                    "car_class": "0.00",
                    "first_hour": "88.00",
                    "time": "1:00",
                    "subtotal": "88.00",
                },
                "fees": {"government": "1.10", "subtotal": "1.10"},
                "options": {"car_park_pass": "22.00", "subtotal": "22.00"},
            },
        )
        self.assert_price_equals(booking, "111.10")
