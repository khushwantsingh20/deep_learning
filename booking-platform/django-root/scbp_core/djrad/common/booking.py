import re

from django.utils import timezone

from scbp_core.models import Booking
from scbp_core.models import BookingLog
from scbp_core.templatetags.format_currency import format_currency


def get_booking_values(
    booking, additional_stops=None, price_variations=None, out_of_pocket_expenses=None
):
    """
    Returns the additional stop, price variation, and out of pocket booking values for use by create_log
    Changes on the booking model itself are to be obtained using Booking.get_changed_fields()
    :param booking: The booking to get the values for
    :param additional_stops: (Optional) The additional stops for this booking
        - defaults to booking.additional_stops.all()
    :param price_variations: (Optional) The price variations for this booking
        - defaults to booking.price_variations.all()
    :param out_of_pocket_expenses: The out of pocket expenses for this booking
        - defaults to booking.out_of_pocket_expenses.all()
    :return: The addresses, price variations, and out of pocket expenses in a format create_log can understand
    """
    address_values = (
        [str(e.address) for e in additional_stops]
        if additional_stops
        else [str(e) for e in booking.additional_stops.all()]
    )
    price_variation_values = (
        [str(e) for e in price_variations]
        if price_variations
        else [str(e) for e in booking.price_variations.all()]
    )
    out_of_pocket_values = (
        [str(e) for e in out_of_pocket_expenses]
        if out_of_pocket_expenses
        else [str(e) for e in booking.out_of_pockets.all()]
    )

    return [address_values, price_variation_values, out_of_pocket_values]


def _log_display_value(key, value):
    """
    Formats the given value as appropriate for booking logs assuming association with the given key
    :param key: The name of the field
    :param value: The value of the field to format
    :return: value formatted for booking logs assuming it came from the Booking field with name key
    """
    field = Booking._meta._forward_fields_map.get(key, None)
    if not field:
        # field == None indicates audit field not corresponding to model field
        # Used for from_address_instructions and destination_address_instructions
        return f'"{value}"'
    field_class = field.__class__.__name__
    if not field.choices and re.search(r"Integer", field_class):
        # Replace null value with 0 for integer non-choice fields
        # (choice fields will pass value through directly - no need for special handling)
        return str(value or 0)
    if field_class == "DateTimeField":
        return timezone.localtime(value).strftime("%d/%m/%Y %H:%M") if value else "None"
    if field_class == "TimeField":
        if not value:
            return "None"
        elif timezone.is_naive(value):
            return value.strftime("%H:%M")
        return timezone.localtime(value).strftime("%H:%M")
    if field_class == "CurrencyValueField":
        # Yes, this function is intended to be used as a Django view filter
        # However, its signature and functionality are exactly what is needed here
        return format_currency(value or 0)
    if field_class in ["CharField", "TextField"]:
        return f'"{value}"'
    # If none of the above handlers handle the value, the diff calculator already did the work
    return value


def create_log(serializer_instance, indicated_differences, old, new):
    from scbp_core.djrad.admin import BookingSerializer
    from scbp_core.djrad.admin import DispatchBookingSerializer
    from scbp_core.djrad.app import CreateUpdateBookingSerializer

    old_address_values, old_price_variation_values, old_out_of_pocket_values = old
    new_address_values, new_price_variation_values, new_out_of_pocket_values = new

    changes = [
        f"{Booking._meta._forward_fields_map[key].verbose_name} changed from "
        f"{_log_display_value(key, value[0])} to {_log_display_value(key, value[1])}"
        for key, value in indicated_differences.items()
        # Ensure we need to implicitly audit changes to this field
        if key in Booking.audit_fields
    ]

    for addr in set(old_address_values).difference(set(new_address_values)):
        changes.append(f"{addr} dropped from Additional Stops")

    for addr in set(new_address_values).difference(set(old_address_values)):
        changes.append(f"{addr} added to Additional Stops")

    for addr in set(old_price_variation_values).difference(
        set(new_price_variation_values)
    ):
        changes.append(f"{addr} dropped from Price Variations")

    for addr in set(new_price_variation_values).difference(
        set(old_price_variation_values)
    ):
        changes.append(f"{addr} added to Price Variations")

    for addr in set(old_out_of_pocket_values).difference(set(new_out_of_pocket_values)):
        changes.append(f"{addr} dropped from Out of Pocket Expenses")

    for addr in set(new_out_of_pocket_values).difference(set(old_out_of_pocket_values)):
        changes.append(f"{addr} added to Out of Pocket Expenses")

    special_field_display_map = {
        "price_total": "Price total",
        "from_address_instructions": "From address instructions",
        "destination_address_instructions": "Destination address instructions",
    }
    changes += [
        f"{special_field_display_map[key]} changed from "
        f"{_log_display_value(key, value[0])} to {_log_display_value(key, value[1])}"
        for key, value in indicated_differences.items()
        if key
        in [
            "price_total",
            "from_address_instructions",
            "destination_address_instructions",
        ]
    ]

    if (
        changes
    ):  # sometimes there'll just be no change, or changes happened to fields we dont care
        source_map = {
            BookingSerializer: "Admin Booking Screen",
            DispatchBookingSerializer: "Admin Dispatch Screen",
            CreateUpdateBookingSerializer: "Client Update Screen",
        }
        if serializer_instance.__class__ in source_map:
            source = source_map[serializer_instance.__class__]
        else:
            raise ValueError(
                "Unknown Serialier for BookingLog source purpose: %s"
                % serializer_instance.__class__
            )

        BookingLog(
            user=serializer_instance.context["request"].user,
            booking=serializer_instance.instance,
            description="\n".join(changes),
            source=source,
        ).save()
