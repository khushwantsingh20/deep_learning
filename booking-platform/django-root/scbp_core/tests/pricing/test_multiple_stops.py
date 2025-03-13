from datetime import timedelta
from decimal import Decimal

from freezegun import freeze_time

from scbp_core.models.booking import BookingAddressType
from scbp_core.services.places import MELBOURNE_GPO_PLACE_ID
from scbp_core.tests.distance_mock_decorators import mock_raw_distance
from scbp_core.tests.factory.account import AccountFactory
from scbp_core.tests.factory.booking import AddressFactory
from scbp_core.tests.factory.booking import OneWayBookingFactory
from scbp_core.tests.factory.user import ClientUserFactory
from scbp_core.tests.pricing.pricing_test_case import PricingTestCase


def source_ids():
    return {
        # Melbourne GPO, Melbourne CBD
        "melbourne_cbd": {
            "source_id": MELBOURNE_GPO_PLACE_ID,
            "formatted_address": "350 Bourke St, Melbourne VIC 3000",
            "postal_code": "3000",
        },
        # Camberwell Place, Camberwell
        "camberwell": {
            "source_id": "ChIJL_MrvoNB1moRNem-PT2uQJQ",
            "formatted_address": "793 Burke Road, Camberwell VIC 3124",
            "postal_code": "3124",
        },
        # Box Hill Central, Box Hill
        "box_hill": {
            "source_id": "ChIJ34_ST7dA1moRb4taFWxfD5c",
            "formatted_address": "1 Main Street, Box Hill VIC 3128",
            "postal_code": "3128",
        },
        # Alliance Software, Nunawading
        "nunawading": {
            "source_id": "ChIJi7iHMsk41moR_7dXVxseiZ4",
            "formatted_address": "234 Whitehorse Road, Nunawading VIC 3131",
            "postal_code": "3131",
        },
        # Eastland Shopping Centre, Ringwood
        "ringwood": {
            "source_id": "ChIJ06ObLtQ71moR0NAyBXZWBA8",
            "formatted_address": "175 Maroondah Highway, Ringwood VIC 3134",
            "postal_code": "3134",
        },
    }


def distances():
    raw_distances = [
        ("melbourne_cbd", "nunawading", "19.0"),
        ("melbourne_cbd", "camberwell", "15.0"),
        ("camberwell", "nunawading", "11.0"),
        ("camberwell", "ringwood", "19.0"),
        ("ringwood", "box_hill", "13.0"),
        ("box_hill", "nunawading", "8.0"),
    ]

    return {
        (source_ids()[start]["source_id"], source_ids()[end]["source_id"]): Decimal(
            distance
        )
        for (start, end, distance) in raw_distances
    }


