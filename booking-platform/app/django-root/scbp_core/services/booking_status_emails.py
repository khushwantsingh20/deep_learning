from decimal import Decimal

from django.conf import settings
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.utils import timezone

from scbp_core.models.booking_field_choices import BookingAddressType
from scbp_core.models.booking_field_choices import BookingType
from scbp_core.services.formatters import deduplicate_place_name
from scbp_core.services.formatters import formatted_address_no_state
from scbp_core.services.formatters import formatted_hourly_destination
from scbp_core.services.pricing_breakdown import get_client_facing_breakdown
from scbp_core.services.send_sms import send_sms


def send_booking_confirmation_email(booking, email_to):
    # Email parameters
    email_subject = f"{timezone.localtime(booking.travel_on).strftime('%-I:%M%p %a %-d %b')} - {booking.from_address.suburb} booking confirmed"
    to = email_to
    currency_format = "$%.2f"

    # Booking info parameters
    if booking.from_address_type != BookingAddressType.AIRPORT:
        if booking.from_address.place_name:
            from_address = f"{deduplicate_place_name(booking.from_address.place_name, booking.from_address.formatted_address)} {formatted_address_no_state(booking.from_address.formatted_address)}"
        else:
            from_address = formatted_address_no_state(
                booking.from_address.formatted_address
            )
    else:
        parts = ["Melbourne Airport"]
        if booking.from_airport_driver_required_on_landing:
            prefix = (
                f"{booking.from_flight_number} - " if booking.from_flight_number else ""
            )
            parts.append(f"{prefix}from landing time")
        else:
            if booking.from_flight_number:
                parts.append(booking.from_flight_number)
            if booking.from_airport_arrival_after_landing:
                parts.append(f"plus {booking.from_airport_arrival_after_landing} mins")
        from_address = ",\n".join(parts)

    destination_address = "As Advised"

    if booking.destination_address:
        if booking.destination_address_type != BookingAddressType.AIRPORT:
            if booking.destination_address.place_name:
                destination_address = f"{deduplicate_place_name(booking.destination_address.place_name, booking.destination_address.formatted_address)} {formatted_address_no_state(booking.destination_address.formatted_address)}"
            else:
                destination_address = formatted_address_no_state(
                    booking.destination_address.formatted_address
                )
        else:
            parts = ["Melbourne Airport"]
            if booking.destination_airport_terminal:
                from scbp_core.models import AirportTerminal

                parts.append(
                    AirportTerminal.choices.get(
                        booking.destination_airport_terminal,
                        booking.destination_airport_terminal,
                    )
                )
            time = booking.destination_flight_departure_time.strftime("%H:%M %p").strip(
                "0"
            )
            parts.append(f"Departing {time}")
            destination_address = ",\n".join(parts)
    elif (
        booking.additional_stops.count() > 0
        and booking.booking_type == BookingType.HOURLY
    ):
        destination_address = formatted_hourly_destination(booking)
        destination_address = formatted_address_no_state(destination_address)

    if booking.additional_stops.count() > 0:
        additional_stops = []

        # Strip off the post code
        for stop in booking.additional_stops.values_list(
            "formatted_address", "address_instructions", named=True
        ):
            formatted_address = stop.formatted_address.split(" ")[:-1]
            formatted_address = " ".join(formatted_address)
            additional_stops.append(
                {
                    "formatted_address": formatted_address,
                    "address_instructions": stop.address_instructions,
                }
            )
    else:
        additional_stops = []

    equipment = []
    if booking.additional_stops.count():
        equipment.append(f"{booking.additional_stops.count()} Additional Stops")
    if booking.get_required_child_seat_count():
        equipment.append(f"{booking.get_required_child_seat_count()} Child Seats")
    if booking.requires_wedding_ribbons:
        equipment.append("Ribbon")
    if booking.vehicle_color:
        equipment.append(booking.vehicle_color.title)
    if booking.requires_car_park_pass:
        equipment.append("BHP Parking Pass")
    if len(equipment) == 0:
        equipment.append("None")
    equipment = ", ".join(equipment)

    if booking.passenger_name:
        passenger_name = booking.passenger_name
    elif booking.passenger:
        passenger_name = booking.passenger.get_full_name_with_title()
    else:
        passenger_name = booking.client_user.get_full_name_with_title()

    # Price parameters
    price_breakdown = booking.price_breakdown
    if price_breakdown:
        # Travel charge - base excluding car class and peak/off-peak
        if "base" in price_breakdown:
            travel_charge = Decimal(price_breakdown["base"]["subtotal"])
            if "peak" in price_breakdown["base"]:
                travel_charge -= Decimal(price_breakdown["base"]["peak"])
        else:
            travel_charge = Decimal(0)

        # Time surcharge - peak/off-peak
        if "base" in price_breakdown and "peak" in price_breakdown["base"]:
            time_charge = Decimal(price_breakdown["base"]["peak"])
        else:
            time_charge = Decimal(0)

        # Equipment charge - booking options
        if "options" in price_breakdown:
            equipment_charge = Decimal(price_breakdown["options"]["subtotal"])
        else:
            equipment_charge = Decimal(0)

        # Extras charge - fees, variations, out-of-pockets, rounding
        extras_charge = Decimal(price_breakdown["fees"]["subtotal"])
        if "variations" in price_breakdown:
            extras_charge += Decimal(price_breakdown["variations"]["subtotal"])
        if "out_of_pockets" in price_breakdown:
            extras_charge += Decimal(price_breakdown["out_of_pockets"]["subtotal"])
        if "rounding" in price_breakdown:
            extras_charge += Decimal(price_breakdown["rounding"]["subtotal"])
    else:
        travel_charge, time_charge, equipment_charge, extras_charge = [Decimal(0)] * 4

    if booking.client_user.first_name:
        name = booking.client_user.first_name
    elif booking.client_user.last_name and not booking.client_user.first_name:
        name = f"{booking.client_user.title} {booking.client_user.last_name}".strip()
    else:
        name = booking.client_user.get_full_name_with_title()

    # Send email
    email_body = render_to_string(
        "email/booking_confirmation.html",
        context={
            "name": name,
            "client_number": booking.client_user_id,
            "account": booking.account,
            "booking_number": booking.booking_number,
            "travel_on": booking.travel_on,
            "passenger_name": passenger_name,
            "from_address": from_address,
            "pickup_notes": booking.from_address.address_instructions,
            "to_address": destination_address,
            "destination_notes": (
                booking.destination_address.address_instructions
                if booking.destination_address
                else None
            ),
            "additional_stops": additional_stops,
            "car_type": booking.vehicle_class.title,
            "passenger_count": booking.passenger_count,
            "bag_count": booking.baggage_count,
            "equipment": equipment,
            "driver_notes": booking.driver_notes,
            "breakdown": get_client_facing_breakdown(booking.price_breakdown),
            "total_charge": currency_format % booking.price_total,
            "payment_method": booking.get_long_booking_payment_type(),
            "domain": settings.SITE_URL,
        },
    )
    send_mail(
        email_subject,
        "",
        f"Limomate Bookings <{settings.SERVER_EMAIL}>",
        [to],
        html_message=email_body,
    )


