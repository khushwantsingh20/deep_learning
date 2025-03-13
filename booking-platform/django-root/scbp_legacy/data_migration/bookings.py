from datetime import time
from functools import lru_cache
import logging
from typing import Union

from django.conf import settings
from django.db import transaction
from django.utils import timezone
import googlemaps
from pytz import AmbiguousTimeError
from pytz import NonExistentTimeError

from scbp_core.models import Account
from scbp_core.models import AccountCategoryType
from scbp_core.models import AccountInvoicingMethodType
from scbp_core.models import AccountPaymentMethodType
from scbp_core.models import AccountToClient
from scbp_core.models import Booking
from scbp_core.models import BookingAdditionalStop
from scbp_core.models import BookingAddress
from scbp_core.models import BookingAddressLegacyTable
from scbp_core.models import BookingDriverCollectMethod
from scbp_core.models import BookingLog
from scbp_core.models import BookingMethod
from scbp_core.models import BookingPaymentMethod
from scbp_core.models import BookingPriceVariation
from scbp_core.models import BookingStatus
from scbp_core.models import BookingType
from scbp_core.models import ClientAddress
from scbp_core.models import ClientUser
from scbp_core.models import DriverUser
from scbp_core.models import PriceVariationType
from scbp_core.models import User
from scbp_core.models import VehicleClass
from scbp_core.models import VehicleColor
from scbp_core.services.pricing import PriceCalculator
from scbp_legacy.data_migration import generate_account_nickname
from scbp_legacy.data_migration import migrate_client_and_account
from scbp_legacy.data_migration import strip
from scbp_legacy.models import LegacyBookings
from scbp_legacy.models import LegacyDestinations
from scbp_legacy.models import LegacyPickups

logger = logging.getLogger("legacy_migration")


def get_system_user():
    return User.objects.get(
        email="client-southerncross+datamigration@alliancesoftware.com.au"
    )


def _get_distinct_booking_values(field_name):
    return (
        LegacyBookings.objects.filter(
            # Only clients that have booked in last 5 years
            calcdaterequired__gt=(timezone.now() - timezone.timedelta(weeks=52 * 5))
        )
        .order_by(field_name)
        .values(field_name)
        .distinct()
        .values_list(field_name, flat=True)
    )


def parse_booking_color(value):
    """
    >>> distinct_values = _get_distinct_booking_values('bookingreq02')
    >>> { v: parse_booking_color(v) for v in distinct_values }
    {None: None, 'Black': <VehicleColor: Black (black)>, 'Gold': None, 'Other': None, 'Silver': <VehicleColor: Silver (silver)>}
    """
    if value == "Black":
        return VehicleColor.objects.get(title="Black")
    if value == "Silver":
        return VehicleColor.objects.get(title="Silver")
    return None


def parse_booking_method(value: str, portal_user: str) -> BookingMethod:
    """
    >>> distinct_values = _get_distinct_booking_values('bookingmethod')
    >>> { v: parse_booking_method(v, '') for v in distinct_values }
    {None: 1, 'Email': 2, 'Online': 4, 'Phone': 1, 'Portal': 4}
    """
    mapping = {
        "Email": BookingMethod.EMAIL,
        "Phone": BookingMethod.PHONE,
        "Online": BookingMethod.WEBSITE,
        "Portal": BookingMethod.WEBSITE,
    }
    if not value:
        # Existing of this field means that the portal user themselves created it - in
        # which case it must be from the website
        if strip(portal_user):
            return BookingMethod.WEBSITE
        return BookingMethod.PHONE
    if value not in mapping:
        raise ValueError(f"Unexpected value {value}")
    return mapping[value]


