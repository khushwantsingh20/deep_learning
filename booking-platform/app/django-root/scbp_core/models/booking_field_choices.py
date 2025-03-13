from collections import OrderedDict


class AirportTerminal:
    T1 = 1
    T2 = 2
    T3 = 3
    T4 = 4

    choices = OrderedDict(
        (
            (T1, "Terminal 1 - Qantas Domestic"),
            (T2, "Terminal 2 - International"),
            (T3, "Terminal 3 - Virgin Australia"),
            (T4, "Terminal 4 - Jetstar, Tiger, & Regional Express"),
        )
    )


AIRPORT_WAIT_TIMES = (
    (num_minutes, f"{num_minutes} minutes") for num_minutes in range(0, 76, 5)
)


class BookingAddressType:
    AIRPORT = 1
    HOME = 2
    OFFICE = 3
    ADDRESS_BOOK = 4
    CUSTOM = 5

    choices = OrderedDict(
        (
            (AIRPORT, "Melbourne Airport"),
            (HOME, "Home"),
            (OFFICE, "Office"),
            (ADDRESS_BOOK, "Other Saved Locations"),
            (CUSTOM, "Custom"),
        )
    )


class BookingMethod:
    PHONE = 1
    EMAIL = 2
    SMS = 3
    WEBSITE = 4
    APP = 5

    choices = OrderedDict(
        (
            (PHONE, "Phone"),
            (EMAIL, "Email"),
            (SMS, "SMS"),
            (WEBSITE, "Website"),
            (APP, "App"),
        )
    )


class BookingPaymentMethod:
    INVOICE = 1
    CREDIT_CARD = 2
    DRIVER_COLLECT = 3

    choices = OrderedDict(
        (
            (INVOICE, "Invoice"),
            (CREDIT_CARD, "Credit Card"),
            (DRIVER_COLLECT, "Driver Collect"),
        )
    )


class BookingDriverCollectMethod:
    NONE = 0
    CABCHARGE = 1
    CAB_CARD = 2
    CAB_CASH = 3

    choices = OrderedDict(
        (
            (NONE, "-"),
            (CAB_CARD, "Credit Card"),
            (CABCHARGE, "Cab Charge"),
            (CAB_CASH, "Cash"),
        )
    )


class BookingStatus:
    UNVERIFIED = 1
    VERIFIED = 2
    OFFERED = 3
    KNOCKED_BACK = 4
    CHANGED = 5
    CONFIRMED = 6
    PICKED_UP = 7
    CLEARED = 8
    VARIATION = 9
    COMPLETED = 10
    CANCELLED = 11

    choices = OrderedDict(
        (
            (UNVERIFIED, "Unverified"),
            (VERIFIED, "Verified"),
            (OFFERED, "Offered"),
            (KNOCKED_BACK, "Knocked Back"),
            (CHANGED, "Changed"),
            (CONFIRMED, "Confirmed"),
            (PICKED_UP, "Picked Up"),
            (CLEARED, "Cleared"),
            (VARIATION, "Variation"),
            (COMPLETED, "Completed"),
            (CANCELLED, "Cancelled"),
        )
    )


class BookingType:
    ONE_WAY = 1
    HOURLY = 2

    choices = OrderedDict(((ONE_WAY, "One Way Trip"), (HOURLY, "Hourly Booking")))


class PriceVariationType:
    WAITING = 1
    ADHOC = 2
    DISCOUNT = 3
    OTHER = 4
    OUT_OF_AREA = 5
    INTERSTATE_TRANSFER_RATE = 6

    choices = OrderedDict(
        (
            (WAITING, "Waiting"),
            (ADHOC, "Ad Hoc Additional Stop"),
            (DISCOUNT, "Discount"),
            (OUT_OF_AREA, "Out of area"),
            (INTERSTATE_TRANSFER_RATE, "Interstate Transfer Rate"),
            (OTHER, "Other"),
        )
    )


class LegacyReviewStatus:
    """Review status on legacy bookings (eg. has someone checked it)

    This can be removed some time after go live along with associated field.
    """

    NOT_REVIEWED = 1
    DISMISSED = 2

    choices = OrderedDict(
        (
            (NOT_REVIEWED, "Not Reviewed"),
            (DISMISSED, "Dismissed"),
        )
    )


BOOKING_TOO_CLOSE_ERROR_MESSAGE = "Please call the office on 1300 12 LIMO to make a booking this close to your requested pick up time"
UPDATE_BOOKING_TOO_CLOSE_ERROR_MESSAGE = "Please call the office on 1300 12 LIMO to update a booking this close to the requested pick up time"
BOOKING_PAST_ERROR_MESSAGE = "This booking is in the past, please adjust the date and time for your requested pick up"
