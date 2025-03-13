from scbp_core.tests.distance_mock_decorators import test_case_mock_distance_to_gpo
from scbp_core.tests.factory.booking import AddressFactory
from scbp_core.tests.factory.booking import OneWayBookingFactory
from scbp_core.tests.pricing.pricing_test_case import PricingTestCase


@test_case_mock_distance_to_gpo
class OneWayTimePricingTestCase(PricingTestCase):
    def setUp(self):
        """
        For all tests within this case, we're going between
        234 Whitehorse Rd, Nunawading VIC 3131 (place ID ChIJi7iHMsk41moR_7dXVxseiZ4) and
        Melbourne's GPO, 350 Bourke St, Melbourne VIC 3000 (place ID ChIJlVWPC7VC1moRwANVqtx_3eQ)
        Distance 19.0km
        in Any Class vehicle
        """
        super().setUp()
        self.booking = OneWayBookingFactory(
            vehicle_class=self.vehicle_classes["Any Class"],
            from_address=AddressFactory(source_id="ChIJi7iHMsk41moR_7dXVxseiZ4"),
            destination_address=AddressFactory(source_id="ChIJlVWPC7VC1moRwANVqtx_3eQ"),
        )
        self.mock_distance(self.booking, "19.0")

    def test_off_peak(self):
        """
        Test travel at 12:30PM (Off-peak)
        Expect $56.40
        """
        self.booking.travel_on = self.set_hour(12)
        self.assert_price_breakdown_equals(
            self.booking,
            {
                "total": "56.40",
                "base": {
                    "distance": "19.0",
                    "car_class": "22.00",
                    "tier1": "11.00",
                    "tier2": "25.20",
                    "peak": "-2.91",
                    "subtotal": "55.29",
                },
                "fees": {"government": "1.10", "subtotal": "1.10"},
                "rounding": {"rounding": "0.01", "subtotal": "0.01"},
            },
        )
        self.assert_price_equals(self.booking, "56.40")

    def test_standard(self):
        """
        Test travel at 7:30PM (Standard)
        Expect $77.10
        """
        self.booking.travel_on = self.set_hour(19)
        self.assert_price_equals(self.booking, "77.10")

    def test_peak(self):
        """
        Test travel at 5:30PM (Peak)
        Expect $80.90
        """
        self.booking.travel_on = self.set_hour(17)
        self.assert_price_equals(self.booking, "80.90")

    def test_out_of_hours(self):
        """
        Test travel at 1:30AM (Out of hours)
        Expect $88.10
        """
        self.booking.travel_on = self.set_hour(1)
        self.assert_price_equals(self.booking, "88.10")