def parse_booking_req_04(value):
    """
    >>> distinct_values = _get_distinct_booking_values('bookingreq04')
    >>> valid_keys = {'rear_facing_baby_seat_count', 'forward_facing_baby_seat_count', 'booster_seat_count', 'requires_wedding_ribbons', 'requires_car_park_pass'}
    >>> for value in distinct_values:
    ...     v = parse_booking_req_04(value)
    ...     assert isinstance(v, dict)
    ...     assert set(v.keys()).issubset(valid_keys), 'Invalid keys'
    """
    if not value or value == "None":
        return {}
    mapping = {
        "Baby Seat & Booster": dict(
            rear_facing_baby_seat_count=1, booster_seat_count=1
        ),
        "Baby Seat (Fwd)": dict(forward_facing_baby_seat_count=1),
        "Baby Seat (Rear)": dict(rear_facing_baby_seat_count=1),
        "Baby Seat x 2": dict(forward_facing_baby_seat_count=2),
        "Baby Seat/Booster x 3": dict(
            forward_facing_baby_seat_count=1, booster_seat_count=3
        ),
        "BCAP": dict(rear_facing_baby_seat_count=1),
        "BCAP,BOOST": dict(rear_facing_baby_seat_count=1, booster_seat_count=1),
        "BCAP,BOOST@2": dict(rear_facing_baby_seat_count=1, booster_seat_count=2),
        "BCAP@2": dict(rear_facing_baby_seat_count=2),
        "BCAP@2,WRB": dict(rear_facing_baby_seat_count=2, requires_wedding_ribbons=1),
        "BHP": dict(requires_car_park_pass=True),
        "BHP Pass": dict(requires_car_park_pass=True),
        "BOOST": dict(booster_seat_count=1),
        "BOOST@2": dict(booster_seat_count=2),
        "BOOST@3": dict(booster_seat_count=3),
        "BOOSTER": dict(booster_seat_count=1),
        "Booster Seat": dict(booster_seat_count=1),
        "BS@2": dict(forward_facing_baby_seat_count=2),
        "BS@3": dict(forward_facing_baby_seat_count=3),
        "BS@4": dict(forward_facing_baby_seat_count=4),
        "BS@FWD": dict(forward_facing_baby_seat_count=1),
        "BS@REAR": dict(rear_facing_baby_seat_count=1),
        "BST": dict(forward_facing_baby_seat_count=1),
        "BST,BCAP": dict(
            forward_facing_baby_seat_count=1, rear_facing_baby_seat_count=1
        ),
        "BST,BCAP,BOOST": dict(
            forward_facing_baby_seat_count=1,
            rear_facing_baby_seat_count=1,
            booster_seat_count=1,
        ),
        "BST,BCAP,BOOST,WRB": dict(
            forward_facing_baby_seat_count=1,
            rear_facing_baby_seat_count=1,
            booster_seat_count=1,
            requires_wedding_ribbons=True,
        ),
        "BST,BCAP,WRB": dict(
            forward_facing_baby_seat_count=1,
            rear_facing_baby_seat_count=1,
            requires_wedding_ribbons=True,
        ),
        "BST,BOOST": dict(forward_facing_baby_seat_count=1, booster_seat_count=1),
        "BST,BOOST@2": dict(forward_facing_baby_seat_count=1, booster_seat_count=2),
        "BST,WRB": dict(
            forward_facing_baby_seat_count=1, requires_wedding_ribbons=True
        ),
        "BST@2": dict(forward_facing_baby_seat_count=2),
        "BST@2,BCAP": dict(
            forward_facing_baby_seat_count=2, rear_facing_baby_seat_count=1
        ),
        "BST@2,BOOST": dict(forward_facing_baby_seat_count=2, booster_seat_count=1),
        "BST@3": dict(forward_facing_baby_seat_count=3),
        "WedRib": dict(requires_wedding_ribbons=True),
        "WRB": dict(requires_wedding_ribbons=True),
    }
    if value not in mapping:
        raise ValueError(f"Unexpected value {value}")
    return mapping[value]