@freeze_time("2019-7-2")
class MultipleStopsTestCase(PricingTestCase):
    def setUp(self):
        super().setUp()
        self.addresses = {
            suburb: AddressFactory.create(**location_data)
            for suburb, location_data in source_ids().items()
        }
        creator = ClientUserFactory()
        self.booking = OneWayBookingFactory(
            account=AccountFactory(),
            vehicle_class=self.vehicle_classes["Any Class"],
            created_by=creator,
            client_user=creator,
            hourly_booking_duration=timedelta(hours=0, minutes=0, seconds=0),
            from_address=self.addresses["melbourne_cbd"],
            from_address_type=BookingAddressType.CUSTOM,
            destination_address=self.addresses["nunawading"],
            destination_address_type=BookingAddressType.OFFICE,
        )

    @mock_raw_distance(distances())
    def test_without_stops(self):
        """
        Verify that the addition of additional stops to the pricing algorithm does not affect the pricing
        for bookings without additional stops
        Expect $77.10
        """
        self.booking.save()
        self.assert_price_equals(self.booking, "77.10")
        self.assert_price_breakdown_equals(
            self.booking,
            {
                "total": "77.10",
                "base": {
                    "distance": "19.0",
                    "tier1": "15.00",
                    "tier2": "28.00",
                    "car_class": "33.00",
                    "subtotal": "76.00",
                },
                "fees": {"government": "1.10", "subtotal": "1.10"},
            },
        )

    @mock_raw_distance(distances())
    def test_one_stop(self):
        """
        Verify that adding one stop adds the expected additional distance and the additional stop fee
        Expect $102.10
        """
        self.booking.save()
        self.booking.set_additional_stops([self.addresses["camberwell"]])
        self.assert_price_breakdown_equals(
            self.booking,
            {
                "total": "102.10",
                "base": {
                    "distance": "26.0",
                    "tier1": "15.00",
                    "tier2": "42.00",
                    "car_class": "33.00",
                    "subtotal": "90.00",
                },
                "options": {"additional_stops": "11.00", "subtotal": "11.00"},
                "fees": {"government": "1.10", "subtotal": "1.10"},
            },
        )
        self.assert_price_equals(self.booking, "102.10")

    @mock_raw_distance(distances())
    def test_one_stop_without_save(self):
        """
        Verify that adding one stop adds the expected additional distance and the additional stop fee
        For this test, we don't go to the database
        Expect $102.10
        """
        # self.booking.save()
        # self.booking.set_additional_stops([self.addresses["camberwell"]])
        additional_stops = [self.addresses["camberwell"]]
        self.assertEqual(
            self.booking.get_distance(additional_stops=additional_stops),
            Decimal("26.0"),
        )
        self.assert_price_breakdown_equals(
            self.booking,
            {
                "total": "102.10",
                "base": {
                    "distance": "26.0",
                    "tier1": "15.00",
                    "tier2": "42.00",
                    "car_class": "33.00",
                    "subtotal": "90.00",
                },
                "options": {"additional_stops": "11.00", "subtotal": "11.00"},
                "fees": {"government": "1.10", "subtotal": "1.10"},
            },
            additional_stops=additional_stops,
        )
        self.assert_price_equals(
            self.booking, "102.10", additional_stops=additional_stops
        )

    @mock_raw_distance(distances())
    def test_three_stops(self):
        """
        Verify that the order of the stops is respected when calculating distance for the purposes of the one way
        pricing and that all of the stops have the corresponding fee attached to them
        Expect $176.90
        """
        self.booking.save()
        self.booking.set_additional_stops(
            [
                self.addresses["camberwell"],
                self.addresses["ringwood"],
                self.addresses["box_hill"],
            ]
        )
        self.assert_price_breakdown_equals(
            self.booking,
            {
                "total": "176.90",
                "base": {
                    "distance": "55.0",
                    "tier1": "15.00",
                    "tier2": "70.00",
                    "tier3": "24.75",
                    "car_class": "33.00",
                    "subtotal": "142.75",
                },
                "options": {"additional_stops": "33.00", "subtotal": "33.00"},
                "fees": {"government": "1.10", "subtotal": "1.10"},
                "rounding": {"rounding": "0.05", "subtotal": "0.05"},
            },
        )
        self.assert_price_equals(self.booking, "176.90")

    @mock_raw_distance(distances())
    def test_three_stops_without_save(self):
        """
        Verify that the order of the stops is respected when calculating distance for the purposes of the one way
        pricing and that all of the stops have the corresponding fee attached to them
        For this test, we don't go to the database - this verifies that the pre-save protocol works as expected
        Expect $176.90
        """
        additional_stops = [
            self.addresses["camberwell"],
            self.addresses["ringwood"],
            self.addresses["box_hill"],
        ]
        self.assert_price_breakdown_equals(
            self.booking,
            {
                "total": "176.90",
                "base": {
                    "distance": "55.0",
                    "tier1": "15.00",
                    "tier2": "70.00",
                    "tier3": "24.75",
                    "car_class": "33.00",
                    "subtotal": "142.75",
                },
                "options": {"additional_stops": "33.00", "subtotal": "33.00"},
                "fees": {"government": "1.10", "subtotal": "1.10"},
                "rounding": {"rounding": "0.05", "subtotal": "0.05"},
            },
            additional_stops=additional_stops,
        )
        self.assert_price_equals(
            self.booking, "176.90", additional_stops=additional_stops
        )
