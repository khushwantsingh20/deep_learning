import datetime
from decimal import Decimal

from scbp_core.models import BookingAddressType
from scbp_core.models import DistanceOverride
from scbp_core.tests.distance_mock_decorators import mock_raw_distance
from scbp_core.tests.factory.booking import AddressFactory
from scbp_core.tests.factory.booking import OneWayBookingFactory
from scbp_core.tests.pricing.pricing_test_case import PricingTestCase


class DistanceOverrideTestCase(PricingTestCase):
    def setUp(self):
        super().setUp()
        self.blackburn_north = AddressFactory(
            postal_code=3130, suburb="Blackburn North", source_id="blackburn north"
        )
        self.nunawading = AddressFactory(
            postal_code=3131, suburb="Nunawading", source_id="nunawading"
        )
        self.blackburn_south = AddressFactory(
            postal_code=3130, suburb="Blackburn South", source_id="blackburn south"
        )
        self.blackburn = AddressFactory(
            postal_code=3130, suburb="Blackburn", source_id="blackburn"
        )
        self.nunawading_north = AddressFactory(
            postal_code=3131, suburb="Nunawading North", source_id="nunawading north"
        )
        self.fitzroy = AddressFactory(
            postal_code=3065, suburb="Fitzroy", source_id="fitzroy"
        )
        self.melbourne = AddressFactory(
            postal_code=3000, suburb="Melbourne", source_id="melbourne"
        )
        DistanceOverride.get_override_by_postcodes.cache_clear()

    @mock_raw_distance({("blackburn north", "nunawading"): Decimal("666")})
    def test_override_postcode_to_postcode(self):
        """
        Test overrides work postcode to postcode
        """
        booking1 = OneWayBookingFactory(
            vehicle_class=self.vehicle_classes["Any Class"],
            from_address=self.blackburn_north,
            destination_address=self.nunawading,
        )
        booking2 = OneWayBookingFactory(
            vehicle_class=self.vehicle_classes["Any Class"],
            from_address=booking1.destination_address,
            destination_address=booking1.from_address,
        )
        self.assertEqual(booking1.get_distance(), Decimal("666"))

        DistanceOverride.objects.create(
            from_postcode=3130,
            to_postcode=3131,
            fixed_distance=Decimal("32"),
        )

        self.assertEqual(booking1.get_distance(), Decimal("32"))
        # Not bidirectional so should fallback to distance_between
        self.assertEqual(booking2.get_distance(), Decimal("666"))

        DistanceOverride.objects.create(
            from_postcode=3131,
            to_postcode=3130,
            fixed_distance=Decimal("30"),
        )
        self.assertEqual(booking1.get_distance(), Decimal("32"))
        self.assertEqual(booking2.get_distance(), Decimal("30"))

    def test_override_narrow_to_suburb(self):
        """
        Test overrides narrow to specific suburb
        """
        # Fallback when suburb specific options not provided
        DistanceOverride.objects.create(
            from_postcode=3130,
            to_postcode=3131,
            fixed_distance=Decimal("32"),
        )
        # Only from suburb set
        DistanceOverride.objects.create(
            from_suburb="blackburn north",
            from_postcode=3130,
            to_postcode=3131,
            fixed_distance=Decimal("1"),
        )
        DistanceOverride.objects.create(
            from_suburb="blackburn south",
            from_postcode=3130,
            to_postcode=3131,
            fixed_distance=Decimal("2"),
        )
        DistanceOverride.objects.create(
            to_suburb="blackburn north",
            to_postcode=3130,
            from_postcode=3131,
            fixed_distance=Decimal("3"),
        )
        DistanceOverride.objects.create(
            to_suburb="blackburn south",
            to_postcode=3130,
            from_postcode=3131,
            fixed_distance=Decimal("4"),
        )
        # Only to suburb set
        # Both from and to set
        DistanceOverride.objects.create(
            from_suburb="blackburn south",
            from_postcode=3130,
            to_postcode=3131,
            to_suburb="nunawading north",
            fixed_distance=Decimal("5"),
        )
        blackburn_north_to_nunawading = OneWayBookingFactory(
            vehicle_class=self.vehicle_classes["Any Class"],
            from_address=self.blackburn_north,
            destination_address=self.nunawading,
        )
        blackburn_south_to_nunawading = OneWayBookingFactory(
            vehicle_class=self.vehicle_classes["Any Class"],
            from_address=self.blackburn_south,
            destination_address=self.nunawading,
        )
        nunawading_to_blackburn_north = OneWayBookingFactory(
            vehicle_class=self.vehicle_classes["Any Class"],
            destination_address=self.blackburn_north,
            from_address=self.nunawading,
        )
        nunawading_to_blackburn_south = OneWayBookingFactory(
            vehicle_class=self.vehicle_classes["Any Class"],
            destination_address=self.blackburn_south,
            from_address=self.nunawading,
        )
        blackburn_to_nunawading = OneWayBookingFactory(
            vehicle_class=self.vehicle_classes["Any Class"],
            from_address=self.blackburn,
            destination_address=self.nunawading,
        )
        blackburn_south_to_nunawading_north = OneWayBookingFactory(
            vehicle_class=self.vehicle_classes["Any Class"],
            from_address=self.blackburn_south,
            destination_address=self.nunawading_north,
        )

        self.assertEqual(blackburn_north_to_nunawading.get_distance(), Decimal("1"))
        self.assertEqual(blackburn_south_to_nunawading.get_distance(), Decimal("2"))
        self.assertEqual(nunawading_to_blackburn_north.get_distance(), Decimal("3"))
        self.assertEqual(nunawading_to_blackburn_south.get_distance(), Decimal("4"))
        self.assertEqual(
            blackburn_south_to_nunawading_north.get_distance(), Decimal("5")
        )
        self.assertEqual(blackburn_to_nunawading.get_distance(), Decimal("32"))

    def test_one_way_start_airport_fee(self):
        """
        Taken from AirportPricingTestCase but uses override to set distance

        Test whether the airport fee is properly included for one way bookings that start at the airport
        Also tests whether the airport parking fee is properly included
        Other end is 328 Swanston St, Melbourne VIC 3000 (place ID ChIJlepBkstC1moRekAIp6Sx0Ao)
        Expect $90.60
        """
        booking = OneWayBookingFactory(
            vehicle_class=self.vehicle_classes["Any Class"],
            from_address_type=BookingAddressType.AIRPORT,
            from_address=AddressFactory(),
            destination_address=AddressFactory(source_id="ChIJlepBkstC1moRekAIp6Sx0Ao"),
            from_airport_arrival_after_landing=10,
        )
        DistanceOverride.objects.create(
            to_postcode=booking.destination_address.postal_code,
            from_postcode=3045,
            fixed_distance=Decimal("21.0"),
        )
        self.assert_price_breakdown_equals(
            booking,
            {
                "total": "90.60",
                "base": {
                    "distance": "21.0",
                    "car_class": "33.00",
                    "tier1": "15.00",
                    "tier2": "32.00",
                    "airport": "5.00",
                    "subtotal": "85.00",
                },
                "fees": {
                    "government": "1.10",
                    "airport_parking": "4.50",
                    "subtotal": "5.60",
                },
            },
        )
        self.assert_price_equals(booking, "90.60")

    def test_one_way_end_airport_fee(self):
        """
        Taken from AirportPricingTestCase but uses override to set distance

        Test whether the airport fee is properly included for one way bookings that end at the airport
        Other end is 328 Swanston St, Melbourne VIC 3000 (place ID ChIJlepBkstC1moRekAIp6Sx0Ao)
        Expect $86.10
        """
        booking = OneWayBookingFactory(
            vehicle_class=self.vehicle_classes["Any Class"],
            from_address=AddressFactory(source_id="ChIJlepBkstC1moRekAIp6Sx0Ao"),
            destination_address_type=BookingAddressType.AIRPORT,
            destination_airport_terminal=1,
            destination_flight_departure_time=datetime.time(),
            destination_address=AddressFactory(),
        )
        DistanceOverride.objects.create(
            from_postcode=booking.from_address.postal_code,
            to_postcode=3045,
            fixed_distance=Decimal("21.0"),
        )
        self.assert_price_breakdown_equals(
            booking,
            {
                "total": "86.10",
                "base": {
                    "distance": "21.0",
                    "car_class": "33.00",
                    "tier1": "15.00",
                    "tier2": "32.00",
                    "airport": "5.00",
                    "subtotal": "85.00",
                },
                "fees": {"government": "1.10", "subtotal": "1.10"},
            },
        )
        self.assert_price_equals(booking, "86.10")

    @mock_raw_distance(
        {
            ("blackburn north", "melbourne"): Decimal("666"),
            ("nunawading", "melbourne"): Decimal("333"),
        }
    )
    def test_override_multiple_stops(self):
        DistanceOverride.objects.create(
            from_postcode=self.blackburn_north.postal_code,
            to_postcode=self.nunawading.postal_code,
            fixed_distance=Decimal("1"),
        )
        DistanceOverride.objects.create(
            from_postcode=self.nunawading.postal_code,
            to_postcode=self.fitzroy.postal_code,
            fixed_distance=Decimal("6"),
        )
        DistanceOverride.objects.create(
            from_postcode=self.fitzroy.postal_code,
            to_postcode=self.melbourne.postal_code,
            fixed_distance=Decimal("100"),
        )

        booking = OneWayBookingFactory(
            vehicle_class=self.vehicle_classes["Any Class"],
            from_address=self.blackburn_north,
            destination_address=self.melbourne,
        )
        # Blackburn North => Melbourne (no override)
        self.assertEqual(booking.get_distance(), Decimal("666"))
        # Blackburn North => Nunawading (override 1km) => Melbourne (no override)
        self.assertEqual(
            booking.get_distance([self.nunawading]), Decimal("1") + Decimal("333")
        )
        # Blackburn North => Nunawading (override 1km) => Fitzroy (override 6km) => Melbourne (override 100km)
        self.assertEqual(
            booking.get_distance([self.nunawading, self.fitzroy]),
            Decimal("1") + Decimal("6") + Decimal("100"),
        )
