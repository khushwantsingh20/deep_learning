from decimal import Decimal
from typing import Optional
from typing import Tuple
from typing import Union

import scbp_core.models  # Only imported for type hinting - models not imported directly to avoid circular import


def get_surcharge_rate(reference: Union[str, int]):
    amex_rate = Decimal(3)
    diners_club_rate = Decimal(5)
    credit_card_surcharge_rates = {
        "American Express": amex_rate,
        "Diners Club": diners_club_rate,
        "": Decimal(0),  # Account.credit_card_type is '' for invoice type accounts
    }
    return credit_card_surcharge_rates.get(reference, Decimal(2))


def get_surcharge(
    base_amount: Decimal = Decimal(0),
    credit_card_type: Optional[Union[str, int]] = None,
) -> Tuple[Decimal, Decimal]:
    """
    Calculates the surcharge applicable to the given amount for the given
    credit card type
    :param base_amount: The amount to which the surcharge is to be applied
    :param credit_card_type: The type of credit card used
    :return: (Surcharge percentage rate (e.g. Decimal(2) for 2%), Surcharge amount rounded to the nearest cent)
    """
    credit_card_surcharge_rate = get_surcharge_rate(credit_card_type)
    credit_card_surcharge = (
        credit_card_surcharge_rate * base_amount / Decimal(100)
    ).quantize(Decimal("0.01"))
    return credit_card_surcharge_rate, credit_card_surcharge


def get_surcharge_amount(
    base_amount: Decimal = Decimal(0),
    credit_card_type: Optional[Union[str, int]] = None,
) -> Decimal:
    return get_surcharge(base_amount, credit_card_type)[1]


def get_booking_surcharge(
    booking: "scbp_core.models.Booking", raw_price: Optional[Decimal] = Decimal(0)
) -> Tuple[Decimal, Decimal]:
    return get_surcharge(
        base_amount=raw_price, credit_card_type=booking.get_credit_card_type()
    )


def get_booking_surcharge_amount(
    booking: "scbp_core.models.Booking", raw_price: Optional[Decimal] = Decimal(0)
) -> Decimal:
    return get_booking_surcharge(booking, raw_price)[1]
