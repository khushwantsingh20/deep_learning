def formatted_address(address):
    address = address.split(",")
    address = ", \n".join(address)
    return address


def formatted_address_no_state(address):
    states = [
        "VIC",
        "NSW",
        "ACT",
        "NT",
        "TAS",
        "SA",
        "WA",
        "QLD",
    ]

    address = address.split(",")
    address = ", \n".join(address)

    for state in states:
        address = address.replace(state + " ", "")

    return address


def deduplicate_place_name(place_name, address):
    """
    Check whether the first part of the formatted address contains
    the same value as the place_name.

    If the address doesn't have the same string, return the place_name.
    Otherwise return and empty string as the place_name is duplicated.

    :param place_name: Google place_name string
    :param address: The formatted_address string
    """
    address = address.split(",")[:-1]
    address = ", \n".join(address)

    if place_name != address:
        return f"{place_name}\n"

    return ""


def formatted_hourly_destination(booking):
    # Use last additional stop as the destination_address for hourly bookings
    # It is expected that you check whether the booking is hourly before
    # calling this function.

    destination_address = "As advised"

    # If we don't have any, bail out.
    if booking.additional_stops.count() == 0:
        return destination_address

    return booking.additional_stops.latest(
        "booking_additional_stops__stop_number"
    ).formatted_address