def parse_booking_type(value):
    """
    >>> distinct_values = _get_distinct_booking_values('bookingtype')
    >>> { v: parse_booking_type(v) for v in distinct_values }
    {'H': {'booking_type': 2, 'hourly_booking_duration': datetime.timedelta(seconds=3600)}, 'I': {}, 'O': {'out_of_area': True}, 'T': {'is_time_tba': True}, 'W': {'requires_wedding_ribbons': True}, 'Z': {}}
    """
    mapping = {
        # 'Hold' (hourly booking)
        "H": {
            "booking_type": BookingType.HOURLY,
            "hourly_booking_duration": timezone.timedelta(hours=1),
        },
        # Interstate - we calculate from address
        "I": {},
        # OOA
        "O": {"out_of_area": True},
        # TBA
        "T": {"is_time_tba": True},
        # Wedding
        "W": {"requires_wedding_ribbons": True},
        # Normal
        "Z": {},
    }
    if value not in mapping:
        raise ValueError(f"Unexpected value {value}")
    return mapping[value]


@lru_cache()
def get_car_types():
    types = {}
    for vc in VehicleClass.objects.all():
        abbr = vc.abbreviation
        if vc.is_any_class:
            abbr = "ANY"
        if not abbr:
            raise ValueError("Expected abbreviation")
        types[abbr] = vc
    assert {"ANY", "BUS", "FPM", "LPM", "SUV"}.issubset(set(types.keys()))
    return types


def parse_car_type(value):
    """Car type maps to a specific car type or some car types options

    >>> distinct_values = _get_distinct_booking_values('cartype')
    >>> { strip(v): parse_car_type(v) for v in distinct_values }
    {'': {'vehicle_class': <VehicleClass: Any Class>}, 'FPM': {'vehicle_class': <VehicleClass: Family People Mover>}, 'FPV': {'vehicle_class': <VehicleClass: Family People Mover>}, 'LPM': {'vehicle_class': <VehicleClass: Luxury People Mover>}, 'LPV': {'vehicle_class': <VehicleClass: Luxury People Mover>}, 'LUX': {'vehicle_class': <VehicleClass: Corporate Sedan>}, 'MPV': {'vehicle_class': <VehicleClass: Family People Mover>}, 'NGS': {'vehicle_class': <VehicleClass: SUV>}, 'OTH': {'vehicle_class': <VehicleClass: Any Class>, 'office_notes': 'Car type in legacy was: OTHER'}, 'SDN': {'vehicle_class': <VehicleClass: Corporate Sedan>}, 'STR': {'vehicle_class': <VehicleClass: Any Class>, 'office_notes': 'Car type in legacy was: Stretch'}, 'SXL': {'vehicle_class': <VehicleClass: SUV>}, 'TRG': {'vehicle_class': <VehicleClass: Family People Mover>}}
    """
    value = strip(value)
    car_types = get_car_types()
    if not value:
        return {"vehicle_class": car_types["ANY"]}
    type_mapping = {
        "FPM": "FPM",
        "FPV": "FPM",
        "LPM": "LPM",
        "LPV": "LPM",
        "LUX": "BUS",
        "MPV": "FPM",
        "NGS": "SUV",
        "SDN": "BUS",
        "SXL": "SUV",
        "TRG": "FPM",
    }
    values = {}
    values["vehicle_class"] = car_types.get(type_mapping.get(value), car_types["ANY"])
    if value == "BST":
        values["forward_facing_baby_seat_count"] = 1
    if value in ["OTH", "OTHER"]:
        values["office_notes"] = "Car type in legacy was: OTHER"
    if value == "SLV":
        values["vehicle_color"] = VehicleColor.objects.get(title="Silver")
    if value == "BLK":
        values["vehicle_color"] = VehicleColor.objects.get(title="Black")
    if value in ["STRETCH", "STR"]:
        values["office_notes"] = "Car type in legacy was: Stretch"

    return values


