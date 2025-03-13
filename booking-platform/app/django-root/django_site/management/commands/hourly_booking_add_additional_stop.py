from django.core.management import BaseCommand

from scbp_core.models import Booking
from scbp_core.models import BookingType
from scbp_core.tests.factory.booking import AddressFactory


class Command(BaseCommand):
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

    def handle(self, *app_labels, **options):
        for booking in Booking.objects.filter(
            booking_type=BookingType.HOURLY, additional_stops__isnull=True
        ):
            self._create_additional_stop_for_hourly_bookings(booking)
