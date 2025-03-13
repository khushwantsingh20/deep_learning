from datetime import datetime

from django.test import TestCase
from django.utils.timezone import make_aware
from freezegun import freeze_time

from scbp_core.services.send_confirmation_notice import get_schedule_message_delay
from scbp_core.tests.factory.booking import OneWayBookingFactory


class BookingConfirmationDelayTestCase(TestCase):
    def test_booking_during_day(self):
        booking = OneWayBookingFactory.build(
            travel_on=make_aware(
                datetime(year=2019, month=7, day=2, hour=19, minute=30)
            )
        )

        with freeze_time(
            make_aware(datetime(year=2019, month=7, day=2, hour=15, minute=30))
        ):
            self.assertEqual(
                get_schedule_message_delay(booking), 4 * 60 * 60 - 45 * 60
            )  # 45mins before travel

        with freeze_time(
            make_aware(datetime(year=2019, month=7, day=2, hour=18, minute=46))
        ):
            self.assertEqual(get_schedule_message_delay(booking), 0)  # now

    def test_booking_during_night_past_midnight(self):
        booking = OneWayBookingFactory.build(
            travel_on=make_aware(datetime(year=2019, month=7, day=3, hour=1, minute=30))
        )

        with freeze_time(
            make_aware(datetime(year=2019, month=7, day=3, hour=0, minute=25))
        ):
            self.assertEqual(get_schedule_message_delay(booking), 5 * 60)

        with freeze_time(
            make_aware(datetime(year=2019, month=7, day=2, hour=22, minute=30))
        ):
            self.assertEqual(get_schedule_message_delay(booking), 2 * 60 * 60)

        with freeze_time(
            make_aware(datetime(year=2019, month=7, day=2, hour=19, minute=30))
        ):
            self.assertEqual(get_schedule_message_delay(booking), 30 * 60)

        with freeze_time(
            make_aware(datetime(year=2019, month=7, day=3, hour=0, minute=35))
        ):
            self.assertEqual(get_schedule_message_delay(booking), 0)

    def test_booking_during_night_before_midnight(self):
        booking = OneWayBookingFactory.build(
            travel_on=make_aware(
                datetime(year=2019, month=7, day=2, hour=22, minute=30)
            )
        )

        with freeze_time(
            make_aware(datetime(year=2019, month=7, day=2, hour=21, minute=25))
        ):
            self.assertEqual(get_schedule_message_delay(booking), 5 * 60)

        with freeze_time(
            make_aware(datetime(year=2019, month=7, day=2, hour=19, minute=30))
        ):
            self.assertEqual(get_schedule_message_delay(booking), 30 * 60)

        with freeze_time(
            make_aware(datetime(year=2019, month=7, day=1, hour=19, minute=30))
        ):
            self.assertEqual(
                get_schedule_message_delay(booking), 30 * 60 + 24 * 60 * 60
            )