def parse_status(value) -> BookingStatus:
    """
    >>> distinct_values = _get_distinct_booking_values('status')
    >>> {strip(v): BookingStatus.choices[parse_status(v)] for v in distinct_values}
    {'': 'Verified', '_Cleared': 'Cleared', '_Confirmed': 'Confirmed', '_Knockback': 'Knocked Back', '_PickedUp': 'Picked Up', '_Sent': 'Offered', 'Changed': 'Changed', 'Cleared': 'Cleared', 'Completed': 'Completed', 'Confirmed': 'Confirmed', 'Dispatched': 'Offered', 'Knockback': 'Knocked Back', 'Picked Up': 'Picked Up', 'Rogered': 'Verified', 'Variation': 'Variation'}
    """
    value = strip(value)
    if not value:
        return BookingStatus.VERIFIED
    mapping = {
        "_Cleared": BookingStatus.CLEARED,
        "_Confirmed": BookingStatus.CONFIRMED,
        "_Knockback": BookingStatus.KNOCKED_BACK,
        "_PickedUp": BookingStatus.PICKED_UP,
        "_Sent": BookingStatus.OFFERED,
        "Changed": BookingStatus.CHANGED,
        "Cleared": BookingStatus.CLEARED,
        "Completed": BookingStatus.COMPLETED,
        "Confirmed": BookingStatus.CONFIRMED,
        "Dispatched": BookingStatus.OFFERED,
        "Knockback": BookingStatus.KNOCKED_BACK,
        "Picked Up": BookingStatus.PICKED_UP,
        "Rogered": BookingStatus.VERIFIED,
        "Variation": BookingStatus.VARIATION,
    }
    if value not in mapping:
        raise ValueError(f"Unexpected value {value}")
    return mapping[value]


def make_aware_handle_dst(date):
    """Handles cases of invalid dates eg. 2am on daylight savings end, 2:30 am start etc

    Just offsetting by an hour. There are very few cases and are most likely historical.
    For any future bookings may just need to get George to check after launch.
    """
    try:
        return timezone.make_aware(date)
    except (NonExistentTimeError, AmbiguousTimeError):
        # Handle time being on DST boundary
        return timezone.make_aware(date + timezone.timedelta(hours=1))


def parse_pickuptime(value: str, travel_on):
    """
    >>> distinct_values = _get_distinct_booking_values('pickuptime')
    >>> for v in distinct_values:
    ...     t = parse_pickuptime(v, timezone.now())
    """
    value = strip(value)
    if not value:
        return None
    t = time(int(value[:2]), int(value[2:]))

    return make_aware_handle_dst(timezone.datetime.combine(travel_on, t))


def parse_droptime(value: str, travel_on):
    """
    >>> distinct_values = _get_distinct_booking_values('droptime')
    >>> for v in distinct_values:
    ...     t = parse_droptime(v, timezone.now())
    >>> parse_droptime('2330', timezone.datetime(2019, 1, 1, 22, 0, 0))
    datetime.datetime(2019, 1, 1, 23, 30, tzinfo=<DstTzInfo 'Australia/Melbourne' AEDT+11:00:00 DST>)
    >>> parse_droptime('0030', timezone.datetime(2019, 1, 1, 22, 0, 0))
    datetime.datetime(2019, 1, 2, 0, 30, tzinfo=<DstTzInfo 'Australia/Melbourne' AEDT+11:00:00 DST>)
    """
    value = strip(value)
    if not value:
        return None
    t = time(int(value[:2]), int(value[2:]))
    # If the drop time is before the travel on time then it must have crossed the day barrier
    if t < travel_on.time():
        return make_aware_handle_dst(
            timezone.datetime.combine(travel_on + timezone.timedelta(days=1), t)
        )
    return make_aware_handle_dst(timezone.datetime.combine(travel_on, t))


def parse_driver_payment(value: str):
    """
    >>> distinct_values = _get_distinct_booking_values('driverpayment')
    >>> {strip(v): parse_driver_payment(v) for v in distinct_values}
    {'': 1, 'Cabcharge': 2, 'Cash': 4, 'CreditCard': 3}
    """
    value = strip(value)
    mapping = {
        "CreditCard": BookingDriverCollectMethod.CAB_CARD,
        "Cash": BookingDriverCollectMethod.CAB_CASH,
        "Cabcharge": BookingDriverCollectMethod.CABCHARGE,
    }
    return mapping.get(value, BookingDriverCollectMethod.CAB_CARD)


@lru_cache()
def get_google_source_id(address_string):
    key = settings.GOOGLE_API_SERVER_KEY
    gmaps = googlemaps.Client(key=key)
    result = gmaps.find_place(
        address_string, input_type="textquery", fields=["place_id"]
    )
    if result["status"] == "ZERO_RESULTS":
        return ""
    return result["candidates"][0]["place_id"]


