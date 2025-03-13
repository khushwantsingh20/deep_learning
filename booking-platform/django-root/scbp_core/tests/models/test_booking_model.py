from datetime import date
from datetime import datetime
from datetime import time
from datetime import timedelta
from decimal import Decimal
from unittest import mock

from allianceutils.models import raise_validation_errors
from django.core.exceptions import ValidationError
from django.test import TestCase
from django.utils.timezone import make_aware
from freezegun import freeze_time

from scbp_core.models import BOOKING_LEAD_TIME
from scbp_core.models import BookingStatus
from scbp_core.models import MAX_BOOKING_DURATION_HOURS
from scbp_core.models import MIN_BOOKING_DURATION_HOURS
from scbp_core.models.booking import Booking
from scbp_core.models.booking import BookingAdditionalStop
from scbp_core.models.booking import BookingAddressType
from scbp_core.models.booking import BookingLeadTime
from scbp_core.models.booking_field_choices import BOOKING_PAST_ERROR_MESSAGE
from scbp_core.models.booking_field_choices import BOOKING_TOO_CLOSE_ERROR_MESSAGE
from scbp_core.models.pricing import PriceList
from scbp_core.models.vehicle import VehicleClass
from scbp_core.models.vehicle import VehicleColor
from scbp_core.services.get_day_type import get_day_type
from scbp_core.services.places import MELBOURNE_GPO_PLACE_ID
from scbp_core.tests.distance_mock_decorators import mock_raw_distance
from scbp_core.tests.factory.account import AccountFactory
from scbp_core.tests.factory.booking import AddressFactory
from scbp_core.tests.factory.booking import HourlyBookingFactory
from scbp_core.tests.factory.booking import OneWayBookingFactory
from scbp_core.tests.factory.user import ClientUserFactory
from scbp_core.tests.factory.user import DriverFactory
from scbp_core.tests.factory.vehicle import VehicleClassFactory

# Constants for out-of-hours tests
# OOH = out-of-hours
BOOKING_LEAD_TIME_OOH = timedelta(hours=8)
BOOKING_LEAD_TIME_OOH_START = time(hour=22, minute=0, second=0, microsecond=0)
BOOKING_LEAD_TIME_OOH_END = time(hour=7, minute=0, second=0, microsecond=0)


