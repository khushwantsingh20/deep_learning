from datetime import timedelta

from scbp_core.models.booking import BookingAddressType
from scbp_core.tests.distance_mock_decorators import test_case_mock_distance_to_gpo
from scbp_core.tests.factory.booking import AddressFactory
from scbp_core.tests.factory.booking import HourlyBookingFactory
from scbp_core.tests.factory.booking import OneWayBookingFactory
from scbp_core.tests.pricing.pricing_test_case import PricingTestCase


@test_case_mock_distance_to_gpo
class SpreadsheetPricingTestCase(PricingTestCase):
    """
    This test covers the first five rows of the sample cost calculation spreadsheet -
    anything beyond that was added by me to obtain calculated results for other tests
    """

    def test_hourly(self):
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
        booking = HourlyBookingFactory.build(
            vehicle_class=self.vehicle_classes["FPM"],
            hourly_booking_duration=timedelta(hours=2),
            booster_seat_count=1,
        )
        self.assert_price_equals(booking, "183.10")

    def test_peak_options(self):
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
        booking = OneWayBookingFactory.build(
            vehicle_class=self.vehicle_classes["Sedan"],
            from_address=AddressFactory(source_id="ChIJi7iHMsk41moR_7dXVxseiZ4"),
            destination_address=AddressFactory(source_id="ChIJlVWPC7VC1moRwANVqtx_3eQ"),
            requires_wedding_ribbons=True,
            forward_facing_baby_seat_count=1,
            travel_on=self.set_hour(17),
        )
        self.mock_distance(booking, "19.0")
        self.assert_price_equals(booking, "135.90")

    def test_luxury_sedan(self):
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
        self.assert_price_equals(booking, "104.70")

    def test_long_trip_to_airport(self):
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
        booking = OneWayBookingFactory.build(
            vehicle_class=self.vehicle_classes["Sedan"],
            from_address=AddressFactory(
                source_id="EihTbm93Z3VtIENsLCBSb3d2aWxsZSBWSUMgMzE3OCwgQXVzdHJhbGlhIi4qLAoUChIJi8KSC6A91moRzdIcG3KfWLoSFAoSCS-tN-gqFtZqEZDdjCF1VgQF"
            ),
            destination_address_type=BookingAddressType.AIRPORT,
        )
        self.mock_distance(booking, "56.6")
        self.assert_price_equals(booking, "152.20")

    def test_long_peak_trip_to_airport(self):
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
        booking = OneWayBookingFactory.build(
            vehicle_class=self.vehicle_classes["Sedan"],
            from_address=AddressFactory(
                source_id="EihTbm93Z3VtIENsLCBSb3d2aWxsZSBWSUMgMzE3OCwgQXVzdHJhbGlhIi4qLAoUChIJi8KSC6A91moRzdIcG3KfWLoSFAoSCS-tN-gqFtZqEZDdjCF1VgQF"
            ),
            destination_address_type=BookingAddressType.AIRPORT,
            travel_on=self.set_hour(17),
        )
        self.mock_distance(booking, "56.6")
        self.assert_price_equals(booking, "159.50")
