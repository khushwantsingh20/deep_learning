from decimal import Decimal

from django import template

register = template.Library()


@register.filter
def format_currency(raw_value):
    """
    Custom template filter that converts the given raw value into a decimal representation
    Will raise an exception (due to Decimal(raw_value)) if raw_value cannot be converted
    into a Decimal value - this will always be a bug in the template
    :param raw_value: The raw value to display as a currency value
    :return: The currency display value ($0.00 if raw_value is None)
    """
    if not raw_value:
        value = Decimal(0).quantize(Decimal("0.01"))
    else:
        value = Decimal(raw_value).quantize(Decimal("0.01"))
    if value < 0:
        return f"-${-value}"
    return f"${value}"
