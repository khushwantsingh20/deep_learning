from decimal import Decimal

from scbp_core.services.places import MELBOURNE_GPO_PLACE_ID
from scbp_core.tests.distance_mock_decorators import mock_raw_distance
from scbp_core.tests.factory.booking import AddressFactory
from scbp_core.tests.factory.booking import HourlyBookingFactory
from scbp_core.tests.factory.booking import OneWayBookingFactory
from scbp_core.tests.pricing.pricing_test_case import PricingTestCase


class OutOfAreaPricingTestCase(PricingTestCase):
    """
    We use the same two addresses for all of these tests (most will be Geelong to Ballarat):
    Geelong: GMHBA Stadium, 370 Moorabool St, South Geelong VIC 3220
        - place ID: ChIJMcB8AA0U1GoRdxavr3PxtVQ
        - distance from GPO: 75.6km
    Ballarat: Ballarat Tramway Museum, 100 Gillies St North, Ballarat VIC 3350
        - place ID ChIJbXY7w39D0WoR7YX2XG-_uEM
        - distance from GPO: 123km
    These two points are 92.7km apart
    """

    GEELONG_PLACE_ID = "ChIJMcB8AA0U1GoRdxavr3PxtVQ"
    BALLARAT_PLACE_ID = "ChIJbXY7w39D0WoR7YX2XG-_uEM"
    EXPECTED_DISTANCES = {
        (GEELONG_PLACE_ID, BALLARAT_PLACE_ID): Decimal("92.7"),
        (GEELONG_PLACE_ID, MELBOURNE_GPO_PLACE_ID): Decimal("75.6"),
        (BALLARAT_PLACE_ID, MELBOURNE_GPO_PLACE_ID): Decimal("123.0"),
    }

    def setUp(self):
        super().setUp()
        self.ballarat_address = AddressFactory(source_id=self.BALLARAT_PLACE_ID)
        self.geelong_address = AddressFactory(source_id=self.GEELONG_PLACE_ID)
        self.melbourne_gpo_address = AddressFactory(source_id=MELBOURNE_GPO_PLACE_ID)

    @mock_raw_distance(EXPECTED_DISTANCES)
    def test_hourly_geelong(self):
        """
        1 hour in Geelong
        Expect $192.30
        """
        booking = HourlyBookingFactory(
            vehicle_class=self.vehicle_classes["Any Class"],
            from_address=self.geelong_address,
            travel_on=self.set_hour(19),
        )
        self.assert_price_breakdown_equals(
            booking,
            {
                "total": "192.30",
                "base": {
                    "car_class": "0.00",
                    "time": "1:00",
                    "first_hour": "88.00",
                    "subtotal": "88.00",
                },
                "fees": {
                    "government": "1.10",
                    "out_of_area": "103.15",
                    "subtotal": "104.25",
                },
                "rounding": {"rounding": "0.05", "subtotal": "0.05"},
            },
        )
        self.assert_price_equals(booking, "192.30")

    @mock_raw_distance(EXPECTED_DISTANCES)
    def test_hourly_ballarat(self):
        """
        1 hour in Ballarat
        Expect $269.80
        """
        booking = HourlyBookingFactory(
            vehicle_class=self.vehicle_classes["Any Class"],
            from_address=self.ballarat_address,
            travel_on=self.set_hour(19),
        )
        self.assert_price_breakdown_equals(
            booking,
            {
                "total": "269.80",
                "base": {
                    "car_class": "0.00",
                    "time": "1:00",
                    "first_hour": "88.00",
                    "subtotal": "88.00",
                },
                "fees": {
                    "government": "1.10",
                    "out_of_area": "180.70",
                    "subtotal": "181.80",
                },
            },
        )
        self.assert_price_equals(booking, "269.80")

    @mock_raw_distance(EXPECTED_DISTANCES)
    def test_hourly_off_peak_geelong(self):
        """
        1 hour in Geelong at 12:30 PM (off-peak)
        Expect $178.50
        """
        booking = HourlyBookingFactory(
            vehicle_class=self.vehicle_classes["Any Class"],
            from_address=self.geelong_address,
            travel_on=self.set_hour(12),
        )
        self.assert_price_breakdown_equals(
            booking,
            {
                "total": "178.50",
                "base": {
                    "car_class": "0.00",
                    "time": "1:00",
                    "first_hour": "88.00",
                    "subtotal": "88.00",
                },
                "fees": {
                    "government": "1.10",
                    "out_of_area": "89.40",
                    "subtotal": "90.50",
                },
            },
        )
        self.assert_price_equals(booking, "178.50")

    @mock_raw_distance(EXPECTED_DISTANCES)
    def test_hourly_off_peak_ballarat(self):
        """
        1 hour in Ballarat at 12:30 PM (off-peak)
        Expect $244.30
        """
        booking = HourlyBookingFactory(
            vehicle_class=self.vehicle_classes["Any Class"],
            from_address=self.ballarat_address,
            travel_on=self.set_hour(12),
        )
        self.assert_price_breakdown_equals(
            booking,
            {
                "total": "244.30",
                "base": {
                    "car_class": "0.00",
                    "time": "1:00",
                    "first_hour": "88.00",
                    "subtotal": "88.00",
                },
                "fees": {
                    "government": "1.10",
                    "out_of_area": "155.20",
                    "subtotal": "156.30",
                },
            },
        )
        self.assert_price_equals(booking, "244.30")

    @mock_raw_distance(EXPECTED_DISTANCES)
    def test_one_way_geelong_to_ballarat(self):
        """
        Geelong to Ballarat
        Expect $289.10
        """
        booking = OneWayBookingFactory(
            vehicle_class=self.vehicle_classes["Any Class"],
            from_address=self.geelong_address,
            destination_address=self.ballarat_address,
        )
        self.assert_price_breakdown_equals(
            booking,
            {
                "total": "289.10",
                "base": {
                    "distance": "92.7",
                    "tier1": "15.00",
                    "tier2": "70.00",
                    "tier3": "87.45",
                    "car_class": "33.00",
                    "subtotal": "205.45",
                },
                "fees": {
                    "government": "1.10",
                    "out_of_area": "82.50",
                    "subtotal": "83.60",
                },
                "rounding": {"rounding": "0.05", "subtotal": "0.05"},
            },
        )
        self.assert_price_equals(booking, "289.10")

    @mock_raw_distance(EXPECTED_DISTANCES)
    def test_one_way_ballarat_to_geelong(self):
        """
        Ballarat to Geelong
        Expect $289.10
        """
        booking = OneWayBookingFactory(
            vehicle_class=self.vehicle_classes["Any Class"],
            from_address=self.ballarat_address,
            destination_address=self.geelong_address,
        )
        self.assert_price_breakdown_equals(
            booking,
            {
                "total": "289.10",
                "base": {
                    "distance": "92.7",
                    "tier1": "15.00",
                    "tier2": "70.00",
                    "tier3": "87.45",
                    "car_class": "33.00",
                    "subtotal": "205.45",
                },
                "fees": {
                    "government": "1.10",
                    "out_of_area": "82.50",
                    "subtotal": "83.60",
                },
                "rounding": {"rounding": "0.05", "subtotal": "0.05"},
            },
        )
        self.assert_price_equals(booking, "289.10")

    @mock_raw_distance(EXPECTED_DISTANCES)
    def test_one_way_geelong_to_ballarat_fpm(self):
        """
        Geelong to Ballarat in a FPM
        Expect $333.80
        """
        booking = OneWayBookingFactory(
            vehicle_class=self.vehicle_classes["FPM"],
            from_address=self.geelong_address,
            destination_address=self.ballarat_address,
        )
        self.assert_price_breakdown_equals(
            booking,
            {
                "total": "333.80",
                "base": {
                    "distance": "92.7",
                    "tier1": "15.00",
                    "tier2": "70.00",
                    "tier3": "99.11",
                    "car_class": "55.00",
                    "subtotal": "239.11",
                },
                "fees": {
                    "government": "1.10",
                    "out_of_area": "93.50",
                    "subtotal": "94.60",
                },
                "rounding": {"rounding": "0.09", "subtotal": "0.09"},
            },
        )
        self.assert_price_equals(booking, "333.80")

    @mock_raw_distance(EXPECTED_DISTANCES)
    def test_one_way_ballarat_to_geelong_luxury_sedan(self):
        """
        Ballarat to Geelong in a luxury sedan
        Expect $381.70
        """
        booking = OneWayBookingFactory(
            vehicle_class=self.vehicle_classes["Luxury Sedan"],
            from_address=self.ballarat_address,
            destination_address=self.geelong_address,
        )
        self.assert_price_breakdown_equals(
            booking,
            {
                "total": "381.70",
                "base": {
                    "distance": "92.7",
                    "tier1": "15.00",
                    "tier2": "84.00",
                    "tier3": "116.60",
                    "car_class": "55.00",
                    "subtotal": "270.60",
                },
                "fees": {
                    "government": "1.10",
                    "out_of_area": "110.00",
                    "subtotal": "111.10",
                },
            },
        )
        self.assert_price_equals(booking, "381.70")

    @mock_raw_distance(EXPECTED_DISTANCES)
    def test_one_way_geelong_to_melbourne(self):
        """
        Geelong to Melbourne GPO - should not trigger the out-of-area pricing
        Expect $178.50
        """
        booking = OneWayBookingFactory(
            vehicle_class=self.vehicle_classes["Any Class"],
            from_address=self.geelong_address,
            destination_address=self.melbourne_gpo_address,
        )
        self.assert_price_breakdown_equals(
            booking,
            {
                "total": "178.50",
                "base": {
                    "distance": "75.6",
                    "tier1": "15.00",
                    "tier2": "70.00",
                    "tier3": "59.40",
                    "car_class": "33.00",
                    "subtotal": "177.40",
                },
                "fees": {"government": "1.10", "subtotal": "1.10"},
            },
        )
        self.assert_price_equals(booking, "178.50")
