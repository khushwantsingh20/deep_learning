from datetime import date
from datetime import datetime
from datetime import time
from decimal import Decimal

from django.core.exceptions import ValidationError
from django.test import TestCase
from django.utils.timezone import make_aware

from scbp_core.models.pricing import SpecialEvent
from scbp_core.tests.factory.pricing import SpecialEventFactory


class SpecialEventQuerySetTestCase(TestCase):
    def setUp(self):
        SpecialEventFactory.create(
            title="a",
            date=date(year=2019, month=9, day=28),
            start_time=time(hour=9),
            end_time=time(hour=12),
            pickup_postcode="3120",
            dropoff_postcode="3220",
            event_surcharge=Decimal("22.00"),
        )
        SpecialEventFactory.create(
            title="b",
            date=date(year=2019, month=9, day=28),
            start_time=time(hour=12),
            end_time=time(hour=15),
            pickup_postcode="3220",
            dropoff_postcode="3120",
            event_surcharge=Decimal("44.00"),
        )
        SpecialEventFactory.create(
            title="c",
            date=date(year=2019, month=9, day=28),
            start_time=time(hour=12),
            end_time=time(hour=17),
            pickup_postcode="3220",
            dropoff_postcode="Any",
            event_surcharge=Decimal("22.00"),
        )

    def test_events_for_datetime(self):
        pickup_time = make_aware(datetime(year=2019, month=9, day=28, hour=11))
        self.assertEqual(
            SpecialEvent.objects.events_for_datetime(pickup_time).count(), 1
        )
        pickup_time = make_aware(datetime(year=2019, month=9, day=28, hour=13))
        self.assertEqual(
            SpecialEvent.objects.events_for_datetime(pickup_time).count(), 2
        )

    def test_events_by_location(self):
        # With no arguments, return all records
        self.assertEqual(SpecialEvent.objects.events_by_location().count(), 3)
        # Filter by one side of the operation
        self.assertEqual(
            SpecialEvent.objects.events_by_location(start="3120").count(), 1
        )
        # 'Any' should be picked up - tested here
        self.assertEqual(SpecialEvent.objects.events_by_location(end="3120").count(), 2)
        # Filter by both sides of the operation
        self.assertEqual(
            SpecialEvent.objects.events_by_location(start="3120", end="3220").count(), 1
        )
        self.assertEqual(
            SpecialEvent.objects.events_by_location(start="3220", end="3999").count(), 1
        )

    def test_chainable(self):
        self.assertEqual(
            SpecialEvent.objects.events_by_location(end="3120")
            .events_for_datetime(
                make_aware(datetime(year=2019, month=9, day=28, hour=16))
            )
            .count(),
            1,
        )

    def test_any_in_db(self):
        """
        Test that using 'Any' as the postcode results in 'any' being saved to the database
        """
        event = SpecialEvent.objects.get(title="c")
        self.assertEqual(event.dropoff_postcode, "any")

    def test_invalid_postcode(self):
        """
        Test that attempting to set an invalid postcode (not numeric or 'Any'/'any') raises an error
        """
        with self.assertRaises(ValidationError):
            event = SpecialEventFactory.build(
                title="d",
                date=date(year=2019, month=9, day=28),
                start_time=time(hour=12),
                end_time=time(hour=15),
                pickup_postcode="fake",
                dropoff_postcode="3120",
                event_surcharge=Decimal("44.00"),
            )
            event.save()
