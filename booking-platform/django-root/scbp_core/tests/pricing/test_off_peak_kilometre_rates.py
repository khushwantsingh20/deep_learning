import datetime

from scbp_core.models.booking import BookingAddressType
from scbp_core.tests.distance_mock_decorators import test_case_mock_distance_to_gpo
from scbp_core.tests.factory.booking import AddressFactory
from scbp_core.tests.factory.booking import OneWayBookingFactory
from scbp_core.tests.pricing.pricing_test_case import PricingTestCase


@test_case_mock_distance_to_gpo
class OffPeakKilometreTestCase(PricingTestCase):
    def test_one_way_off_peak_luxury_sedan(self):
        """
        - One way
            - From 234 Whitehorse Rd, Nunawading VIC 3131 (place ID ChIJi7iHMsk41moR_7dXVxseiZ4)
            - To Melbourne's GPO, 350 Bourke St, Melbourne VIC 3000 (place ID ChIJlVWPC7VC1moRwANVqtx_3eQ)
            - 19.0km
        - Standard hours
        - Luxury Sedan
        - 1:30PM (Off-peak)
        Expect $84.10
        """
        booking = OneWayBookingFactory(
            vehicle_class=self.vehicle_classes["Luxury Sedan"],
            from_address=AddressFactory(source_id="ChIJi7iHMsk41moR_7dXVxseiZ4"),
            destination_address=AddressFactory(source_id="ChIJlVWPC7VC1moRwANVqtx_3eQ"),
            travel_on=self.set_hour(12),
        )
        self.mock_distance(booking, "19.0")
        self.assert_price_breakdown_equals(
            booking,
            {
                "total": "84.10",
                "base": {
                    "distance": "19.0",
                    "tier1": "12.50",
                    "tier2": "30.80",
                    "car_class": "44.00",
                    "peak": "-4.36",
                    "subtotal": "82.94",
                },
                "fees": {"government": "1.10", "subtotal": "1.10"},
                "rounding": {"rounding": "0.06", "subtotal": "0.06"},
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
        - 1:30PM (Off-peak)
        Expect $120.00
        """
        booking = OneWayBookingFactory(
            vehicle_class=self.vehicle_classes["Sedan"],
            from_address=AddressFactory(
                source_id="EihTbm93Z3VtIENsLCBSb3d2aWxsZSBWSUMgMzE3OCwgQXVzdHJhbGlhIi4qLAoUChIJi8KSC6A91moRzdIcG3KfWLoSFAoSCS-tN-gqFtZqEZDdjCF1VgQF"
            ),
            destination_address_type=BookingAddressType.AIRPORT,
            destination_airport_terminal=1,
            destination_flight_departure_time=datetime.time(),
            destination_address=AddressFactory(),
            travel_on=self.set_hour(12),
        )
        self.mock_distance(booking, "56.6")
        self.assert_price_breakdown_equals(
            booking,
            {
                "total": "120.00",
                "base": {
                    "distance": "56.6",
                    "tier1": "11.00",
                    "tier2": "63.00",
                    "tier3": "23.80",
                    "car_class": "22.00",
                    "peak": "-5.99",
                    "airport": "5.00",
                    "subtotal": "118.81",
                },
                "fees": {"government": "1.10", "subtotal": "1.10"},
                "rounding": {"rounding": "0.09", "subtotal": "0.09"},
            },
        )