def migrate_booking(legacy_booking: LegacyBookings):
    logger.info(
        f"BOOKING {legacy_booking.pk}: Starting migration for booking {legacy_booking.jobnumber}"
    )
    with transaction.atomic():
        try:
            client = ClientUser.objects.get(legacy_clientno=legacy_booking.clientno_id)
        except ClientUser.DoesNotExist:
            # If new clients are added after we migrate clients then we may have a few
            # we need to migrate here
            client, _ = migrate_client_and_account(legacy_booking.clientno)
        try:
            account = Account.objects.get(
                legacy_accountno=legacy_booking.acctno, clients=client
            )
        except Account.DoesNotExist:
            a_to_c = client.account_to_client.first()
            if not a_to_c:
                # Ignore account no set and instead use clientno
                # George says they just used clientno in place of account number everywhere
                account_no = legacy_booking.clientno_id
                if Account.objects.filter(account_no=account_no).exists():
                    account_no = None
                account = Account.objects.create(
                    account_no=account_no,
                    account_nickname=generate_account_nickname(
                        legacy_booking.clientno, None
                    ),
                    category=AccountCategoryType.PERSONAL,
                    payment_method=AccountPaymentMethodType.CREDIT_CARD,
                    invoicing_method=AccountInvoicingMethodType.EMAIL,
                    legacy_accountno=account_no,
                )
                AccountToClient.objects.create(
                    client_user=client,
                    account=account,
                    is_default_account=True,
                    is_account_admin=True,
                )
                logger.info(
                    f"BOOKING {legacy_booking.pk}: Account '{strip(legacy_booking.acctno)}' does not exist and client user has no account. Created default account with id {account.pk}."
                )
            else:
                logger.info(
                    f"BOOKING {legacy_booking.pk}: Account '{strip(legacy_booking.acctno)}' does not exist. Using default for user."
                )
                account = a_to_c.account
        travel_on = make_aware_handle_dst(
            timezone.datetime.combine(
                legacy_booking.calcdaterequired, legacy_booking.calctimerequired
            )
        )

        is_managed_in_legacy = travel_on < timezone.now()
        price_breakdown = {
            "total": legacy_booking.totalcharge or legacy_booking.totaltripcharge,
            "creditCardSurcharge": legacy_booking.creditcardsurcharge,
            "equipment": legacy_booking.equipmentfee,
            "carDriver": legacy_booking.cardriverequip,
            "variationFee": legacy_booking.variationfee,
            "variationText": legacy_booking.variation,
            "standard": legacy_booking.tripcharge,
            "totalTrip": legacy_booking.totaltripcharge,
            "discount": legacy_booking.discount,
            "kilometers": legacy_booking.kilometers,
            "afterHoursSurcharge": legacy_booking.afterhourssurcharge,
            "bookingFee": legacy_booking.bookingfee,
            "driverJobValue": legacy_booking.driverjobvalue,
        }

        destinations = list(
            LegacyDestinations.objects.filter(
                jobnumber=legacy_booking.jobnumber
            ).order_by("destno")
        )
        pickups = list(
            LegacyPickups.objects.filter(jobnumber=legacy_booking.jobnumber).order_by(
                "pickupno"
            )
        )

        booking = Booking(
            out_of_area=False,
            account=account,
            client_user=client,
            vehicle_color=parse_booking_color(legacy_booking.bookingreq02),
            booking_status=parse_status(legacy_booking.status),
            booking_number=legacy_booking.jobnumber,
            legacy_jobnumber=legacy_booking.jobnumber,
            price_total=legacy_booking.totaltripcharge,
            booking_method=parse_booking_method(
                legacy_booking.bookingmethod, legacy_booking.portalusercreated
            ),
            travel_on=travel_on,
            convoy_number=legacy_booking.carposn,
            passenger_name=strip(legacy_booking.contactname),
            passenger_phone=strip(legacy_booking.contactphone),
            dropoff_time=parse_droptime(legacy_booking.droptime, travel_on),
            driver_notes=strip(legacy_booking.instructions),
            passenger_count=legacy_booking.noofpax,
            baggage_count=legacy_booking.nocheckinitems or 0,
            child_under8_count=legacy_booking.noofchildren or 0,
            pickup_time=parse_pickuptime(legacy_booking.pickuptime, travel_on),
            purchase_order_number=strip(legacy_booking.referenceno),
            run_number=(
                legacy_booking.runno
                if legacy_booking.runno and legacy_booking.runno > 0
                else None
            ),
            supplier_confirmation_number=strip(legacy_booking.supplierref),
            created_by=get_system_user(),
            created_at=legacy_booking.sxdatebooked,
            is_managed_in_legacy=is_managed_in_legacy,
            is_matching_legacy_pricing=not is_managed_in_legacy,
            legacy_price_breakdown=price_breakdown,
        )

        # For almost all bookings the passenger name is just the name on the first booking. There are
        # a few bookings in legacy system with no pickup address.. see fallback below for how these are
        # handled
        if pickups:
            booking.passenger_name = strip(pickups[0].name)
            booking.passenger_phone = strip(pickups[0].phone)

        if strip(legacy_booking.clientno.name) == booking.passenger_name or not strip(
            booking.passenger_name
        ):
            booking.passenger = client

        if booking.pickup_time:
            booking.wait_time = booking.pickup_time - booking.travel_on

        if legacy_booking.driverno:
            booking.driver = DriverUser.objects.get(driver_no=legacy_booking.driverno)

        if legacy_booking.calcdeleted:
            booking.booking_status = BookingStatus.CANCELLED

        office_notes = []
        if strip(legacy_booking.bookingreq03):
            office_notes.append(strip(legacy_booking.bookingreq03))
        if strip(legacy_booking.otherinstructions):
            office_notes.append(strip(legacy_booking.otherinstructions))

        payment_method = strip(legacy_booking.paymentmethod)
        if payment_method:
            driver_payment = strip(legacy_booking.driverpayment)
            if payment_method == "Driver Collect" and driver_payment:
                booking.booking_payment_method = BookingPaymentMethod.DRIVER_COLLECT
                booking.driver_collect_method = parse_driver_payment(driver_payment)
                office_notes.append(
                    f"Payment method: {payment_method} ({driver_payment})"
                )
            else:
                office_notes.append(f"Payment method: {payment_method}")

        if legacy_booking.contactid:
            try:
                contact = ClientUser.objects.get(
                    legacy_contactno=legacy_booking.contactid
                )
                booking.passenger = contact
            except ClientUser.DoesNotExist:
                logger.info(
                    f"BOOKING {legacy_booking.pk}: Unable to find contact {legacy_booking.contactid}; ignoring and setting passenger to main client"
                )

        def apply_dict(values):
            for key, value in values.items():
                if key == "office_notes":
                    office_notes.append(value)
                else:
                    setattr(booking, key, value)

        apply_dict(parse_booking_req_04(legacy_booking.bookingreq04))
        apply_dict(parse_booking_type(legacy_booking.bookingtype))
        apply_dict(parse_car_type(legacy_booking.cartype))

        legacy_address: Union[LegacyDestinations, LegacyPickups]
        stop_number = 1
        additional_stops = []
        all_addresses = pickups + destinations
        if not all_addresses:
            logger.info(
                f"BOOKING {legacy_booking.pk}: Has no destination or pickup addresses. Not importing."
            )
            return None

        has_invalid_addresses = False

        # Track last destination... we'll set this to the destination address and
        # all other destinations will become additional stops
        last_destination = None
        if destinations:
            last_destination = destinations[-1]

        for legacy_address in all_addresses:
            is_pickup = isinstance(legacy_address, LegacyPickups)
            formatted_address = " ".join(
                map(
                    strip,
                    filter(
                        bool,
                        [
                            legacy_address.address,
                            legacy_address.suburb,
                            legacy_address.postcode,
                        ],
                    ),
                )
            )
            source_id = ""
            if not is_managed_in_legacy:
                source_id = get_google_source_id(formatted_address)
                logger.info(
                    f"BOOKING {legacy_booking.pk}: Source id for address {formatted_address} = {source_id}"
                )
                if not source_id:
                    has_invalid_addresses = True
                    logger.error(
                        f"BOOKING {legacy_booking.pk}: Failed to locate address {formatted_address}. Will not be able to calculate pricing for booking."
                    )
                else:
                    # Update any saved addresses in system with same address - saves
                    # us / the user having to resolve address later
                    ClientAddress.objects.filter(
                        formatted_address=formatted_address
                    ).update(source_id=source_id)

            address = BookingAddress.objects.create(
                address_instructions=strip(legacy_address.instructions),
                address_label=strip(legacy_address.location),
                postal_code=str(legacy_address.postcode or 0),
                suburb=strip(legacy_address.suburb),
                formatted_address=formatted_address,
                legacy_table=(
                    BookingAddressLegacyTable.PICKUP
                    if is_pickup
                    else BookingAddressLegacyTable.DESTINATION
                ),
                legacy_jobnumber=legacy_booking.jobnumber,
                legacy_stop_number=(
                    legacy_address.pickupno if is_pickup else legacy_address.destno
                ),
                address_details="",
                source_id=source_id,
                lat=0,
                long=0,
            )
            if is_pickup and not hasattr(booking, "from_address"):
                booking.from_address = address
            elif (
                not is_pickup
                and last_destination
                # Comparison on record itself shouldn't be used as all
                # destinations are used due to sharing a primary key
                # (django doesn't understand compound keys, legacy system
                # uses them but one field is marked primary which is used
                # in comparisons)
                and last_destination.destno == legacy_address.destno
            ):
                booking.destination_address = address
            else:
                additional_stops.append(
                    BookingAdditionalStop(
                        booking=booking,
                        address=address,
                        is_pick_up=is_pickup,
                        stop_number=stop_number,
                    )
                )
                stop_number += 1

        booking.save(is_legacy_import=True)
        log_messages = [
            f"Booking {legacy_booking.jobnumber} imported from legacy system"
        ]

        if not is_managed_in_legacy:
            if has_invalid_addresses:
                booking.legacy_has_invalid_address = True
                logger.error(
                    f"BOOKING {legacy_booking.pk}: Pricing could not be calculated due to invalid addresses"
                )
                log_messages.append(
                    "Pricing could not be calculated due to invalid addresses"
                )
            else:
                try:
                    price_calculator = PriceCalculator(
                        booking,
                        booking.price_list,
                        additional_stops=[stop.address for stop in additional_stops],
                    )
                    original_price = booking.price_total
                    booking.price_total = price_calculator.total()
                    booking.price_breakdown = price_calculator.price_breakdown()
                    booking.invoice_breakdown = price_calculator.invoice_breakdown()
                    if original_price != booking.price_total:
                        variation = BookingPriceVariation.objects.create(
                            booking=booking,
                            amount=original_price - booking.price_total,
                            variation_type=PriceVariationType.OTHER,
                            variation_type_other_description="Legacy import price offset",
                        )
                        msg = f"Original price {original_price} does not match new price calculation of {booking.price_total}. Variation of {variation.amount} created to maintain original quoted price."
                    else:
                        msg = "Legacy price and new price calculated matched exactly; no variation created for legacy booking"

                    office_notes.append(msg)
                    log_messages.append(msg)
                except ValueError:
                    logger.exception(
                        f"BOOKING {legacy_booking.pk}: Pricing could not be calculated due to invalid addresses (probably)."
                    )
                    log_messages.append(
                        "Pricing could not be calculated due to failure on calculating pricing (likely due to bad address)"
                    )

        if office_notes:
            booking.office_notes = "\n".join(office_notes)

        booking.save(is_legacy_import=True)
        BookingLog.objects.create(
            user=get_system_user(),
            booking=booking,
            description="\n".join(log_messages),
            source="Legacy System",
        )
        logger.info(
            f"BOOKING {legacy_booking.pk}: Saved booking to id {booking.pk}. Additional stops: {len(additional_stops)}"
        )
        for stop in additional_stops:
            stop.booking = booking
            stop.save()
        return booking
