import datetime
from datetime import timedelta

from scbp_core.models.booking import BookingAddressType
from scbp_core.tests.distance_mock_decorators import test_case_mock_distance_to_gpo
from scbp_core.tests.factory.booking import AddressFactory
from scbp_core.tests.factory.booking import HourlyBookingFactory
from scbp_core.tests.factory.booking import OneWayBookingFactory
from scbp_core.tests.pricing.pricing_test_case import PricingTestCase


@test_case_mock_distance_to_gpo
class PricingBreakdownTestCase(PricingTestCase):
    """
    This test covers the first five rows of the sample cost calculation spreadsheet -
    anything beyond that was added by me to obtain calculated results for other tests
    """

    def test_hourly_spreadsheet(self):
        """
        Scenario gleaned from the sample cost calculation spreadsheet
        - 2 hours
        - Starts in Nunawading
        - Ends at GPO
        - No airport
        - Standard time
        - Family People Mover class
        - 1 booster seat
        Expect $183.10
        """
        booking = HourlyBookingFactory(
            vehicle_class=self.vehicle_classes["FPM"],
            from_address=AddressFactory(),
            hourly_booking_duration=timedelta(hours=2),
            booster_seat_count=1,
            child_under8_count=1,
        )
        self.assert_price_breakdown_equals(
            booking,
            {
                "total": "183.10",
                "base": {
                    "time": "2:00",
                    "first_hour": "88.00",
                    "tier1": "72.00",
                    "car_class": "22.00",
                    "subtotal": "182.00",
                },
                "options": {"child_seats": "0.00", "subtotal": "0.00"},
                "fees": {"government": "1.10", "subtotal": "1.10"},
            },
        )

    def test_hourly_ribbon_from_airport(self):
        """
        - Any class
        - Ribbon
        - From airport
        Expect $142.60
        """
        booking = HourlyBookingFactory(
            vehicle_class=self.vehicle_classes["Any Class"],
            from_address=AddressFactory(),
            requires_wedding_ribbons=True,
            from_address_type=BookingAddressType.AIRPORT,
            from_airport_arrival_after_landing=10,
        )
        self.assert_price_breakdown_equals(
            booking,
            {
                "total": "142.60",
                "base": {
                    "time": "1:00",
                    "first_hour": "88.00",
                    "car_class": "0.00",
                    "airport": "5.00",
                    "subtotal": "93.00",
                },
                "options": {"ribbon": "44.00", "subtotal": "44.00"},
                "fees": {
                    "government": "1.10",
                    "airport_parking": "4.50",
                    "subtotal": "5.60",
                },
            },
        )

    def test_hourly_long_family_trip(self):
        """
        - LPM
        - 1 rear-facing child seat
        - 1 booster seat
        - 4 passengers
        - 8 hours
        Expect $733.10
        """
        booking = HourlyBookingFactory(
            vehicle_class=self.vehicle_classes["LPM"],
            from_address=AddressFactory(),
            rear_facing_baby_seat_count=1,
            booster_seat_count=1,
            child_under8_count=2,
            passenger_count=4,
            hourly_booking_duration=timedelta(hours=8),
        )
        self.assert_price_breakdown_equals(
            booking,
            {
                "total": "733.10",
                "base": {
                    "time": "8:00",
                    "first_hour": "88.00",
                    "tier1": "360.00",
                    "tier2": "120.00",
                    "car_class": "142.00",
                    "subtotal": "710.00",
                },
                "options": {"child_seats": "22.00", "subtotal": "22.00"},
                "fees": {"government": "1.10", "subtotal": "1.10"},
            },
        )

    def test_one_way_peak_options(self):
        """
        - One way
            - From 234 Whitehorse Rd, Nunawading VIC 3131 (place ID ChIJi7iHMsk41moR_7dXVxseiZ4)
            - To Melbourne's GPO, 350 Bourke St, Melbourne VIC 3000 (place ID ChIJlVWPC7VC1moRwANVqtx_3eQ)
            - 19.0km
        - Peak hours (using 5:30 PM)
        - Sedan
        - Ribbon
        - 1 front-facing baby seat
        Expect $135.90
        """
        booking = OneWayBookingFactory(
            vehicle_class=self.vehicle_classes["Sedan"],
            from_address=AddressFactory(source_id="ChIJi7iHMsk41moR_7dXVxseiZ4"),
            destination_address=AddressFactory(source_id="ChIJlVWPC7VC1moRwANVqtx_3eQ"),
            requires_wedding_ribbons=True,
            forward_facing_baby_seat_count=1,
            child_under8_count=1,
            travel_on=self.set_hour(17),
        )
        self.mock_distance(booking, "19.0")
        self.assert_price_breakdown_equals(
            booking,
            {
                "total": "135.90",
                "base": {
                    "distance": "19.0",
                    "tier1": "15.00",
                    "tier2": "28.00",
                    "car_class": "33.00",
                    "peak": "3.80",
                    "subtotal": "79.80",
                },
                "options": {
                    "ribbon": "44.00",
                    "child_seats": "11.00",
                    "subtotal": "55.00",
                },
                "fees": {"government": "1.10", "subtotal": "1.10"},
            },
        )

    def test_one_way_luxury_sedan(self):
        """
        - One way
            - From 234 Whitehorse Rd, Nunawading VIC 3131 (place ID ChIJi7iHMsk41moR_7dXVxseiZ4)
            - To Melbourne's GPO, 350 Bourke St, Melbourne VIC 3000 (place ID ChIJlVWPC7VC1moRwANVqtx_3eQ)
            - 19.0km
        - Standard hours
        - Luxury Sedan
        Expect $104.70
        """
        booking = OneWayBookingFactory(
            vehicle_class=self.vehicle_classes["Luxury Sedan"],
            from_address=AddressFactory(source_id="ChIJi7iHMsk41moR_7dXVxseiZ4"),
            destination_address=AddressFactory(source_id="ChIJlVWPC7VC1moRwANVqtx_3eQ"),
        )
        self.mock_distance(booking, "19.0")
        self.assert_price_breakdown_equals(
            booking,
            {
                "total": "104.70",
                "base": {
                    "distance": "19.0",
                    "tier1": "15.00",
                    "tier2": "33.60",
                    "car_class": "55.00",
                    "subtotal": "103.60",
                },
                "fees": {"government": "1.10", "subtotal": "1.10"},
            },
        )

    def test_one_way_long_trip_to_airport(self):
        """
        - One way
            - From Snowgum Close, Rowville VIC 3178
            (place ID EihTbm93Z3VtIENsLCBSb3d2aWxsZSBWSUMgMzE3OCwgQXVzdHJhbGlhIi4qLAoUChIJi8KSC6A91moRzdIcG3KfWLoSFAoSCS-tN-gqFtZqEZDdjCF1VgQF)
            - To Melbourne Airport
            - 56.6km
        - Standard hours
        - Sedan
        Expect $152.20
        """
        booking = OneWayBookingFactory(
            vehicle_class=self.vehicle_classes["Sedan"],
            from_address=AddressFactory(
                source_id="EihTbm93Z3VtIENsLCBSb3d2aWxsZSBWSUMgMzE3OCwgQXVzdHJhbGlhIi4qLAoUChIJi8KSC6A91moRzdIcG3KfWLoSFAoSCS-tN-gqFtZqEZDdjCF1VgQF"
            ),
            destination_address_type=BookingAddressType.AIRPORT,
            destination_airport_terminal=1,
            destination_flight_departure_time=datetime.time(17, 0),
            destination_address=AddressFactory(),
        )
        self.mock_distance(booking, "56.6")
        self.assert_price_breakdown_equals(
            booking,
            {
                "total": "152.20",
                "base": {
                    "distance": "56.6",
                    "tier1": "15.00",
                    "tier2": "70.00",
                    "tier3": "28.05",
                    "car_class": "33.00",
                    "airport": "5.00",
                    "subtotal": "151.05",
                },
                "fees": {"government": "1.10", "subtotal": "1.10"},
                "rounding": {"rounding": "0.05", "subtotal": "0.05"},
            },
        )

    def test_one_way_long_peak_trip_to_airport(self):
        """
        - One way
            - From Snowgum Close, Rowville VIC 3178
            (place ID EihTbm93Z3VtIENsLCBSb3d2aWxsZSBWSUMgMzE3OCwgQXVzdHJhbGlhIi4qLAoUChIJi8KSC6A91moRzdIcG3KfWLoSFAoSCS-tN-gqFtZqEZDdjCF1VgQF)
            - To Melbourne Airport
            - 56.6km
        - Peak hours (using 5:30 PM)
        - Sedan
        Expect $159.50
        """
        booking = OneWayBookingFactory(
            vehicle_class=self.vehicle_classes["Sedan"],
            from_address=AddressFactory(
                source_id="EihTbm93Z3VtIENsLCBSb3d2aWxsZSBWSUMgMzE3OCwgQXVzdHJhbGlhIi4qLAoUChIJi8KSC6A91moRzdIcG3KfWLoSFAoSCS-tN-gqFtZqEZDdjCF1VgQF"
            ),
            destination_address_type=BookingAddressType.AIRPORT,
            destination_airport_terminal=1,
            destination_flight_departure_time=datetime.time(17, 0),
            destination_address=AddressFactory(),
            travel_on=self.set_hour(17),
        )
        self.mock_distance(booking, "56.6")
        self.assert_price_breakdown_equals(
            booking,
            {
                "total": "159.50",
                "base": {
                    "distance": "56.6",
                    "tier1": "15.00",
                    "tier2": "70.00",
                    "tier3": "28.05",
                    "car_class": "33.00",
                    "peak": "7.30",
                    "airport": "5.00",
                    "subtotal": "158.35",
                },
                "fees": {"government": "1.10", "subtotal": "1.10"},
                "rounding": {"rounding": "0.05", "subtotal": "0.05"},
            },
        )