class BookingModelTestCase(TestCase):
    fixtures = ["vehicle_class.json", "booking_lead_time.json"]

    def setUp(self):
        self.from_address = AddressFactory.create(
            formatted_address="328 Swanston Street, Melbourne VIC 3000",
            postal_code="3000",
            source_id="sourceid1",
        )
        self.destination_address = AddressFactory.create(
            formatted_address="234 Whitehorse Road, Nunawading VIC 3130",
            postal_code="3130",
            source_id="sourceid2",
        )
        self.additional_stops = [
            AddressFactory.create(
                formatted_address="1230 Burwood Road, Hawthorn VIC 3122",
                postal_code="3122",
                source_id="sourceid3",
            ),
            AddressFactory.create(
                formatted_address="206 Canterbury Road, Canterbury VIC 3126",
                postal_code="3126",
                source_id="sourceid4",
            ),
            AddressFactory.create(
                formatted_address="1 Main Street, Box Hill VIC 3128",
                postal_code="3128",
                source_id="sourceid5",
            ),
        ]
        self.creator = ClientUserFactory()
        self.account = AccountFactory()
        self.booking = OneWayBookingFactory(
            account=self.account,
            vehicle_class=VehicleClass.objects.get(title="Any Class"),
            vehicle_color=VehicleColor.objects.get(title="Black"),
            created_by=self.creator,
            client_user=self.creator,
            from_address=self.from_address,
            from_address_type=BookingAddressType.HOME,
            destination_address=self.destination_address,
            destination_address_type=BookingAddressType.OFFICE,
            travel_on=make_aware(
                datetime(year=2019, month=8, day=2, hour=12, minute=0)
            ),
        )

    def save_booking_with_frozen_created_at(self):
        with freeze_time(datetime(year=2019, month=7, day=21, hour=12, minute=40)):
            self.booking.save()

    def test_booking_valid_without_additional_stops(self):
        # Simple test to verify that the record is valid without additional stops
        self.booking.full_clean()

    def test_booking_with_all_additional_stops(self):
        # Test to verify the booking is valid with one additional stop
        self.booking.save()
        self.booking.set_additional_stops(self.additional_stops)
        for index, stop in enumerate(self.additional_stops):
            self.assertEqual(
                BookingAdditionalStop.objects.get(
                    booking=self.booking, address=stop
                ).stop_number,
                index + 1,
            )
        self.assertEqual(
            list(self.booking.additional_stops.all()), self.additional_stops
        )

    def test_booking_with_reversed_stops(self):
        # Test order preservation by attempting the save in reverse order
        this_test_stops = list(reversed(self.additional_stops))
        self.booking.save()
        self.booking.set_additional_stops(this_test_stops)
        # Validate that the order is preserved internally
        for index, stop in enumerate(this_test_stops):
            self.assertEqual(
                BookingAdditionalStop.objects.get(
                    booking=self.booking, address=stop
                ).stop_number,
                index + 1,
            )
        # Validate that the order is preserved on display
        self.assertEqual(list(self.booking.additional_stops.all()), this_test_stops)

    def test_booking_with_randomly_ordered_stops(self):
        stop_order = [1, 2, 0]
        this_test_stops = [self.additional_stops[i] for i in stop_order]
        self.booking.save()
        self.booking.set_additional_stops(this_test_stops)
        # Validate that the order is preserved internally
        for index, stop in enumerate(this_test_stops):
            self.assertEqual(
                BookingAdditionalStop.objects.get(
                    booking=self.booking, address=stop
                ).stop_number,
                index + 1,
            )
        # Validate that the order is preserved on display
        self.assertEqual(list(self.booking.additional_stops.all()), this_test_stops)

    def test_booking_destination_airport_required_fields(self):
        self.booking.destination_address_type = BookingAddressType.AIRPORT
        with self.assertRaises(ValidationError) as error:
            self.booking.full_clean()
        self.assertIn("destination_airport_terminal", error.exception.message_dict)
        self.assertIn("destination_flight_departure_time", error.exception.message_dict)

    def test_first_booking_created_subsequent_date(self):
        self.save_booking_with_frozen_created_at()
        with freeze_time(self.booking.created_at + timedelta(days=1)):
            booking2 = OneWayBookingFactory.create(
                account=self.account,
                vehicle_class=VehicleClass.objects.get(title="Any Class"),
                vehicle_color=VehicleColor.objects.get(title="Black"),
                created_by=self.creator,
                client_user=self.creator,
                from_address=self.from_address,
                from_address_type=BookingAddressType.HOME,
                destination_address=self.destination_address,
                destination_address_type=BookingAddressType.OFFICE,
                travel_on=self.booking.travel_on + timedelta(days=-1),
            )
        self.assertEqual(
            booking2.created_at, self.booking.created_at + timedelta(days=1)
        )
        self.assertTrue(
            self.booking.is_first_booking(),
            "Failed to detect first booking as first booking",
        )
        self.assertFalse(booking2.is_first_booking(), "Failed to detect prior booking")

    def test_first_booking_created_same_date_with_subsequent_travel_on(self):
        self.save_booking_with_frozen_created_at()
        with freeze_time(self.booking.created_at + timedelta(minutes=15)):
            booking2 = OneWayBookingFactory.create(
                account=self.account,
                vehicle_class=VehicleClass.objects.get(title="Any Class"),
                vehicle_color=VehicleColor.objects.get(title="Black"),
                created_by=self.creator,
                client_user=self.creator,
                from_address=self.from_address,
                from_address_type=BookingAddressType.HOME,
                destination_address=self.destination_address,
                destination_address_type=BookingAddressType.OFFICE,
                travel_on=self.booking.travel_on + timedelta(days=1),
            )
        self.assertTrue(
            self.booking.is_first_booking(),
            "Failed to detect first booking as first booking",
        )
        self.assertFalse(booking2.is_first_booking(), "Failed to detect prior booking")

    def test_first_booking_created_same_date_with_same_travel_on(self):
        self.save_booking_with_frozen_created_at()
        with freeze_time(self.booking.created_at + timedelta(minutes=15)):
            booking2 = OneWayBookingFactory.create(
                account=self.account,
                vehicle_class=VehicleClass.objects.get(title="Any Class"),
                vehicle_color=VehicleColor.objects.get(title="Black"),
                created_by=self.creator,
                client_user=self.creator,
                from_address=self.from_address,
                from_address_type=BookingAddressType.HOME,
                destination_address=self.destination_address,
                destination_address_type=BookingAddressType.OFFICE,
                travel_on=self.booking.travel_on,
            )
        self.assertTrue(
            self.booking.is_first_booking(),
            "Failed to detect first booking as first booking",
        )
        self.assertFalse(booking2.is_first_booking(), "Failed to detect prior booking")

    def test_first_booking_same_created_and_travel_on(self):
        self.save_booking_with_frozen_created_at()
        with freeze_time(self.booking.created_at):
            booking2 = OneWayBookingFactory.create(
                account=self.account,
                vehicle_class=VehicleClass.objects.get(title="Any Class"),
                vehicle_color=VehicleColor.objects.get(title="Black"),
                created_by=self.creator,
                client_user=self.creator,
                from_address=self.from_address,
                from_address_type=BookingAddressType.HOME,
                destination_address=self.destination_address,
                destination_address_type=BookingAddressType.OFFICE,
                travel_on=self.booking.travel_on,
            )
        self.assertFalse(
            self.booking.is_first_booking(), "Failed to detect simultaneous bookings"
        )
        self.assertFalse(
            booking2.is_first_booking(), "Failed to detect simultaneous bookings"
        )

    def test_hourly_booking_duration(self):
        booking = HourlyBookingFactory.build(
            travel_on=make_aware(datetime.now() + timedelta(days=2)),
            hourly_booking_duration=timedelta(hours=MAX_BOOKING_DURATION_HOURS + 1),
        )
        with self.assertRaises(ValidationError) as error:
            booking.clean()
        self.assertIn("hourly_booking_duration", error.exception.message_dict)
        booking.hourly_booking_duration = timedelta(
            hours=MIN_BOOKING_DURATION_HOURS - 1
        )
        with self.assertRaises(ValidationError) as error:
            booking.clean()
        self.assertIn("hourly_booking_duration", error.exception.message_dict)

        booking.hourly_booking_duration = timedelta(hours=MAX_BOOKING_DURATION_HOURS)
        booking.clean()

    def test_required_lead_time_in_hours(self):
        reference_time = make_aware(
            datetime(year=2019, month=8, day=2, hour=12, minute=0)
        )
        with freeze_time(reference_time):
            booking = HourlyBookingFactory.build(
                travel_on=reference_time + BOOKING_LEAD_TIME - timedelta(minutes=1)
            )
            with self.assertRaises(ValidationError) as error:
                with raise_validation_errors() as ve:
                    booking.validate_lead_time(ve)
            self.assertEqual(error.exception.message, BOOKING_TOO_CLOSE_ERROR_MESSAGE)
            booking.travel_on = reference_time + BOOKING_LEAD_TIME
            booking.clean()

            booking.travel_on = reference_time + timedelta(days=1)
            booking.clean()

    def test_required_lead_time_out_of_hours(self):
        reference_time = make_aware(
            datetime.combine(
                date(year=2019, month=8, day=2), BOOKING_LEAD_TIME_OOH_START
            )
        )
        with freeze_time(reference_time):
            # Time is 10pm, attempt to book for 10.45pm => soonest is 6am on 3 August
            day_type = get_day_type(reference_time.date())
            self.assertEqual(
                BookingLeadTime.get_lead_time_for(
                    day_type=day_type, hour=(reference_time + BOOKING_LEAD_TIME).hour
                ),
                timedelta(hours=8),
            )
            booking = HourlyBookingFactory.build(
                travel_on=reference_time + BOOKING_LEAD_TIME
            )
            with self.assertRaises(ValidationError) as error:
                with raise_validation_errors() as ve:
                    booking.validate_lead_time(ve)
            self.assertEqual(error.exception.message, BOOKING_TOO_CLOSE_ERROR_MESSAGE)
            booking.travel_on = (
                reference_time + BOOKING_LEAD_TIME_OOH - timedelta(minutes=1)
            )
            with self.assertRaises(ValidationError) as error:
                with raise_validation_errors() as ve:
                    booking.validate_lead_time(ve)
            self.assertEqual(error.exception.message, BOOKING_TOO_CLOSE_ERROR_MESSAGE)
            booking.travel_on = reference_time + BOOKING_LEAD_TIME_OOH
            booking.clean()

            booking.travel_on = (reference_time + BOOKING_LEAD_TIME) + timedelta(days=1)
            booking.clean()

        reference_time = make_aware(
            datetime.combine(date(year=2019, month=8, day=2), BOOKING_LEAD_TIME_OOH_END)
            - timedelta(hours=1)
        )
        with freeze_time(reference_time):
            # Booking at 6am for 6.45am => soonest is 2pm
            booking = HourlyBookingFactory.build(
                travel_on=reference_time + BOOKING_LEAD_TIME
            )
            with self.assertRaises(ValidationError) as error:
                with raise_validation_errors() as ve:
                    booking.validate_lead_time(ve)
            self.assertEqual(error.exception.message, BOOKING_TOO_CLOSE_ERROR_MESSAGE)
            booking.travel_on = (
                reference_time + BOOKING_LEAD_TIME_OOH - timedelta(minutes=1)
            )
            with self.assertRaises(ValidationError) as error:
                with raise_validation_errors() as ve:
                    booking.validate_lead_time(ve)
            self.assertEqual(error.exception.message, BOOKING_TOO_CLOSE_ERROR_MESSAGE)
            booking.travel_on = reference_time + BOOKING_LEAD_TIME_OOH
            booking.clean()

            booking.travel_on = (reference_time + BOOKING_LEAD_TIME) + timedelta(days=1)
            booking.clean()

    def test_past_record_validation(self):
        booking = HourlyBookingFactory.build(
            travel_on=make_aware(datetime.now() + timedelta(minutes=-5))
        )
        with self.assertRaises(ValidationError) as error:
            with raise_validation_errors() as ve:
                booking.validate_lead_time(ve)
        self.assertEqual(error.exception.message, BOOKING_PAST_ERROR_MESSAGE)

    def test_passenger_limit(self):
        max_passenger_count = 29
        VehicleClassFactory(max_passenger_count=max_passenger_count)
        min_class = VehicleClassFactory(max_passenger_count=1)
        booking = HourlyBookingFactory.build(
            passenger_count=max_passenger_count + 1,
            travel_on=make_aware(datetime.now() + timedelta(days=2)),
        )
        # Without selecting vehicle_class limit should be greatest available
        with self.assertRaises(ValidationError) as error:
            booking.clean()
        self.assertIn("passenger_count", error.exception.message_dict)
        booking.passenger_count = max_passenger_count
        booking.clean()
        # Once selected vehicle_class limit should match vehicle
        booking.vehicle_class = min_class
        with self.assertRaises(ValidationError) as error:
            booking.clean()
        self.assertIn("passenger_count", error.exception.message_dict)
        booking.passenger_count = 1
        booking.clean()

    def test_interstate_sorting(self):
        interstate_from_address = AddressFactory.create(
            formatted_address="328 Swanston Street, Melbourne VIC 3000",
            postal_code="2000",
            source_id="sourceid1",
        )
        interstate_destination_address = AddressFactory.create(
            formatted_address="234 Whitehorse Road, Nunawading VIC 3130",
            postal_code="2130",
            source_id="sourceid2",
        )
        reference_time = make_aware(
            datetime(year=2019, month=7, day=20, hour=12, minute=0)
        )
        with freeze_time(reference_time):
            OneWayBookingFactory.create(
                account=self.account,
                vehicle_class=VehicleClass.objects.get(title="Any Class"),
                vehicle_color=VehicleColor.objects.get(title="Black"),
                created_by=self.creator,
                client_user=self.creator,
                from_address=self.from_address,
                from_address_type=BookingAddressType.HOME,
                destination_address=self.destination_address,
                destination_address_type=BookingAddressType.OFFICE,
                travel_on=make_aware(
                    datetime(year=2019, month=8, day=2, hour=12, minute=0)
                ),
            )
            OneWayBookingFactory.create(
                account=self.account,
                vehicle_class=VehicleClass.objects.get(title="Any Class"),
                vehicle_color=VehicleColor.objects.get(title="Black"),
                created_by=self.creator,
                client_user=self.creator,
                from_address=self.from_address,
                from_address_type=BookingAddressType.HOME,
                destination_address=self.destination_address,
                destination_address_type=BookingAddressType.OFFICE,
                travel_on=make_aware(
                    datetime(year=2019, month=8, day=2, hour=13, minute=0)
                ),
            )
            OneWayBookingFactory.create(
                account=self.account,
                vehicle_class=VehicleClass.objects.get(title="Any Class"),
                vehicle_color=VehicleColor.objects.get(title="Black"),
                created_by=self.creator,
                client_user=self.creator,
                from_address=interstate_from_address,
                from_address_type=BookingAddressType.HOME,
                destination_address=interstate_destination_address,
                destination_address_type=BookingAddressType.OFFICE,
                travel_on=make_aware(
                    datetime(year=2019, month=8, day=2, hour=12, minute=0)
                ),
            )
            OneWayBookingFactory.create(
                account=self.account,
                vehicle_class=VehicleClass.objects.get(title="Any Class"),
                vehicle_color=VehicleColor.objects.get(title="Black"),
                created_by=self.creator,
                client_user=self.creator,
                from_address=interstate_from_address,
                from_address_type=BookingAddressType.HOME,
                destination_address=interstate_destination_address,
                destination_address_type=BookingAddressType.OFFICE,
                travel_on=make_aware(
                    datetime(year=2019, month=8, day=2, hour=13, minute=0)
                ),
            )
        ordered_bookings = list(Booking.objects.sort_by_interstate())
        self.assertIsInstance(ordered_bookings[0], Booking)
        self.assertTrue(
            ordered_bookings[0].is_interstate(),
            "First returned booking should be interstate",
        )
        self.assertTrue(
            ordered_bookings[1].is_interstate(),
            "Second returned booking should be interstate",
        )
        self.assertLessEqual(
            ordered_bookings[0].travel_on,
            ordered_bookings[1].travel_on,
            "Bookings within a state class should be returned by ascending travel_on",
        )
        self.assertFalse(
            ordered_bookings[2].is_interstate(),
            "Third returned booking should not be interstate",
        )
        self.assertFalse(
            ordered_bookings[3].is_interstate(),
            "Fourth returned booking should not be interstate",
        )
        self.assertLessEqual(
            ordered_bookings[2].travel_on,
            ordered_bookings[3].travel_on,
            "Bookings within a state class should be returned by ascending travel_on",
        )

    @mock_raw_distance(
        {
            (MELBOURNE_GPO_PLACE_ID, "sourceid1"): Decimal("20.0"),
            (MELBOURNE_GPO_PLACE_ID, "sourceid2"): Decimal("18.0"),
            (MELBOURNE_GPO_PLACE_ID, "sourceid6"): Decimal("76.0"),
            (MELBOURNE_GPO_PLACE_ID, "sourceid7"): Decimal("120.0"),
        }
    )
    def test_is_out_of_area(self):
        PriceList.get_current()
        from_address = AddressFactory.create(
            formatted_address="Geelong VIC 3000",
            postal_code="3300",
            source_id="sourceid6",
        )
        destination_address = AddressFactory.create(
            formatted_address="Ballarat VIC 3000",
            postal_code="3500",
            source_id="sourceid7",
        )
        booking1 = OneWayBookingFactory.create(
            account=self.account,
            vehicle_class=VehicleClass.objects.get(title="Any Class"),
            vehicle_color=VehicleColor.objects.get(title="Black"),
            created_by=self.creator,
            client_user=self.creator,
            from_address=from_address,
            from_address_type=BookingAddressType.HOME,
            destination_address=destination_address,
            destination_address_type=BookingAddressType.OFFICE,
            travel_on=make_aware(
                datetime(year=2019, month=8, day=2, hour=13, minute=0)
            ),
            out_of_area=None,
        )
        self.assertTrue(booking1.is_out_of_area())
        booking2 = HourlyBookingFactory.create(
            account=self.account,
            vehicle_class=VehicleClass.objects.get(title="Any Class"),
            vehicle_color=VehicleColor.objects.get(title="Black"),
            created_by=self.creator,
            client_user=self.creator,
            from_address=from_address,
            from_address_type=BookingAddressType.HOME,
            travel_on=make_aware(
                datetime(year=2019, month=8, day=2, hour=13, minute=0)
            ),
            out_of_area=None,
        )
        self.assertTrue(booking2.is_out_of_area())
        self.booking.save()
        self.assertFalse(self.booking.is_out_of_area())

    def test_item_cancellation(self):
        """
        Tests that attempting to delete a booking instead cancels it
        """
        self.assertEqual(Booking.objects.count(), 1)
        booking = OneWayBookingFactory.create(
            account=self.account,
            vehicle_class=VehicleClass.objects.get(title="Any Class"),
            vehicle_color=VehicleColor.objects.get(title="Black"),
            created_by=self.creator,
            client_user=self.creator,
            from_address=self.from_address,
            from_address_type=BookingAddressType.HOME,
            destination_address=self.destination_address,
            destination_address_type=BookingAddressType.OFFICE,
            travel_on=make_aware(
                datetime(year=2019, month=8, day=2, hour=13, minute=0)
            ),
        )
        self.assertEqual(Booking.objects.count(), 2)
        self.assertEqual(
            Booking.objects.filter(booking_status=BookingStatus.CANCELLED).count(), 0
        )

        booking.delete()
        self.assertEqual(Booking.objects.count(), 2)
        self.assertEqual(
            Booking.objects.filter(booking_status=BookingStatus.CANCELLED).count(), 1
        )

    def test_queryset_cancellation(self):
        self.assertEqual(Booking.objects.count(), 1)
        booking = OneWayBookingFactory.create(
            account=self.account,
            vehicle_class=VehicleClass.objects.get(title="Any Class"),
            vehicle_color=VehicleColor.objects.get(title="Black"),
            created_by=self.creator,
            client_user=self.creator,
            from_address=self.from_address,
            from_address_type=BookingAddressType.HOME,
            destination_address=self.destination_address,
            destination_address_type=BookingAddressType.OFFICE,
            travel_on=make_aware(
                datetime(year=2019, month=8, day=2, hour=13, minute=0)
            ),
        )
        self.assertEqual(Booking.objects.count(), 2)
        self.assertEqual(
            Booking.objects.filter(booking_status=BookingStatus.CANCELLED).count(), 0
        )
        Booking.objects.filter(id=booking.id).delete()
        self.assertEqual(Booking.objects.count(), 2)
        self.assertEqual(
            Booking.objects.filter(booking_status=BookingStatus.CANCELLED).count(), 1
        )

    @mock.patch("scbp_core.models.booking.send_cancellation_to_driver")
    def test_driver_cancellation_sms_sent_on_cancellation(self, send_cancellation_mock):
        driver = DriverFactory(
            mobile="0400000000",
        )
        booking = OneWayBookingFactory.create(
            account=self.account,
            vehicle_class=VehicleClass.objects.get(title="Any Class"),
            vehicle_color=VehicleColor.objects.get(title="Black"),
            created_by=self.creator,
            client_user=self.creator,
            from_address=self.from_address,
            from_address_type=BookingAddressType.HOME,
            destination_address=self.destination_address,
            destination_address_type=BookingAddressType.OFFICE,
            travel_on=make_aware(
                datetime(year=2019, month=8, day=2, hour=13, minute=0)
            ),
            driver=driver,
        )

        booking.booking_status = BookingStatus.CANCELLED
        booking.save()

        send_cancellation_mock.assert_called_once_with(booking, driver)

    @mock.patch("scbp_core.models.booking.send_cancellation_to_driver")
    def test_driver_cancellation_sms_not_sent_on_change(self, send_cancellation_mock):
        driver = DriverFactory(
            mobile="0400000000",
        )
        booking = OneWayBookingFactory.create(
            account=self.account,
            vehicle_class=VehicleClass.objects.get(title="Any Class"),
            vehicle_color=VehicleColor.objects.get(title="Black"),
            created_by=self.creator,
            client_user=self.creator,
            from_address=self.from_address,
            from_address_type=BookingAddressType.HOME,
            destination_address=self.destination_address,
            destination_address_type=BookingAddressType.OFFICE,
            travel_on=make_aware(
                datetime(year=2019, month=8, day=2, hour=13, minute=0)
            ),
            driver=driver,
        )

        booking.booking_status = BookingStatus.CHANGED
        booking.save()

        send_cancellation_mock.assert_not_called()