def send_cancellation_to_driver(booking, driver):
    destination_address = "To be advised"

    if booking.destination_address:
        destination_address = booking.destination_address.suburb
    elif (
        booking.additional_stops.count() > 0
        and booking.booking_type == BookingType.HOURLY
    ):
        destination_address = formatted_hourly_destination(booking)

    message = (
        f"Job cancelled. {booking.booking_number} {timezone.localtime(booking.travel_on).strftime('%Y.%m.%d %H%Mhrs')} "
        f"{booking.from_address.suburb} - "
        f"{destination_address}"
    )
    mobile = driver.mobile
    send_sms(mobile=mobile, message=message)


def send_booking_declined_email(booking):
    email_subject = (
        "Your recent booking request has been declined - Limomate by Southern Cross"
    )
    to = booking.client_user.email
    title = booking.client_user.title
    first_name = booking.client_user.first_name
    last_name = booking.client_user.last_name
    if booking.destination_address:
        destination_address = booking.destination_address.suburb
    elif (
        booking.booking_type == BookingType.HOURLY
        and booking.additional_stops.count() > 0
    ):
        destination_address = formatted_hourly_destination(booking)
    else:
        destination_address = "'destination to be advised'"
    email_body = render_to_string(
        "email/booking_declined.html",
        context={
            "title": title,
            "first_name": first_name,
            "last_name": last_name,
            "travel_on": booking.travel_on,
            "from_address": booking.from_address.suburb,
            "to_address": destination_address,
            "domain": settings.SITE_URL,
        },
    )
    send_mail(
        email_subject,
        "",
        f"Limomate Bookings <{settings.SERVER_EMAIL}>",
        [to],
        html_message=email_body,
    )


def send_booking_cancelled_email(booking):
    email_subject = "Your booking has been cancelled - Limomate by Southern Cross"
    to = booking.client_user.email
    title = booking.client_user.title
    first_name = booking.client_user.first_name
    last_name = booking.client_user.last_name
    travel_on = timezone.localtime(booking.travel_on)

    destination_address = "'destination to be advised'"

    if booking.destination_address:
        destination_address = booking.destination_address.suburb
    elif (
        booking.booking_type == BookingType.HOURLY
        and booking.additional_stops.count() > 0
    ):
        destination_address = formatted_hourly_destination(booking)

    email_body = render_to_string(
        "email/booking_cancelled.html",
        context={
            "title": title,
            "day": travel_on.strftime("%A"),
            "date": travel_on.strftime("%-d %b"),
            "time": travel_on.strftime("%-I:%M%p"),
            "first_name": first_name,
            "last_name": last_name,
            "travel_on": booking.travel_on,
            "from_address": booking.from_address.suburb,
            "to_address": destination_address,
            "booking_number": booking.booking_number,
            "domain": settings.SITE_URL,
        },
    )
    send_mail(
        email_subject,
        "",
        f"Limomate Bookings <{settings.SERVER_EMAIL}>",
        [to],
        html_message=email_body,
    )
