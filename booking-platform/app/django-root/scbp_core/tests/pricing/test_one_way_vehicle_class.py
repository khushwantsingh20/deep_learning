from scbp_core.tests.distance_mock_decorators import test_case_mock_distance_to_gpo
from scbp_core.tests.factory.booking import AddressFactory
from scbp_core.tests.factory.booking import OneWayBookingFactory
from scbp_core.tests.pricing.pricing_test_case import PricingTestCase


@test_case_mock_distance_to_gpo
class OneWayVehicleClassTestCase(PricingTestCase):
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

    def test_luxury_sedan(self):
        self.booking.vehicle_class = self.vehicle_classes["Luxury Sedan"]
        self.assert_price_equals(self.booking, "104.70")

    def test_luxury_people_mover(self):
        self.booking.vehicle_class = self.vehicle_classes["LPM"]
        self.assert_price_equals(self.booking, "126.70")

    def test_suv(self):
        self.booking.vehicle_class = self.vehicle_classes["SUV"]
        self.assert_price_equals(self.booking, "99.10")
