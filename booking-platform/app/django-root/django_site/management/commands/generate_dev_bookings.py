from datetime import datetime
from datetime import timedelta
import itertools
import random
from unittest import mock

from django.core.management import BaseCommand
from django.db import connection
from django.db.models import Max
from pytz import timezone

from scbp_core.models import Booking
from scbp_core.models import BookingStatus
from scbp_core.models import ClientUser
from scbp_core.models import VehicleClass
from scbp_core.models import VehicleColor
from scbp_core.services.places import MELBOURNE_GPO_PLACE_ID
from scbp_core.services.pricing import PriceCalculator
from scbp_core.tests.factory.booking import AddressFactory
from scbp_core.tests.factory.booking import HourlyBookingFactory
from scbp_core.tests.factory.booking import OneWayBookingFactory


class Command(BaseCommand):
    # Date/time utility functions
    @staticmethod
    def _get_dates():
        start_date = timezone("Australia/Melbourne").localize(
            datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
        )
        return [start_date + timedelta(days=i) for i in range(1, 15)]

    @staticmethod
    def _choose_time(raw_datetime, *, hour=None):
        hour = hour or random.randint(6, 20)
        minute = random.randrange(0, 60, 5)
        return raw_datetime.replace(hour=hour, minute=minute)

    @staticmethod
    def _choose_duration():
        hours = random.randint(1, 8)
        minutes = random.randrange(0, 60, 10)
        return timedelta(hours=hours, minutes=minutes)

    # Addresses
    @staticmethod
    def _interstate_address_params():
        return [
            {
                "source_id": "ChIJ3S-JXmauEmsRUcIaWtf4MzE",
                "formatted_address": "Sydney Opera House, Bennelong Point, Sydney NSW 2000",
                "postal_code": "2000",
                "lat": 0.0,
                "long": 0.0,
                "place_name": "Sydney Opera House",
                "suburb": "Sydney",
                "address_details": {},
            },
            {
                "source_id": "ChIJg1nDnXatEmsR7OwhLNpKeWY",
                "formatted_address": "Ben Buckler Point, 158 Brighton Blvd, North Bondi NSW 2026",
                "postal_code": "2026",
                "lat": 0.0,
                "long": 0.0,
                "place_name": "Ben Buckeler Point",
                "suburb": "North Bondi",
                "address_details": {},
            },
        ]

    @staticmethod
    def _metro_address_params():
        return [
            # Melbourne GPO, Melbourne CBD
            {
                "source_id": MELBOURNE_GPO_PLACE_ID,
                "formatted_address": "350 Bourke St, Melbourne VIC 3000",
                "postal_code": "3000",
                "lat": 0.0,
                "long": 0.0,
                "place_name": "Melbourne GPO",
                "suburb": "Melbourne",
                "address_details": {},
            },
            # Camberwell Place, Camberwell
            {
                "source_id": "ChIJL_MrvoNB1moRNem-PT2uQJQ",
                "formatted_address": "793 Burke Road, Camberwell VIC 3124",
                "postal_code": "3124",
                "lat": 0.0,
                "long": 0.0,
                "place_name": "Camberwell Place",
                "suburb": "Camberwell",
                "address_details": {},
            },
            # Box Hill Central, Box Hill
            {
                "source_id": "ChIJ34_ST7dA1moRb4taFWxfD5c",
                "formatted_address": "1 Main Street, Box Hill VIC 3128",
                "postal_code": "3128",
                "lat": 0.0,
                "long": 0.0,
                "place_name": "Box Hill Central",
                "suburb": "Box Hill",
                "address_details": {},
            },
            # Alliance Software, Nunawading
            {
                "source_id": "ChIJi7iHMsk41moR_7dXVxseiZ4",
                "formatted_address": "234 Whitehorse Road, Nunawading VIC 3131",
                "postal_code": "3131",
                "lat": 0.0,
                "long": 0.0,
                "place_name": "Alliance Software",
                "suburb": "Nunawading",
                "address_details": {},
            },
            # Eastland Shopping Centre, Ringwood
            {
                "source_id": "ChIJ06ObLtQ71moR0NAyBXZWBA8",
                "formatted_address": "175 Maroondah Highway, Ringwood VIC 3134",
                "postal_code": "3134",
                "lat": 0.0,
                "long": 0.0,
                "place_name": "Eastland Shopping Centre",
                "suburb": "Ringwood",
                "address_details": {},
            },
            # Chadstone Shopping Centre, Chadstone
            {
                "source_id": "ChIJPylMBWZq1moRYNQyBXZWBA8",
                "formatted_address": "Chadstone Shopping Centre, 1341 Dandenong Rd, Chadstone VIC 3148",
                "postal_code": "3148",
                "lat": 0.0,
                "long": 0.0,
                "place_name": "Chadstone Shopping Centre",
                "suburb": "Chadstone",
                "address_details": {},
            },
        ]

    @staticmethod
    def _out_of_area_address_params():
        return [
            # GMHBA Stadium, Geelong
            {
                "source_id": "ChIJMcB8AA0U1GoRdxavr3PxtVQ",
                "formatted_address": "GMHBA Stadium, 370 Moorabool St, South Geelong VIC 3220",
                "postal_code": "3220",
                "lat": 0.0,
                "long": 0.0,
                "place_name": "GMHBA Stadium",
                "suburb": "South Geelong",
                "address_details": {},
            },
            # Ballarat Tramway Museum, Ballarat
            {
                "source_id": "ChIJbXY7w39D0WoR7YX2XG-_uEM",
                "formatted_address": "Ballarat Tramway Museum, 100 Gillies St North, Ballarat VIC 3350",
                "postal_code": "3350",
                "lat": 0.0,
                "long": 0.0,
                "place_name": "Ballarat Tramway Museum",
                "suburb": "Ballarat",
                "address_details": {},
            },
            # Latrobe Regional Airport, Morwell
            {
                "source_id": "ChIJhW0ncqYiKWsR9OkBKiFY-kw",
                "formatted_address": "Latrobe Regional Airport, 75 Airfield Rd, Morwell VIC 3840",
                "postal_code": "3840",
                "lat": 0.0,
                "long": 0.0,
                "place_name": "Latrobe Regional Airport",
                "suburb": "Morwell",
                "address_details": {},
            },
        ]

    def _address_params(self):
        return self._metro_address_params() + self._out_of_area_address_params()

    # Booking creators
    def _create_booking_common_params(self):
        """
        :return: Parameters common to all bookings
        """
        client = ClientUser.objects.first()
        return {
            "created_by": client,
            "client_user": client,
            "account": client.accounts.first(),
        }

    @staticmethod
    def _any_vehicle_class_params():
        """
        :return: Parameter object to assign 'Any Class' to a booking
        """
        return {"vehicle_class": VehicleClass.objects.filter(is_any_class=True).first()}

    def _is_booking_option_param_invalid(self, booking_option_param):
        """
        Determines whether a given set of options is invalid
        Used only in _create_booking_option_params
        :param booking_option_param: The options - [VehicleClass, Optional(VehicleColor), Int, Int, Int, Boolean]
            The three integers are the forward facing seat count, rear facing seat count, and booster seat count
            respectively. The boolean is whether ribbons are requested
        :return: True if the number of seats exceeds the available seats for the vehicle class or the color is not
            available for the vehicle class, False otherwise
        """
        [
            vehicle_class,
            vehicle_color,
            forward_seats,
            rear_seats,
            booster_seats,
            _,
        ] = booking_option_param
        return vehicle_color not in vehicle_class.available_colors.all() or (
            forward_seats + rear_seats + booster_seats
            > vehicle_class.max_child_seat_count
        )

    def _create_booking_option_params(self):
        """
        Construct all of the possible booking options
        :return: an iterator with all of the possible sets of options
        """
        keys = [
            "vehicle_class",
            "vehicle_color",
            "forward_facing_baby_seat_count",
            "rear_facing_baby_seat_count",
            "booster_seat_count",
            "requires_wedding_ribbons",
        ]
        max_child_seats = VehicleClass.objects.aggregate(Max("max_child_seat_count"))[
            "max_child_seat_count__max"
        ]
        for instance in itertools.filterfalse(
            self._is_booking_option_param_invalid,
            itertools.product(
                VehicleClass.objects.all(),
                itertools.chain([None], VehicleColor.objects.all()),
                range(max_child_seats),
                range(max_child_seats),
                range(max_child_seats),
                [True, False],
            ),
        ):
            data = dict(zip(keys, instance))
            data["child_under8_count"] = (
                data["booster_seat_count"]
                + data["rear_facing_baby_seat_count"]
                + data["forward_facing_baby_seat_count"]
            )
            yield data

    def _create_interstate_bookings(self, date):
        # Create two bookings, one in each direction between Sydney Opera House and Ben Buckler Point near Bondi beach
        for pickup, dropoff in itertools.permutations(
            self._interstate_address_params(), 2
        ):
            OneWayBookingFactory.create(
                from_address=AddressFactory.create(**pickup),
                destination_address=AddressFactory.create(**dropoff),
                travel_on=self._choose_time(date),
                booking_status=BookingStatus.VERIFIED,
                **self._create_booking_common_params(),
                **self._any_vehicle_class_params(),
            )

    def _create_tba_bookings(self, date):
        # Create eight bookings with different Victoria endpoints
        for pickup, dropoff in random.sample(
            list(itertools.permutations(self._address_params(), 2)), 8
        ):
            OneWayBookingFactory.create(
                from_address=AddressFactory.create(**pickup),
                destination_address=AddressFactory.create(**dropoff),
                travel_on=self._choose_time(date),
                booking_status=BookingStatus.VERIFIED,
                is_time_tba=True,
                **self._create_booking_common_params(),
                **self._any_vehicle_class_params(),
            )

    def _create_out_of_area_bookings(self, date):
        # Create 12 bookings with out of area Victoria endpoints
        # (2 per pair per direction)
        option_params = list(self._create_booking_option_params())
        for pickup, dropoff in itertools.permutations(
            self._out_of_area_address_params(), 2
        ):
            # Create booking without options
            OneWayBookingFactory.create(
                from_address=AddressFactory.create(**pickup),
                destination_address=AddressFactory.create(**dropoff),
                travel_on=self._choose_time(date),
                booking_status=BookingStatus.VERIFIED,
                out_of_area=True,
                **self._create_booking_common_params(),
                **self._any_vehicle_class_params(),
            )
            # Create booking with random options
            OneWayBookingFactory.create(
                from_address=AddressFactory.create(**pickup),
                destination_address=AddressFactory.create(**dropoff),
                travel_on=self._choose_time(date),
                booking_status=BookingStatus.VERIFIED,
                out_of_area=True,
                **random.choice(option_params),
                **self._create_booking_common_params(),
            )

    def _create_additional_stop_for_hourly_bookings(self, booking):
        # Use MCG as additional stop
        additional_stop_params = {
            "source_id": "ChIJgWIaV5VC1moR-bKgR9ZfV2M",
            "formatted_address": "Brunton Avenue, Richmond VIC 3002",
            "postal_code": "3002",
            "lat": 0.0,
            "long": 0.0,
            "place_name": "Melbourne Cricket Ground",
            "suburb": "Richmond",
            "address_details": {},
        }
        stop = AddressFactory.create(**additional_stop_params)
        booking.additional_stops.add(stop, through_defaults={"stop_number": 1})

    def _create_hourly_bookings(self, date):
        # Create 36 hourly bookings (4 per pickup address)
        option_params = list(self._create_booking_option_params())

        for pickup in self._address_params():
            # Create booking without options or destination address
            booking = HourlyBookingFactory.create(
                from_address=AddressFactory.create(**pickup),
                travel_on=self._choose_time(date),
                booking_status=BookingStatus.VERIFIED,
                hourly_booking_duration=self._choose_duration(),
                **self._create_booking_common_params(),
                **self._any_vehicle_class_params(),
            )
            self._create_additional_stop_for_hourly_bookings(booking)
            # Create booking without options with destination address
            booking = HourlyBookingFactory.create(
                from_address=AddressFactory.create(**pickup),
                destination_address=AddressFactory.create(
                    **random.choice(
                        [
                            address
                            for address in self._address_params()
                            if address != pickup
                        ]
                    )
                ),
                travel_on=self._choose_time(date),
                booking_status=BookingStatus.VERIFIED,
                hourly_booking_duration=self._choose_duration(),
                **self._create_booking_common_params(),
                **self._any_vehicle_class_params(),
            )
            self._create_additional_stop_for_hourly_bookings(booking)
            # Create booking with options without destination address
            booking = HourlyBookingFactory.create(
                from_address=AddressFactory.create(**pickup),
                travel_on=self._choose_time(date),
                booking_status=BookingStatus.VERIFIED,
                hourly_booking_duration=self._choose_duration(),
                **random.choice(option_params),
                **self._create_booking_common_params(),
            )
            self._create_additional_stop_for_hourly_bookings(booking)
            # Create booking with options and destination address
            booking = HourlyBookingFactory.create(
                from_address=AddressFactory.create(**pickup),
                destination_address=AddressFactory.create(
                    **random.choice(
                        [
                            address
                            for address in self._address_params()
                            if address != pickup
                        ]
                    )
                ),
                travel_on=self._choose_time(date),
                booking_status=BookingStatus.VERIFIED,
                hourly_booking_duration=self._choose_duration(),
                **random.choice(option_params),
                **self._create_booking_common_params(),
            )
            self._create_additional_stop_for_hourly_bookings(booking)

    def _create_option_bookings(self, date):
        # Create 100 bookings with randomly chosen options
        for option_params in random.sample(
            list(self._create_booking_option_params()), 100
        ):
            pickup, dropoff = random.sample(self._metro_address_params(), 2)
            booking_status = random.choice(
                [
                    status
                    for status, _ in BookingStatus.choices.items()
                    if status
                    not in [
                        BookingStatus.CANCELLED,
                        BookingStatus.COMPLETED,
                        BookingStatus.UNVERIFIED,
                        BookingStatus.CHANGED,
                    ]
                ]
            )
            OneWayBookingFactory.create(
                from_address=AddressFactory.create(**pickup),
                destination_address=AddressFactory.create(**dropoff),
                travel_on=self._choose_time(date),
                booking_status=booking_status,
                **self._create_booking_common_params(),
                **option_params,
            )

    def _create_standard_bookings(self, date):
        # Create 42 bookings within the metro area without options
        for _ in range(42):
            pickup, dropoff = random.sample(self._metro_address_params(), 2)
            OneWayBookingFactory.create(
                from_address=AddressFactory.create(**pickup),
                destination_address=AddressFactory.create(**dropoff),
                travel_on=self._choose_time(date),
                booking_status=random.choice(
                    [
                        status
                        for status, _ in BookingStatus.choices.items()
                        if status
                        not in [
                            BookingStatus.CANCELLED,
                            BookingStatus.COMPLETED,
                            BookingStatus.UNVERIFIED,
                            BookingStatus.CHANGED,
                        ]
                    ]
                ),
                **self._any_vehicle_class_params(),
                **self._create_booking_common_params(),
            )

    # Add price lists to bookings
    def _add_price_list_to_bookings(self):
        print(  # noqa
            f"Adding prices to {Booking.objects.filter(price_total__isnull=True).count()} bookings"
        )
        for booking in Booking.objects.filter(price_total__isnull=True):
            price_calculator = PriceCalculator(booking, booking.price_list)
            booking.update_from_calculator(price_calculator)
            booking.save()

    # Command handler
    def add_arguments(self, parser):
        parser.add_argument(
            "--delete-existing", action="store_true", help="Delete existing bookings"
        )
        parser.add_argument(
            "--update-price-only",
            action="store_true",
            help="Update price lists for existing bookings without creating new bookings",
        )

    def handle(self, *app_labels, **options):
        if options.get("delete_existing", None):
            print("Deleting bookings")  # noqa
            # .delete on booking soft deletes so make sure we hard delete here
            with connection.cursor() as cursor:
                cursor.execute("DELETE FROM scbp_core_booking")
        # We mock out the booking confirmation email and driver cancellation SMS messages to
        # ensure no emails or SMS messages are sent (the driver cancellation is more future-proofing
        # as there appears to be no driver attached to any of these bookings)
        with mock.patch("scbp_core.models.booking.send_booking_confirmation_email"):
            with mock.patch("scbp_core.models.booking.send_cancellation_to_driver"):
                if not options.get("update_price_only", None):
                    for date in self._get_dates():
                        print(  # noqa
                            f'Adding bookings for {date.strftime("%B %d, %Y")}'
                        )  # noqa
                        self._create_interstate_bookings(date)
                        self._create_tba_bookings(date)
                        self._create_out_of_area_bookings(date)
                        self._create_hourly_bookings(date)
                        self._create_option_bookings(date)
                        self._create_standard_bookings(date)
                self._add_price_list_to_bookings()
