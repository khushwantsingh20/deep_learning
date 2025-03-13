from datetime import date
from datetime import datetime
from datetime import time
from decimal import Decimal

from django.utils.timezone import make_aware

from scbp_core.tests.distance_mock_decorators import test_case_mock_distance_to_gpo
from scbp_core.tests.factory.booking import AddressFactory
from scbp_core.tests.factory.booking import HourlyBookingFactory
from scbp_core.tests.factory.booking import OneWayBookingFactory
from scbp_core.tests.factory.pricing import SpecialEventFactory
from scbp_core.tests.pricing.pricing_test_case import PricingTestCase


@test_case_mock_distance_to_gpo
class SpecialEventPricingTestCase(PricingTestCase):
    def setUp(self):
        super().setUp()
        self.from_address = AddressFactory(postal_code="3120")
        self.to_address = AddressFactory(postal_code="3220")

    def test_hourly_pickup(self):
        """
        Scenario gleaned from the sample cost calculation spreadsheet
        - No airport
        - Standard time
        - Family People Mover class
        - 1 booster seat
        Expect $133.10
        """
        booking = HourlyBookingFactory(
            vehicle_class=self.vehicle_classes["FPM"],
            booster_seat_count=1,
            child_under8_count=1,
            from_address=self.from_address,
            travel_on=make_aware(
                datetime(year=2019, month=9, day=28, hour=11, minute=30)
            ),
        )
        SpecialEventFactory(
            title="Pre Grand Final",
            date=date(year=2019, month=9, day=28),
            start_time=time(hour=9),
            end_time=time(hour=11, minute=59),
            pickup_postcode="3120",
            dropoff_postcode="Any",
            event_surcharge=Decimal("22.00"),
        )
        self.assert_price_breakdown_equals(
            booking,
            {
                "total": "133.10",
                "event_name": "Pre Grand Final",
                "base": {
                    "time": "1:00",
                    "car_class": "22.00",
                    "first_hour": "88.00",
                    "subtotal": "110.00",
                },
                "fees": {"government": "1.10", "event": "22.00", "subtotal": "23.10"},
                "options": {"child_seats": "0.00", "subtotal": "0.00"},
            },
        )
        self.assert_price_equals(booking, "133.10")

    def test_one_way_pickup(self):
        """
        - One way - 19.0km
        - Standard hours
        - Luxury Sedan
        Expect $126.70
        """
        booking = OneWayBookingFactory(
            vehicle_class=self.vehicle_classes["Luxury Sedan"],
            from_address=self.from_address,
            destination_address=self.to_address,
            travel_on=make_aware(
                datetime(year=2019, month=9, day=28, hour=11, minute=30)
            ),
        )
        SpecialEventFactory(
            title="Pre Grand Final",
            date=date(year=2019, month=9, day=28),
            start_time=time(hour=9),
            end_time=time(hour=11, minute=59),
            pickup_postcode="Any",
            dropoff_postcode="3220",
            event_surcharge=Decimal("22.00"),
        )
        self.mock_distance(booking, "19.0")
        self.assert_price_breakdown_equals(
            booking,
            {
                "total": "126.70",
                "event_name": "Pre Grand Final",
                "base": {
                    "distance": "19.0",
                    "car_class": "55.00",
                    "tier1": "15.00",
                    "tier2": "33.60",
                    "subtotal": "103.60",
                },
                "fees": {"government": "1.10", "event": "22.00", "subtotal": "23.10"},
            },
        )
        self.assert_price_equals(booking, "126.70")

    def test_non_event_routing(self):
        """
        - One way - 19.0km
        - Standard hours
        - Luxury Sedan
        - Event routes the wrong way for this trip
        Expect $104.70
        """
        booking = OneWayBookingFactory(
            vehicle_class=self.vehicle_classes["Luxury Sedan"],
            from_address=self.from_address,
            destination_address=self.to_address,
            travel_on=make_aware(
                datetime(year=2019, month=9, day=28, hour=11, minute=30)
            ),
        )
        SpecialEventFactory(
            title="Pre Grand Final",
            date=date(year=2019, month=9, day=28),
            start_time=time(hour=9),
            end_time=time(hour=11, minute=59),
            pickup_postcode="Any",
            dropoff_postcode="3120",
            event_surcharge=Decimal("22.00"),
        )
        self.mock_distance(booking, "19.0")
        self.assert_price_breakdown_equals(
            booking,
            {
                "total": "104.70",
                "base": {
                    "distance": "19.0",
                    "car_class": "55.00",
                    "tier1": "15.00",
                    "tier2": "33.60",
                    "subtotal": "103.60",
                },
                "fees": {"government": "1.10", "subtotal": "1.10"},
            },
        )
        self.assert_price_equals(booking, "104.70")

    def test_minimum_charge(self):
        """
        - One way - 19.0km
        - Standard hours
        - Luxury Sedan
        - Minimum charge of $220.00 for any bookings to this event
        Expect $243.10
        """
        booking = OneWayBookingFactory(
            vehicle_class=self.vehicle_classes["Luxury Sedan"],
            from_address=self.from_address,
            destination_address=self.to_address,
            travel_on=make_aware(
                datetime(year=2019, month=9, day=28, hour=11, minute=30)
            ),
        )
        SpecialEventFactory(
            title="Super Expensive Gala",
            date=date(year=2019, month=9, day=28),
            start_time=time(hour=9),
            end_time=time(hour=11, minute=59),
            pickup_postcode="Any",
            dropoff_postcode="3220",
            event_surcharge=Decimal("22.00"),
            event_minimum_charge=Decimal("220.00"),
        )
        self.mock_distance(booking, "19.0")
        self.assert_price_breakdown_equals(
            booking,
            {
                "total": "243.10",
                "event_name": "Super Expensive Gala",
                "base": {
                    "distance": "19.0",
                    "event_minimum": "220.00",
                    "subtotal": "220.00",
                },
                "fees": {"government": "1.10", "event": "22.00", "subtotal": "23.10"},
            },
        )
        self.assert_price_equals(booking, "243.10")

    def test_minimum_charge_with_high_base(self):
        """
        - One way - 19.0km
        - Standard hours
        - Luxury Sedan
        - Minimum charge of $22.00 for any bookings to this event
        Expect $126.70
        """
        booking = OneWayBookingFactory(
            vehicle_class=self.vehicle_classes["Luxury Sedan"],
            from_address=self.from_address,
            destination_address=self.to_address,
            travel_on=make_aware(
                datetime(year=2019, month=9, day=28, hour=11, minute=30)
            ),
        )
        SpecialEventFactory(
            title="Super Expensive Gala",
            date=date(year=2019, month=9, day=28),
            start_time=time(hour=9),
            end_time=time(hour=11, minute=59),
            pickup_postcode="Any",
            dropoff_postcode="3220",
            event_surcharge=Decimal("22.00"),
            event_minimum_charge=Decimal("22.00"),
        )
        self.mock_distance(booking, "19.0")
        self.assert_price_breakdown_equals(
            booking,
            {
                "total": "126.70",
                "event_name": "Super Expensive Gala",
                "base": {
                    "distance": "19.0",
                    "car_class": "55.00",
                    "tier1": "15.00",
                    "tier2": "33.60",
                    "subtotal": "103.60",
                },
                "fees": {"government": "1.10", "event": "22.00", "subtotal": "23.10"},
            },
        )
        self.assert_price_equals(booking, "126.70")

    def test_minimum_charge_with_options(self):
        """
        - One way - 19.0km
        - Standard hours
        - Luxury Sedan
        - Minimum charge of $220.00 for any bookings to this event
        - Ribbon
        Expect $287.10
        """
        booking = OneWayBookingFactory(
            vehicle_class=self.vehicle_classes["Luxury Sedan"],
            from_address=self.from_address,
            destination_address=self.to_address,
            requires_wedding_ribbons=True,
            travel_on=make_aware(
                datetime(year=2019, month=9, day=28, hour=11, minute=30)
            ),
        )
        SpecialEventFactory(
            title="Super Expensive Gala",
            date=date(year=2019, month=9, day=28),
            start_time=time(hour=9),
            end_time=time(hour=11, minute=59),
            pickup_postcode="Any",
            dropoff_postcode="3220",
            event_surcharge=Decimal("22.00"),
            event_minimum_charge=Decimal("220.00"),
        )
        self.mock_distance(booking, "19.0")
        self.assert_price_breakdown_equals(
            booking,
            {
                "total": "287.10",
                "event_name": "Super Expensive Gala",
                "base": {
                    "distance": "19.0",
                    "event_minimum": "220.00",
                    "subtotal": "220.00",
                },
                "fees": {"government": "1.10", "event": "22.00", "subtotal": "23.10"},
                "options": {"ribbon": "44.00", "subtotal": "44.00"},
            },
        )
        self.assert_price_equals(booking, "287.10")
