import datetime

from scbp_core.models.booking import BookingAddressType
from scbp_core.tests.distance_mock_decorators import test_case_mock_distance_to_gpo
from scbp_core.tests.factory.booking import AddressFactory
from scbp_core.tests.factory.booking import HourlyBookingFactory
from scbp_core.tests.factory.booking import OneWayBookingFactory
from scbp_core.tests.pricing.pricing_test_case import PricingTestCase


@test_case_mock_distance_to_gpo
class AirportPricingTestCase(PricingTestCase):
    def test_hourly_start_airport_fee(self):
        """
        Test whether the airport fee is properly included for hourly bookings that start at the airport
        Also tests whether the airport parking fee is properly included
        Expect $98.60
        """
        booking = HourlyBookingFactory(
            vehicle_class=self.vehicle_classes["Any Class"],
            from_address=AddressFactory(),
            from_address_type=BookingAddressType.AIRPORT,
            from_airport_arrival_after_landing=10,
        )
        self.assert_price_breakdown_equals(
            booking,
            {
                "total": "98.60",
                "base": {
                    "time": "1:00",
                    "car_class": "0.00",
                    "first_hour": "88.00",
                    "airport": "5.00",
                    "subtotal": "93.00",
                },
                "fees": {
                    "government": "1.10",
                    "airport_parking": "4.50",
                    "subtotal": "5.60",
                },
            },
        )
        self.assert_price_equals(booking, "98.60")

    def test_hourly_end_airport_fee(self):
        """
        Test whether the airport fee is properly included for hourly bookings that end at the airport
        Expect $94.10
        """
        booking = HourlyBookingFactory(
            vehicle_class=self.vehicle_classes["Any Class"],
            destination_address_type=BookingAddressType.AIRPORT,
            from_address=AddressFactory(),
        )
        self.assert_price_breakdown_equals(
            booking,
            {
                "total": "94.10",
                "base": {
                    "time": "1:00",
                    "car_class": "0.00",
                    "first_hour": "88.00",
                    "airport": "5.00",
                    "subtotal": "93.00",
                },
                "fees": {"government": "1.10", "subtotal": "1.10"},
            },
        )
        self.assert_price_equals(booking, "94.10")

    def test_one_way_start_airport_fee(self):
        """
        Test whether the airport fee is properly included for one way bookings that start at the airport
        Also tests whether the airport parking fee is properly included
        Other end is 328 Swanston St, Melbourne VIC 3000 (place ID ChIJlepBkstC1moRekAIp6Sx0Ao)
        Expect $90.60
        """
        booking = OneWayBookingFactory(
            vehicle_class=self.vehicle_classes["Any Class"],
            from_address=AddressFactory(),
            from_address_type=BookingAddressType.AIRPORT,
            from_airport_arrival_after_landing=10,
            destination_address=AddressFactory(source_id="ChIJlepBkstC1moRekAIp6Sx0Ao"),
        )
        self.mock_distance(booking, "21.0")
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
        Test whether the airport fee is properly included for one way bookings that end at the airport
        Other end is 328 Swanston St, Melbourne VIC 3000 (place ID ChIJlepBkstC1moRekAIp6Sx0Ao)
        Expect $86.10
        """
        booking = OneWayBookingFactory(
            vehicle_class=self.vehicle_classes["Any Class"],
            from_address=AddressFactory(source_id="ChIJlepBkstC1moRekAIp6Sx0Ao"),
            destination_address_type=BookingAddressType.AIRPORT,
            destination_airport_terminal=1,
            destination_flight_departure_time=datetime.time(17, 0),
            destination_address=AddressFactory(),
        )
        self.mock_distance(booking, "21.0")
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
