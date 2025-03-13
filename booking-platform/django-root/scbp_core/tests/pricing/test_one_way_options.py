from unittest.mock import Mock

from scbp_core.tests.distance_mock_decorators import test_case_mock_distance_to_gpo
from scbp_core.tests.factory.booking import AddressFactory
from scbp_core.tests.factory.booking import OneWayBookingFactory
from scbp_core.tests.pricing.pricing_test_case import PricingTestCase


@test_case_mock_distance_to_gpo
class OneWayOptionPricingTestCase(PricingTestCase):
    def setUp(self):
        """
        For all tests within this case, we're going between
        234 Whitehorse Rd, Nunawading VIC 3131 (place ID ChIJi7iHMsk41moR_7dXVxseiZ4) and
        Melbourne's GPO, 350 Bourke St, Melbourne VIC 3000 (place ID ChIJlVWPC7VC1moRwANVqtx_3eQ)
        Distance 19.0km
        """
        super().setUp()
        self.booking = OneWayBookingFactory(
            vehicle_class=self.vehicle_classes["Any Class"],
            from_address=AddressFactory(source_id="ChIJi7iHMsk41moR_7dXVxseiZ4"),
            destination_address=AddressFactory(source_id="ChIJlVWPC7VC1moRwANVqtx_3eQ"),
        )
        self.mock_distance(self.booking, "19.0")

    def test_ribbon(self):
        """
        Tests whether the ribbon is correctly included in the cost
        Expect $121.10
        """
        self.booking.requires_wedding_ribbons = True
        self.assert_price_equals(self.booking, "121.10")

    def test_one_front_facing_seat(self):
        """
        Tests whether the first child seat is correctly included in the cost
        where the first seat is a front facing seat
        Expect $88.10
        """
        self.booking.forward_facing_baby_seat_count = 1
        self.assert_price_equals(self.booking, "88.10")

    def test_one_rear_facing_seat(self):
        """
        Tests whether the first child seat is correctly included in the cost
        where the first seat is a rear facing seat
        Expect $88.10
        """
        self.booking.rear_facing_baby_seat_count = 1
        self.assert_price_equals(self.booking, "88.10")

    def test_one_booster_seat(self):
        """
        Tests whether the first child seat is correctly included in the cost
        where the first seat is a booster seat
        Expect $88.10
        """
        self.booking.rear_facing_baby_seat_count = 1
        self.assert_price_equals(self.booking, "88.10")

    def test_ribbon_rear_facing_seat(self):
        """
        Tests whether the combination of child seat and ribbon is correctly included in the cost
        Expect $132.10
        """
        self.booking.requires_wedding_ribbons = True
        self.booking.rear_facing_baby_seat_count = 1
        self.assert_price_equals(self.booking, "132.10")

    def test_multiple_front_facing_seats(self):
        """
        Tests whether three seats are correctly included in the cost
        Note that this test reflects a situation that is impossible in reality - it is only used for testing
        Expect $110.10
        """
        self.booking.forward_facing_baby_seat_count = 3
        self.assert_price_equals(self.booking, "110.10")

    def test_multiple_seat_types(self):
        """
        Tests whether a combination of different types of seats are correctly included in the cost
        Note that this test reflects a situation that is impossible in reality - it is only used for testing
        Expect $132.10
        """
        self.booking.forward_facing_baby_seat_count = 2
        self.booking.rear_facing_baby_seat_count = 1
        self.booking.booster_seat_count = 2
        self.assert_price_equals(self.booking, "132.10")

    def test_free_car_seat(self):
        """
        Tests whether the free child seat is correctly accounted for
        Assume the prices of each seat type are identical
        Expect $121.10
        """
        self.booking.vehicle_class = self.vehicle_classes["FPM"]
        self.booking.forward_facing_baby_seat_count = 1
        self.booking.rear_facing_baby_seat_count = 1
        self.booking.booster_seat_count = 1
        self.assert_price_equals(self.booking, "121.10")

    def test_with_color(self):
        self.booking.vehicle_color = self.booking.vehicle_class.available_colors.first()
        self.assert_price_breakdown_equals(
            self.booking,
            {
                "total": "99.10",
                "base": {
                    "distance": "19.0",
                    "car_class": "33.00",
                    "tier1": "15.00",
                    "tier2": "28.00",
                    "subtotal": "76.00",
                },
                "fees": {"government": "1.10", "subtotal": "1.10"},
                "options": {"color": "22.00", "subtotal": "22.00"},
            },
        )

    def test_with_pass(self):
        # Mock is_with_pass to return true to generate a car park pass fee
        self.booking.is_with_pass = Mock(name="is_with_pass")
        self.booking.is_with_pass.return_value = True
        self.assert_price_breakdown_equals(
            self.booking,
            {
                "total": "99.10",
                "base": {
                    "distance": "19.0",
                    "car_class": "33.00",
                    "tier1": "15.00",
                    "tier2": "28.00",
                    "subtotal": "76.00",
                },
                "fees": {"government": "1.10", "subtotal": "1.10"},
                "options": {"car_park_pass": "22.00", "subtotal": "22.00"},
            },
        )
        self.assert_price_equals(self.booking, "99.10")

    def test_with_color_and_pass(self):
        self.booking.vehicle_color = self.booking.vehicle_class.available_colors.first()
        # Mock is_with_pass to return true to generate a car park pass fee
        self.booking.is_with_pass = Mock(name="is_with_pass")
        self.booking.is_with_pass.return_value = True
        self.assert_price_breakdown_equals(
            self.booking,
            {
                "total": "121.10",
                "base": {
                    "distance": "19.0",
                    "car_class": "33.00",
                    "tier1": "15.00",
                    "tier2": "28.00",
                    "subtotal": "76.00",
                },
                "fees": {"government": "1.10", "subtotal": "1.10"},
                "options": {
                    "color": "22.00",
                    "car_park_pass": "22.00",
                    "subtotal": "44.00",
                },
            },
        )
