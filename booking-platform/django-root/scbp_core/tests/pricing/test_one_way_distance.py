from scbp_core.tests.distance_mock_decorators import test_case_mock_distance_to_gpo
from scbp_core.tests.factory.booking import AddressFactory
from scbp_core.tests.factory.booking import OneWayBookingFactory
from scbp_core.tests.pricing.pricing_test_case import PricingTestCase


@test_case_mock_distance_to_gpo
class OneWayPricingTestCase(PricingTestCase):
    def test_very_short_trip(self):
        """
        Test a very short trip between
        19 Elizabeth Street, Melbourne VIC 3000 (place ID ChIJFSqBeLRC1moR7OsDMJrXkJg) and
        121 Elizabeth Street, Melbourne VIC 3000 (place ID ChIJ1ymF-7RC1moRMqBJBuz3tQQ)
        Starting at 7:30 PM (standard rate)
        Distance is 0.3km
        Expect $56.10 (minimum price applies)
        """
        booking = OneWayBookingFactory(
            vehicle_class=self.vehicle_classes["Any Class"],
            from_address=AddressFactory(source_id="ChIJFSqBeLRC1moR7OsDMJrXkJg"),
            destination_address=AddressFactory(source_id="ChIJ1ymF-7RC1moRMqBJBuz3tQQ"),
        )
        self.mock_distance(booking, "0.3")
        self.assert_price_equals(booking, "56.10")
        self.assert_price_breakdown_equals(
            booking,
            {
                "total": "56.10",
                "base": {
                    "distance": "1.0",
                    "tier1": "3.00",
                    "car_class": "33.00",
                    "adjustment": "19.00",
                    "subtotal": "55.00",
                },
                "fees": {"government": "1.10", "subtotal": "1.10"},
            },
        )

    def test_short_trip(self):
        """
        Test a short trip between
        Flinders Street Railway Station, Flinders St, Melbourne VIC 3000 (place ID ChIJSSKDr7ZC1moRTsSnSV5BnuM) and
        Melbourne Cricket Ground, Brunton Ave, Richmond VIC 3002 (place ID ChIJgWIaV5VC1moR-bKgR9ZfV2M)
        Distance is 3.0km
        Expect $56.10 (minimum price applies)
        """
        booking = OneWayBookingFactory(
            vehicle_class=self.vehicle_classes["Any Class"],
            from_address=AddressFactory(source_id="ChIJSSKDr7ZC1moRTsSnSV5BnuM"),
            destination_address=AddressFactory(source_id="ChIJgWIaV5VC1moR-bKgR9ZfV2M"),
        )
        self.mock_distance(booking, "3.0")
        self.assert_price_equals(booking, "56.10")
        self.assert_price_breakdown_equals(
            booking,
            {
                "total": "56.10",
                "base": {
                    "distance": "3.0",
                    "tier1": "9.00",
                    "car_class": "33.00",
                    "adjustment": "13.00",
                    "subtotal": "55.00",
                },
                "fees": {"government": "1.10", "subtotal": "1.10"},
            },
        )

    def test_medium_trip(self):
        """
        Test a medium length trip between
        234 Whitehorse Rd, Nunawading VIC 3131 (place ID ChIJi7iHMsk41moR_7dXVxseiZ4) and
        Melbourne's GPO, 350 Bourke St, Melbourne VIC 3000 (place ID ChIJlVWPC7VC1moRwANVqtx_3eQ)
        Distance 19.0km
        Expect $77.10
        """
        booking = OneWayBookingFactory(
            vehicle_class=self.vehicle_classes["Any Class"],
            from_address=AddressFactory(source_id="ChIJi7iHMsk41moR_7dXVxseiZ4"),
            destination_address=AddressFactory(source_id="ChIJlVWPC7VC1moRwANVqtx_3eQ"),
        )
        self.mock_distance(booking, "19.0")
        self.assert_price_equals(booking, "77.10")

    def test_long_trip(self):
        """
        Test a long trip between
        Melbourne's GPO, 350 Bourke St, Melbourne VIC 3000 (place ID ChIJlVWPC7VC1moRwANVqtx_3eQ) and
        GMHBA Stadium, 370 Moorabool St, South Geelong VIC 3220 (place ID ChIJMcB8AA0U1GoRdxavr3PxtVQ)
        Distance 75.6km
        Expect $178.50
        """
        booking = OneWayBookingFactory(
            vehicle_class=self.vehicle_classes["Any Class"],
            from_address=AddressFactory(source_id="ChIJlVWPC7VC1moRwANVqtx_3eQ"),
            destination_address=AddressFactory(source_id="ChIJMcB8AA0U1GoRdxavr3PxtVQ"),
        )
        self.mock_distance(booking, "75.6")
        self.assert_price_equals(booking, "178.50")
