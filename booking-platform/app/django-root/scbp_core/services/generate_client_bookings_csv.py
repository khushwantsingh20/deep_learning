from csv import writer

from django.http import HttpResponse
from django.utils import timezone

from scbp_core.models import BookingType


def _get_passenger_abbreviated_name(instance):
    if instance.passenger:
        first_name = instance.passenger.first_name
        if first_name:
            if not instance.passenger.last_name:
                return first_name
            return f"{first_name[0]}. {instance.passenger.last_name}"
        if instance.passenger.last_name:
            return instance.passenger.last_name
        return instance.passenger.email
    else:
        return instance.passenger_name


def _get_client_abbreviated_name(instance):
    if instance.client_user.first_name and instance.client_user.last_name:
        return f"{instance.client_user.first_name[0]}. {instance.client_user.last_name}"
    # This will return whichever is set of first name or last name
    return instance.client_user.get_full_name()


def generate_client_bookings_csv(file_name, bookings):
    response = HttpResponse(
        content_type="text/csv",
    )
    response["Content-Disposition"] = f'attachment; filename="{file_name}"'
    csv_writer = writer(response)
    csv_writer.writerow(
        [
            "Time",
            "Date",
            "Booking Number",
            "Booking Status",
            "Passenger",
            "Passenger count",
            "Pick up",
            "Destination",
            "Booked by",
            "Vehicle class",
            "Cost",
        ]
    )
    for booking in bookings:
        destination = (
            booking.destination_address.suburb
            if booking.booking_type is BookingType.ONE_WAY
            else f"Duration: {booking.hourly_booking_duration}"
        )

        csv_writer.writerow(
            [
                timezone.localtime(booking.travel_on).strftime("%-I:%M %p"),
                timezone.localtime(booking.travel_on).strftime("%a, %-d %b %Y"),
                booking.booking_number,
                booking.get_booking_status_display(),
                _get_passenger_abbreviated_name(booking),
                booking.passenger_count,
                booking.from_address.suburb,
                destination,
                _get_client_abbreviated_name(booking),
                booking.vehicle_class,
                booking.price_total,
            ]
        )
    return response
