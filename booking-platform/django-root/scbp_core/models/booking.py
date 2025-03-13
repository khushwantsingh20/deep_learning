from collections import OrderedDict
from datetime import timedelta
from decimal import Decimal
from functools import lru_cache
import logging
from typing import Dict

from allianceutils.models import raise_validation_errors
from allianceutils.util import retry_fn
from django.conf import settings
from django.db import IntegrityError
from django.db import models
from django.db.models import CASCADE
from django.db.models import F
from django.db.models import Max
from django.db.models import Q
from django.db.models import Value
from django.db.models.functions import Concat
from django.utils import timezone

from scbp_core.fields import CurrencyValueField
from scbp_core.fields import get_choices_check_constraint
from scbp_core.fields import PhoneNumberField
from scbp_core.model_mixins import AddressFieldsMixin
from scbp_core.model_mixins import TimestampFieldsMixin
from scbp_core.models import VehicleClass
from scbp_core.models.account import Account
from scbp_core.models.account_field_choices import AccountPaymentMethodType
from scbp_core.models.account_field_choices import AccountPaymentTermsType
from scbp_core.models.booking_field_choices import AIRPORT_WAIT_TIMES
from scbp_core.models.booking_field_choices import AirportTerminal
from scbp_core.models.booking_field_choices import BOOKING_PAST_ERROR_MESSAGE
from scbp_core.models.booking_field_choices import BOOKING_TOO_CLOSE_ERROR_MESSAGE
from scbp_core.models.booking_field_choices import BookingAddressType
from scbp_core.models.booking_field_choices import BookingDriverCollectMethod
from scbp_core.models.booking_field_choices import BookingMethod
from scbp_core.models.booking_field_choices import BookingPaymentMethod
from scbp_core.models.booking_field_choices import BookingStatus
from scbp_core.models.booking_field_choices import BookingType
from scbp_core.models.booking_field_choices import LegacyReviewStatus
from scbp_core.models.booking_field_choices import PriceVariationType
from scbp_core.models.pricing import PriceList
from scbp_core.models.pricing_type import HourRateDayType
from scbp_core.models.user import ClientUser
from scbp_core.models.user import User
from scbp_core.models.vehicle import Vehicle
from scbp_core.permissions import DefaultPermissionsMeta
from scbp_core.services.booking_status_emails import send_booking_cancelled_email
from scbp_core.services.booking_status_emails import send_booking_declined_email
from scbp_core.services.booking_status_emails import send_cancellation_to_driver
from scbp_core.services.distance_calculator import distance_between
from scbp_core.services.get_day_type import get_day_type
from scbp_core.services.places import AIRPORT_ADDRESS
from scbp_core.services.places import AIRPORT_POSTCODE
from scbp_core.services.places import AIRPORT_SOURCE_ID
from scbp_core.services.places import MELBOURNE_GPO_ADDRESS
from scbp_core.services.places import MELBOURNE_GPO_PLACE_ID
from scbp_core.services.send_confirmation_notice import (
    schedule_driver_confirmation_notice,
)
from scbp_core.util import DecimalJSONEncoder

MAX_BOOKING_DURATION_HOURS = 18
MIN_BOOKING_DURATION_HOURS = 1

BOOKING_LEAD_TIME = timedelta(minutes=45)

# Can book in 5 minute intervals
BOOKING_MINUTE_STEP_INTERVAL = 5

# Number of hours prior to booking start time client can update a booking
CLIENT_BOOKING_UPDATE_CUTOFF_HOURS = 8

logger = logging.getLogger()


def log_hardcoded_place_id_update(from_place: str, to_place: str):
    """If one of our hardcoded ids has changed log an error so we can fix it up"""
    if from_place == MELBOURNE_GPO_PLACE_ID:
        logger.error(
            f"MELBOURNE_GPO_PLACE_ID needs to be updated from '{MELBOURNE_GPO_PLACE_ID}' to '{to_place}'. This is likely due to internal changes in Google Maps."
        )
    if from_place == AIRPORT_SOURCE_ID:
        logger.error(
            f"AIRPORT_SOURCE_ID needs to be updated from '{AIRPORT_SOURCE_ID}' to '{to_place}'. This is likely due to internal changes in Google Maps."
        )


def on_place_update(places: Dict[str, str]):
    """distance_between calls this when place_ids change and we write these changes to the database."""
    from scbp_core.models import ClientAddress

    for from_place, to_place in places.items():
        log_hardcoded_place_id_update(from_place, to_place)
        BookingAddress.objects.filter(source_id=from_place).update(source_id=to_place)
        # Also update any address books that may be out of date
        ClientAddress.objects.filter(source_id=from_place).update(source_id=to_place)


class BookingAddressLegacyTable:
    PICKUP = 1
    DESTINATION = 2

    choices = OrderedDict(((PICKUP, "Pickup"), (DESTINATION, "Destination")))


class BookingAddress(AddressFieldsMixin):
    address_instructions = models.TextField(blank=True)
    address_label = models.CharField(blank=True, max_length=255)

    # PK into legacy tables
    # legacy_table is either tblPickups or tblDestinations
    # legacy_jobnumber is the jobnumber
    # legacy_stop_number is destno (tblDestinations) or pickupno (tblPickups)
    legacy_table = models.IntegerField(
        choices=list(BookingAddressLegacyTable.choices.items()), null=True, blank=True
    )
    legacy_jobnumber = models.IntegerField(null=True, blank=True)
    legacy_stop_number = models.IntegerField(null=True, blank=True)

    class Meta(DefaultPermissionsMeta):
        db_table = "scbp_core_booking_address"
        ordering = ["booking_additional_stops__stop_number"]
        indexes = [models.Index(fields=["suburb"])]
        constraints = [
            get_choices_check_constraint(
                BookingAddressLegacyTable.choices,
                "legacy_table",
                "scbp_core_booking_address_legacy_table_valid",
            ),
            models.UniqueConstraint(
                fields=["legacy_table", "legacy_jobnumber", "legacy_stop_number"],
                name="legacy_booking_unique",
            ),
        ]

    def __str__(self):
        if self.place_name:
            return f"{self.place_name}, {self.formatted_address}"
        return self.formatted_address


BOOKING_NUMBER_STARTING_FROM = 2000000


class BookingQuerySet(models.QuerySet):
    def exclude_unverified(self):
        return self.exclude(
            booking_status__in=[
                BookingStatus.UNVERIFIED,
                BookingStatus.CHANGED,
                BookingStatus.CANCELLED,
            ]
        )

    def filter_by_client_access(self, client_user_id):
        """Select bookings client has access to either directly or by being account admin"""
        return self.filter(
            Q(client_user_id=client_user_id)
            | Q(
                account__account_to_client__is_account_admin=True,
                account__account_to_client__client_user_id=client_user_id,
            )
        )

    def annotate_interstate(self):
        return self.annotate(
            is_booking_interstate=models.Case(
                models.When(
                    ~Q(from_address__postal_code__startswith="3")
                    & ~Q(destination_address__postal_code__startswith="3"),
                    then=models.Value(True),
                ),
                default=models.Value(False),
                output_field=models.BooleanField(),
            )
        )

    def sort_by_interstate(self):
        return self.annotate_interstate().order_by(
            "-is_booking_interstate", "travel_on"
        )

    def dispatch_annotations(self):
        return (
            self.annotate_interstate()
            .annotate(
                num_additional_stops=models.Count("additional_stops__id"),
                dispatch_category=models.Case(
                    models.When(
                        is_booking_interstate=True, then=models.Value("interstate")
                    ),
                    models.When(is_time_tba=True, then=models.Value("tba")),
                    models.When(out_of_area=True, then=models.Value("outOfArea")),
                    models.When(
                        booking_type=BookingType.HOURLY, then=models.Value("hold")
                    ),
                    models.When(
                        Q(vehicle_class__is_any_class=False)
                        | Q(vehicle_color__isnull=False)
                        | Q(requires_wedding_ribbons=True)
                        | Q(forward_facing_baby_seat_count__gt=0)
                        | Q(rear_facing_baby_seat_count__gt=0)
                        | Q(booster_seat_count__gt=0)
                        | Q(requires_car_park_pass=True),
                        then=models.Value("request"),
                    ),
                    default=models.Value("normal"),
                    output_field=models.CharField(),
                ),
                computed_passenger_name=models.Case(
                    models.When(~Q(passenger_name=""), then=F("passenger_name")),
                    models.When(
                        passenger__isnull=False,
                        then=Concat(
                            "passenger__first_name", Value(" "), "passenger__last_name"
                        ),
                    ),
                    default=Concat(
                        "client_user__first_name", Value(" "), "client_user__last_name"
                    ),
                ),
                booking_priority=F("client_user__priority"),
                from_suburb=F("from_address__suburb"),
                to_suburb=models.Case(
                    models.When(
                        num_additional_stops__gt=0,
                        destination_address__isnull=False,
                        then=Concat(
                            models.Value("+"),
                            F("num_additional_stops"),
                            models.Value(" "),
                            F("destination_address__suburb"),
                        ),
                    ),
                    models.When(
                        destination_address__isnull=False,
                        then=F("destination_address__suburb"),
                    ),
                    default=models.Value("As Directed"),
                    output_field=models.CharField(),
                ),
                car=F("vehicle_class__abbreviation"),
                pay=models.Case(
                    models.When(
                        booking_payment_method=BookingPaymentMethod.DRIVER_COLLECT,
                        then=models.Value("Driver Collect"),
                    ),
                    models.When(account__isnull=True, then=models.Value("Unknown")),
                    models.When(
                        account__payment_method=AccountPaymentMethodType.INVOICE,
                        then=models.Value("On Account"),
                    ),
                    default=models.Value("CCOF"),
                    output_field=models.CharField(),
                ),
                driver_number=F("driver__driver_no"),
                vehicle_color_present=models.Case(
                    models.When(vehicle_color__isnull=True, then=False),
                    default=True,
                    output_field=models.BooleanField(),
                ),
                vehicle_color_abbreviation=F("vehicle_color__color_abbreviation"),
            )
            .prefetch_related("additional_stops")
        )

    def dispatch_select_related(self):
        return self.select_related(
            "from_address",
            "destination_address",
            "vehicle_class",
            "vehicle_color",
            "client_user",
            "account",
            "driver",
            "price_list",
        )

    def delete(self):
        self.update(booking_status=BookingStatus.CANCELLED)


class Booking(TimestampFieldsMixin):
    objects = BookingQuerySet.as_manager()

    audit_fields = [
        "supplier_confirmation_number",
        "passenger_name",
        "passenger",
        "travel_on",
        "pickup_time",
        "is_time_tba",
        "passenger_count",
        "child_under8_count",
        "baggage_count",
        "booking_type",
        "hourly_booking_duration",
        "from_address",
        "destination_address",
        "vehicle_class",
        "vehicle_color",
        "booster_seat_count",
        "forward_facing_baby_seat_count",
        "rear_facing_baby_seat_count",
        "requires_wedding_ribbons",
        "requires_car_park_pass",
        "driver",
        "driver_notes",
        "office_notes",
        "admin_general_notes",
        "signboard_text",
        "purchase_order_number",
        "convoy_number",
        "run_number",
        "booking_status",
        "office_notes",
        "from_flight_number",
        "from_airport_arrival_after_landing",
        "destination_airport_terminal",
        "destination_flight_departure_time",
        "booking_payment_method",
        "driver_collect_method",
        "pencil_note",
        # "additional_stops", # these six fields are audited by hard-coded instructions in the audit generator
        # "price_variations",
        # "out_of_pockets",
        # "price_total",
        # "from_address_instructions", # these two fields are pseudo-fields used to audit address instructions
        # "destination_address_instructions",
    ]

    # ====== UNEDITABLE IDENTIFIER ======
    booking_number = models.IntegerField(editable=False, db_index=True, unique=True)

    # ====== BOOKING ESSENTIALS ======
    account = models.ForeignKey(Account, on_delete=models.PROTECT)
    client_user = models.ForeignKey(
        ClientUser, on_delete=models.PROTECT, related_name="bookings"
    )

    passenger = models.ForeignKey(
        ClientUser,
        null=True,
        blank=True,
        on_delete=models.PROTECT,
        related_name="rides",
    )
    passenger_name = models.CharField(max_length=settings.MAX_LENGTH_NAME, blank=True)
    passenger_phone = PhoneNumberField(blank=True)

    passenger_count = models.PositiveSmallIntegerField()
    # Only entered on admin create booking screen currently
    child_under8_count = models.PositiveSmallIntegerField(
        null=True, blank=True, verbose_name="Child under 8 count"
    )
    baggage_count = models.PositiveSmallIntegerField()

    travel_on = models.DateTimeField(db_index=True)
    is_time_tba = models.BooleanField(default=False)

    # Hourly booking specific field
    booking_type = models.PositiveSmallIntegerField(
        choices=BookingType.choices.items(), default=BookingType.ONE_WAY
    )
    hourly_booking_duration = models.DurationField(null=True, blank=True)

    # ====== ADDRESS RELATED ======
    from_address_type = models.PositiveSmallIntegerField(
        choices=BookingAddressType.choices.items(), default=BookingAddressType.CUSTOM
    )
    from_address = models.ForeignKey(
        BookingAddress, on_delete=models.PROTECT, related_name="+"
    )
    # Only applicable if address type is airport
    from_flight_number = models.CharField(max_length=50, blank=True)
    from_airport_driver_required_on_landing = models.BooleanField(default=False)
    from_airport_arrival_after_landing = models.PositiveSmallIntegerField(
        choices=AIRPORT_WAIT_TIMES, default=0
    )
    from_airport_notes_for_driver = models.TextField(blank=True)

    # One way trip specific fields
    destination_address_type = models.PositiveSmallIntegerField(
        choices=BookingAddressType.choices.items(),
        null=True,
        blank=True,
        default=BookingAddressType.CUSTOM,
    )
    destination_address = models.ForeignKey(
        BookingAddress,
        on_delete=models.PROTECT,
        related_name="+",
        null=True,
        blank=True,
    )
    # Only applicable if address type is airport
    destination_airport_terminal = models.PositiveSmallIntegerField(
        choices=AirportTerminal.choices.items(), null=True, blank=True
    )
    destination_flight_departure_time = models.TimeField(blank=True, null=True)

    additional_stops = models.ManyToManyField(
        BookingAddress,
        through="BookingAdditionalStop",
        through_fields=("booking", "address"),
    )

    # ====== VEHICLE OPTIONS ======
    vehicle_class = models.ForeignKey(
        "scbp_core.VehicleClass", on_delete=models.PROTECT
    )
    vehicle_color = models.ForeignKey(
        "scbp_core.VehicleColor", on_delete=models.PROTECT, blank=True, null=True
    )
    booster_seat_count = models.PositiveSmallIntegerField(default=0)
    forward_facing_baby_seat_count = models.PositiveSmallIntegerField(default=0)
    rear_facing_baby_seat_count = models.PositiveSmallIntegerField(default=0)
    requires_wedding_ribbons = models.BooleanField(default=False)
    # Implemented as generic car park pass but currently it's usage is specific to BHP. We
    # may refactor this one day to have a generic name or a name that's based on the client
    # account.
    requires_car_park_pass = models.BooleanField(verbose_name="BHP Pass", default=False)

    #  ====== PRICES ======
    #  Reverse relation from BookingPriceVariation. Accessible via self.price_variations.all()
    price_total = CurrencyValueField(blank=True, null=True, editable=False)
    driver_value = CurrencyValueField(blank=True, default=Decimal(0), editable=False)
    price_breakdown = models.JSONField(
        default=dict, blank=True, editable=False, encoder=DecimalJSONEncoder
    )
    invoice_breakdown = models.JSONField(
        default=dict, blank=True, editable=False, encoder=DecimalJSONEncoder
    )

    # ====== HELPFUL NOTES ======
    driver_notes = models.TextField(blank=True)
    office_notes = models.TextField(blank=True)
    # These are for admin use only, not to be exposed to client
    admin_general_notes = models.TextField("General Notes", blank=True)
    signboard_text = models.CharField(max_length=255, blank=True)
    purchase_order_number = models.CharField(max_length=255, blank=True)

    # ====== RECORD KEEPING ======
    # Not setting null=True on this because we're adding a price list on save
    price_list = models.ForeignKey(PriceList, on_delete=models.PROTECT, blank=True)
    # Denormalization to reduce number of calls to Google location API
    # blank=True allows record to validate without this flag being expressly provided
    # (it is not expected that this flag will be sent by the client)
    # (default) null=False because we set this on save
    out_of_area = models.BooleanField(blank=True)
    booking_time = models.DateTimeField(auto_now_add=True)
    booking_method = models.PositiveSmallIntegerField(
        choices=BookingMethod.choices.items(),
        default=BookingMethod.PHONE,
        db_index=True,
    )
    created_by = models.ForeignKey(
        "scbp_core.User", on_delete=models.PROTECT, related_name="created_bookings"
    )
    driver = models.ForeignKey(
        "scbp_core.DriverUser", on_delete=models.PROTECT, blank=True, null=True
    )
    requested_driver = models.ForeignKey(
        "scbp_core.DriverUser",
        on_delete=models.PROTECT,
        blank=True,
        null=True,
        related_name="requested_driver",
    )
    vehicle = models.ForeignKey(
        Vehicle, on_delete=models.SET_NULL, blank=True, null=True
    )
    booking_status = models.PositiveSmallIntegerField(
        choices=BookingStatus.choices.items(),
        default=BookingStatus.UNVERIFIED,
        db_index=True,
    )

    dropoff_time = models.DateTimeField(blank=True, null=True)
    total_distance = models.DecimalField(
        max_digits=5, decimal_places=1, default=Decimal(0)
    )
    wait_time = models.DurationField(default=timedelta)
    pickup_time = models.DateTimeField(blank=True, null=True)
    supplier_confirmation_number = models.CharField(
        max_length=100,
        blank=True,
        help_text="Confirmation number from external supplier, eg. for interstate bookings",
    )
    booking_payment_method = models.PositiveSmallIntegerField(
        choices=BookingPaymentMethod.choices.items(),
        default=BookingPaymentMethod.CREDIT_CARD,
    )
    driver_collect_method = models.PositiveSmallIntegerField(
        choices=BookingDriverCollectMethod.choices.items(),
        default=BookingDriverCollectMethod.NONE,
    )

    #  ===== DISPATCH =====
    run_number = models.PositiveSmallIntegerField(blank=True, null=True)
    convoy_number = models.CharField(max_length=10, blank=True)
    pencil_note = models.CharField(max_length=10, blank=True)

    #  ===== LEGACY =====
    # PK into legacy tblBookings table
    legacy_jobnumber = models.IntegerField(null=True, blank=True)
    legacy_price_breakdown = models.JSONField(
        default=dict, blank=True, editable=False, encoder=DecimalJSONEncoder
    )
    legacy_review_status = models.PositiveSmallIntegerField(
        choices=LegacyReviewStatus.choices.items(),
        default=LegacyReviewStatus.NOT_REVIEWED,
    )
    # This is just used to track future bookings that were imported but had an invalid address
    legacy_has_invalid_address = models.BooleanField(default=False)

    # If this is true all pricing calculation, invoicing etc all happen
    # via the legacy system and we should never alter it
    is_managed_in_legacy = models.BooleanField(default=False, blank=True)
    # If this is true we recalculate pricing once on creation and add
    # a variation to make the pricing match the old system.
    is_matching_legacy_pricing = models.BooleanField(default=False, blank=True)

    # Track the booking SMS Celery task ID so we can revoke etc
    sms_confirmation_task_id = models.CharField(max_length=64, blank=True)

    class Meta(DefaultPermissionsMeta):
        db_table = "scbp_core_booking"
        default_related_name = "bookings"
        indexes = [
            models.Index(fields=["booking_status", "driver", "travel_on"]),
        ]
        constraints = [
            get_choices_check_constraint(
                BookingAddressType.choices,
                "from_address_type",
                "scbp_core_booking_from_address_type_valid",
            ),
            get_choices_check_constraint(
                BookingAddressType.choices,
                "destination_address_type",
                "scbp_core_booking_destination_address_type_valid",
            ),
            get_choices_check_constraint(
                BookingType.choices,
                "booking_type",
                "scbp_core_booking_booking_type_valid",
            ),
            get_choices_check_constraint(
                BookingPaymentMethod.choices,
                "booking_payment_method",
                "scbp_core_booking_booking_payment_method_valid",
            ),
            get_choices_check_constraint(
                LegacyReviewStatus.choices,
                "legacy_review_status",
                "scbp_core_booking_legacy_review_status_valid",
            ),
        ]

    def __str__(self):
        return str(self.booking_number)

    def clean(self):
        with raise_validation_errors(super().clean) as ve:
            with ve.capture_validation_error():
                self._validate()

    @staticmethod
    def _have_fields_changed(changed_fields, *, only=None, exclude=None):
        keys = set(changed_fields.keys())
        only_keys = set(only) if only else keys
        exclude_keys = set(exclude) if exclude else set()
        return bool((keys & only_keys) - exclude_keys)

    def _has_price_breakdown_field_changed(self, old_value, new_value):
        # If only one value is given, the field has changed
        if (old_value and not new_value) or (new_value and not old_value):
            return True
        # If neither value is given, the field has not changed
        if not (old_value or new_value):
            return False
        # Most type mismatches are indicia of change
        if type(old_value) is not type(new_value):
            # The exception is Decimal -> String conversion
            if not (isinstance(old_value, str) and isinstance(new_value, Decimal)):
                return True
        # If the new value is a decimal, the old value is a string - convert old value to decimal then compare
        if isinstance(new_value, Decimal):
            return Decimal(old_value) != new_value
        # If values are dicts, run the detection recursively and return if any change is detected
        if isinstance(old_value, dict):
            for key in old_value:
                if self._has_price_breakdown_field_changed(
                    old_value.get(key, None), new_value.get(key, None)
                ):
                    return True
            return False
        # If values are lists (element shape [description, amount]), sort the lists, reshape the amounts, then compare
        if isinstance(old_value, list):
            old_list = [[item[0], Decimal(item[1])] for item in sorted(old_value)]
            return old_list != sorted(new_value)
        # For all other cases, compare the values directly
        return old_value != new_value

    def get_changed_fields(self):
        """
        If any fields have changed since the last save, return the fields that have changed
        :return: Dict(changed_field_name -> (old_value, new_value))
        Empty if record is new or nothing has changed since last save
        """
        changed_fields = {}
        if self.pk:
            old = Booking.objects.get(pk=self.pk)
            for field in Booking._meta.get_fields():
                old_value = getattr(old, field.name, None)
                new_value = getattr(self, field.name, None)
                if field.name in ["from_address", "destination_address"]:
                    # Check whether the address has actually changed
                    # If the source ids are identical, there has been no change
                    if getattr(old_value, "source_id", None) != getattr(
                        new_value, "source_id", None
                    ):
                        changed_fields[field.name] = (
                            getattr(old_value, "formatted_address", None),
                            getattr(new_value, "formatted_address", None),
                        )
                    if getattr(old_value, "address_instructions", None) != getattr(
                        new_value, "address_instructions", None
                    ):
                        changed_fields[f"{field.name}_instructions"] = (
                            getattr(old_value, "address_instructions", None),
                            getattr(new_value, "address_instructions", None),
                        )
                elif field.name == "price_breakdown":
                    # Detect whether the price breakdown actually changed
                    # Can't use == here because the value types don't match
                    # (old_value uses strings, new_value uses Decimals)
                    has_breakdown_changed = self._has_price_breakdown_field_changed(
                        old_value, new_value
                    )
                    if has_breakdown_changed:
                        changed_fields[field.name] = (old_value, new_value)
                elif old_value != new_value:
                    if getattr(field, "choices", None):
                        # If the field has 'choices' set, we want the choice name rather than the choice value
                        changed_fields[field.name] = (
                            dict(field.choices).get(old_value, None),
                            dict(field.choices).get(new_value, None),
                        )
                    else:
                        changed_fields[field.name] = (old_value, new_value)

        return changed_fields

    def update_from_calculator(self, calculator):
        """
        Updates the price_total, price_breakdown, invoice_breakdown, and driver_value from the given calculator
        Direct assignment of the relevant fields is strongly discouraged
        (doing so risks these values getting out of sync with each other)
        :param calculator: The calculator to use to populate the values given above
        """
        self.price_total = calculator.total()
        self.price_breakdown = calculator.price_breakdown()
        self.invoice_breakdown = calculator.invoice_breakdown()
        self.driver_value = Decimal(self.invoice_breakdown.get("driver_value", 0))

    def should_recalculate_price(self) -> bool:
        return self.booking_status != BookingStatus.COMPLETED

    def save(self, *args, prepay=False, is_legacy_import=False, **kwargs):
        """
        Saves the record.
        Sends a SMS to client if status changes from anything to CONFIRMED regardless of what triggered said change
        :param args:
        :param prepay: True if the booking should change from not prepaid to prepaid, False otherwise. Has no effect
            on completed bookings or bookings that are already prepaid
        :param is_legacy_import: True if this booking is being saved as part of import. Bypasses email and invoice creation.
        :param kwargs:
        :return:
        """
        if not is_legacy_import:
            self._validate()

        # Also assign the price list
        # TODO: (Phase 2) Account for adjustments that reset the price list
        if not hasattr(self, "price_list"):
            self.price_list = PriceList.get_current(travel_date=self.travel_on)
        # And the out of area flag
        # TODO (Phase 2) Account for adjustments that reset the out of area flag
        if self.out_of_area is None:
            self.out_of_area = self.is_out_of_area()

        # Get the field changes on this save
        changed_fields = self.get_changed_fields()

        # --- Any changes that are contingent on other changed fields go here --- #
        # --- Mind the order - earlier changes could impact later changes --- #

        # Handle status changes on record change
        driver_to_cancel = None
        if self.booking_status == BookingStatus.CANCELLED and self.driver:
            if "driver" in changed_fields:
                # If (somehow) we manage to both change the driver and set the status to changed/cancelled,
                # send cancellation to old driver
                driver_to_cancel = Booking.objects.get(id=self.id).driver
            else:
                driver_to_cancel = self.driver
            self.driver = None

        if (
            not self.vehicle
            and self.driver
            and (self.pickup_time or self.booking_status == BookingStatus.COMPLETED)
        ):
            self.vehicle = self.driver.current_vehicle

        if self.legacy_has_invalid_address and self.price_breakdown:
            # Once address has been fixed it will have a breakdown and we can unflag it
            self.legacy_has_invalid_address = False

        # Generate the booking number which should be unique. If there is already the same
        # number on save an IntegrityError will be thrown and the retry_fn will try again.
        def generate_booking_number():
            qs = Booking.objects.aggregate(last_booking_number=Max("booking_number"))
            booking_number = (
                qs.get("last_booking_number") or BOOKING_NUMBER_STARTING_FROM
            ) + 1
            self.booking_number = booking_number
            super(Booking, self).save(*args, **kwargs)

        if not self.booking_number:
            retry_fn(generate_booking_number, (IntegrityError,), 10)
        else:
            # Save the record with any modifications as above
            super().save()

        if (
            "booking_status" in changed_fields
            and changed_fields["booking_status"][1]
            == BookingStatus.choices[BookingStatus.CONFIRMED]
            and not self.is_managed_in_legacy
            and not is_legacy_import
        ):
            schedule_driver_confirmation_notice(self)

        # If there's a pending confirmation SMS and travel on has changed
        # then send a new confirmation. This is necessary as the timing of
        # the SMS depends on the travel on time.
        if (
            self.sms_confirmation_task_id
            and "travel_on" in changed_fields
            and self.booking_status == BookingStatus.CONFIRMED
        ):
            schedule_driver_confirmation_notice(self)

        # Send cancellation text to driver if appropriate
        if driver_to_cancel and not is_legacy_import and not self.is_managed_in_legacy:
            send_cancellation_to_driver(self, driver_to_cancel)

        # Create the invoice for the booking
        should_invoice = (
            prepay
            or self.booking_status == BookingStatus.COMPLETED
            or self.invoices.count() > 0
        )
        if should_invoice and not is_legacy_import and not self.is_managed_in_legacy:
            from scbp_core.services.invoicing import create_invoice_for_booking

            create_invoice_for_booking(self)

    def delete(self, using=None, keep_parents=False):
        self.booking_status = BookingStatus.CANCELLED
        self.save()

    def decline(self, declined_by):
        BookingLog.objects.create(
            user=declined_by,
            booking=self,
            description="Booking declined",
            source="Admin",
        )
        self.booking_status = BookingStatus.CANCELLED
        self.save()
        send_booking_declined_email(self)

    def cancel(self, cancelled_by, notes=None):
        description = "Booking cancelled"
        if notes is not None:
            description = f"Booking cancelled - {notes}"

        BookingLog.objects.create(
            user=cancelled_by,
            booking=self,
            description=description,
            source="Admin",
        )
        self.booking_status = BookingStatus.CANCELLED
        self.save()
        send_booking_cancelled_email(self)

    def reinstate_cancelled_booking(self, reinstated_by):
        today = timezone.now()

        if self.travel_on < today:
            with raise_validation_errors() as ve:
                ve.add_error(
                    None, "You cannot reinstate a cancelled booking that is in the past"
                )
        if self.booking_status is not BookingStatus.CANCELLED:
            with raise_validation_errors() as ve:
                ve.add_error(
                    None,
                    "You cannot reinstate a booking that hasn't been cancelled",
                )

        BookingLog.objects.create(
            user=reinstated_by,
            booking=self,
            description="Booking reinstated from cancelled",
            source="Admin",
        )

        self.booking_status = BookingStatus.UNVERIFIED
        self.save()

    def get_vehicle_operator(self):
        if self.vehicle:
            return self.vehicle.vehicle_operator
        return None

    @staticmethod
    def _is_address_interstate(address):
        postal_code = getattr(address, "postal_code", None)
        return postal_code and postal_code[0] != "3"

    def is_address_out_of_area(self, address, price_list=None):
        if not price_list:
            price_list = self.price_list
        area_boundary_km = price_list.out_of_area_boundary_km
        return address.source_id and (
            distance_between(
                MELBOURNE_GPO_PLACE_ID,
                address.source_id,
                MELBOURNE_GPO_ADDRESS,
                address.formatted_address,
                on_place_update=on_place_update,
            )
            > area_boundary_km
        )

    def is_interstate(self):
        try:
            return self._is_address_interstate(self.from_address) and (
                self.booking_type == BookingType.HOURLY
                or self._is_address_interstate(self.destination_address)
            )
        except (
            Booking.from_address.RelatedObjectDoesNotExist,
            Booking.destination_address.RelatedObjectDoesNotExist,
        ):
            return False

    def is_out_of_area(self, *, use_cache=True):
        if not use_cache or self.out_of_area is None:
            # Get the distances from Google if expressly requested or
            # if out_of_area flag is None (False is a valid set flag)
            addresses = [
                address
                for address in [
                    self.from_address,
                    self.destination_address,
                    *(self.additional_stops.all() if self.pk else []),
                ]
                if address
            ]
            for address in addresses:
                if self.is_address_out_of_area(address):
                    # Short-circuit return True if any address is out of area
                    return True
            # If none of the addresses are out of area, or if there are no addresses,
            # this booking is a metro booking
            return False
        return self.out_of_area

    def get_distance(self, additional_stops=None) -> Decimal:
        from scbp_core.models import DistanceOverride

        if self.booking_type == BookingType.HOURLY:
            return Decimal(0)
        if not self._state.adding and additional_stops is None:
            additional_stops = self.additional_stops.all()

        locations = []
        if self.from_address_type == BookingAddressType.AIRPORT:
            locations.append((AIRPORT_SOURCE_ID, AIRPORT_POSTCODE, "", AIRPORT_ADDRESS))
        else:
            locations.append(
                (
                    self.from_address.source_id,
                    self.from_address.postal_code,
                    self.from_address.suburb,
                    self.from_address.formatted_address,
                )
            )
        if additional_stops:
            locations = locations + [
                (
                    stop.source_id,
                    stop.postal_code,
                    stop.suburb,
                    stop.formatted_address,
                )
                for stop in additional_stops
            ]
        if self.destination_address_type == BookingAddressType.AIRPORT:
            locations.append((AIRPORT_SOURCE_ID, AIRPORT_POSTCODE, "", AIRPORT_ADDRESS))
        elif self.destination_address:
            locations.append(
                (
                    self.destination_address.source_id,
                    self.destination_address.postal_code,
                    self.destination_address.suburb,
                    self.destination_address.formatted_address,
                )
            )

        # Select candidate distance overrides based on postcodes only using a single db query
        # We'll narrow this down based on suburb further
        postcodes = [location[1] for location in locations]
        override_by_postcodes = DistanceOverride.get_override_by_postcodes(
            tuple(zip(postcodes, postcodes[1:]))
        )

        distances = []
        for start, end in zip(locations, locations[1:]):
            from_source, from_postcode, from_suburb, from_address = start
            to_source, to_postcode, to_suburb, to_address = end
            key = (str(from_postcode), str(to_postcode))
            # Match on postcode + suburb
            high_match = None
            # Match on postcode + suburb on from OR to and postcode + empty suburb on other
            medium_match = None
            # Match on postcode only with from/to suburb blank
            low_match = None
            for override in override_by_postcodes[key]:
                from_match = override.from_suburb.lower() == from_suburb.strip().lower()
                to_match = override.to_suburb.lower() == to_suburb.strip().lower()
                if from_match and to_match:
                    high_match = override
                elif (
                    from_match
                    and not override.to_suburb
                    or to_match
                    and not override.from_suburb
                ):
                    medium_match = override
                elif not override.to_suburb and not override.from_suburb:
                    low_match = override
            matched_override = high_match or medium_match or low_match
            if matched_override:
                distances.append(matched_override.fixed_distance)
            else:
                distances.append(
                    distance_between(
                        from_source,
                        to_source,
                        from_address,
                        to_address,
                        on_place_update=on_place_update,
                    )
                )

        return sum(distances)

    def get_long_payment_type(self):
        if self.booking_payment_method == BookingPaymentMethod.DRIVER_COLLECT:
            if self.driver_collect_method == BookingDriverCollectMethod.CABCHARGE:
                return "Driver Collect - Cabcharge"
            elif self.driver_collect_method == BookingDriverCollectMethod.CAB_CARD:
                return "Driver Collect - Credit Card"
            elif self.driver_collect_method == BookingDriverCollectMethod.CAB_CASH:
                return "Driver Collect - Cash"
        if not self.account:
            return "Unknown"
        if self.account.payment_method == AccountPaymentMethodType.INVOICE:
            return "Invoice"
        if self.account.payment_terms == AccountPaymentTermsType.THIRTY_DAYS:
            return "EOM Credit Card"
        return "Credit Card on File"

    def get_long_booking_payment_type(self):
        if self.booking_payment_method == BookingPaymentMethod.DRIVER_COLLECT:
            if self.driver_collect_method == BookingDriverCollectMethod.CABCHARGE:
                return "To be paid to driver by Cabcharge"
            if self.driver_collect_method == BookingDriverCollectMethod.CAB_CARD:
                return "To be paid to driver by Credit Card"
            if self.driver_collect_method == BookingDriverCollectMethod.CAB_CASH:
                return "To be paid to driver by cash"
        if not self.account:
            return "Unknown"
        if self.account.payment_method == AccountPaymentMethodType.INVOICE:
            return "End of Month Invoice"
        if self.account.payment_terms == AccountPaymentTermsType.THIRTY_DAYS:
            return "End of Month Credit Card Account"
        return "Credit Card on File"

    def get_short_payment_type(self):
        if self.booking_payment_method == BookingPaymentMethod.DRIVER_COLLECT:
            if self.driver_collect_method == BookingDriverCollectMethod.CABCHARGE:
                return "DCAB"
            elif self.driver_collect_method == BookingDriverCollectMethod.CAB_CARD:
                return "DCC"
            elif self.driver_collect_method == BookingDriverCollectMethod.CAB_CASH:
                return "DCAS"
        if not self.account:
            return "UNK"
        if self.account.payment_method == AccountPaymentMethodType.INVOICE:
            return "AC"
        if self.account.payment_terms == AccountPaymentTermsType.THIRTY_DAYS:
            return "CC"
        return "CF"

    def get_driver_payment_type(self) -> str:
        """Return name of payment type for displaying to driver"""
        if self.booking_payment_method == BookingPaymentMethod.DRIVER_COLLECT:
            if self.driver_collect_method == BookingDriverCollectMethod.CABCHARGE:
                return "Driver Collect - Cabcharge"
            if self.driver_collect_method == BookingDriverCollectMethod.CAB_CARD:
                return "Driver Collect - Credit card"
            if self.driver_collect_method == BookingDriverCollectMethod.CAB_CASH:
                return "Driver Collect - Cash"
        if not self.account:
            return "Unknown"
        if self.account.payment_method == AccountPaymentMethodType.INVOICE:
            return "On Account"
        return "CCOF"

    def get_credit_card_type(self):
        if (
            not self.account
            or self.account.payment_method == AccountPaymentMethodType.INVOICE
        ):
            return "None"
        return self.account.credit_card_type

    def set_additional_stops(self, additional_stops):
        self.additional_stops.clear()
        for index, stop in enumerate(additional_stops):
            self.additional_stops.add(stop, through_defaults={"stop_number": index + 1})

    def is_with_pass(self) -> bool:
        """
        :return: True if the booking is associated with a corporate car park pass, False otherwise
        """
        return self.requires_car_park_pass

    def get_refund_amounts(self, amount):
        """
        Takes the given amount and determines the previous transactions to apply
        the refund to (with amounts) to implement a refund of the given amount
        :param amount: The amount to be refunded from this booking
        :return: A list of [transaction_id, refund_amount, surcharge_rate] with the
            eWay transaction ID, amount to be refunded, and applicable surcharge rate
            to apply to the refund
        """
        invoices = (
            self.invoices.with_successful_credit_card_charge().order_by_payment_date()
        )
        remaining_amount = amount
        available_refunds = []
        for invoice in invoices:
            available_refund_amount = invoice.get_available_for_refund()
            if available_refund_amount > 0:
                available_refunds.append(
                    [
                        invoice.payment.transaction_id,
                        min(available_refund_amount, remaining_amount),
                        invoice.get_credit_card_surcharge_rate(),
                    ]
                )
                remaining_amount -= available_refund_amount
            if remaining_amount <= 0:
                break

        return available_refunds

    def _validate_hourly(self, ve):
        """Validate hourly booking"""
        if not self.hourly_booking_duration:
            ve.add_error("hourly_booking_duration", "This field is required")
        elif self.hourly_booking_duration < timedelta(hours=MIN_BOOKING_DURATION_HOURS):
            ve.add_error(
                "hourly_booking_duration",
                f"Booking duration must be at least {MIN_BOOKING_DURATION_HOURS} hours",
            )
        elif self.hourly_booking_duration > timedelta(hours=MAX_BOOKING_DURATION_HOURS):
            ve.add_error(
                "hourly_booking_duration",
                f"Booking duration must be {MAX_BOOKING_DURATION_HOURS} hours or less",
            )

    def _validate_one_way(self, ve):
        """Validate one way booking"""
        self._validate_airport_destination(ve)
        if self.destination_address_type is None:
            ve.add_error("destination_address_type", "This field is required")
        if not self.destination_address:
            ve.add_error("destination_address", "This field is required")
        if (
            self.destination_address
            and getattr(self, "from_address", None)
            # For legacy bookings we have no source id
            and self.destination_address.source_id
            and self.destination_address.source_id == self.from_address.source_id
        ):
            ve.add_error(
                "destination_address", "Pickup and drop off address cannot be the same"
            )

    def _validate_airport_destination(self, validation_errors):
        """Validate that the required fields for dropoff at the airport are present"""
        if self.destination_address_type == BookingAddressType.AIRPORT:
            if not self.destination_airport_terminal:
                validation_errors.add_error(
                    "destination_airport_terminal",
                    "Destination airport terminal must be given for drop-offs at the airport",
                )
            if not self.destination_flight_departure_time:
                validation_errors.add_error(
                    "destination_flight_departure_time",
                    "Departure time must be given for drop-offs at the airport",
                )

    def validate_lead_time(self, ve):
        """
        Validates we have enough lead time for user-initiated bookings
        Must be called manually - including this in _validate causes this to be
        called on admin-initiated bookings, which is not what we want

        We create two error messages, one on the travel_on field which shows up if the user
        is on the travel details page and one on the record as a whole which shows up if the
        user is on the summary page.

        :param ve: Validation error object
        """
        if not self.travel_on:
            return
        now = timezone.localtime()
        if self.travel_on < now:
            ve.add_error(None, BOOKING_PAST_ERROR_MESSAGE)
        else:
            day_type = get_day_type(self.travel_on.date())
            lead_time = BookingLeadTime.get_lead_time_for(
                day_type=day_type, hour=now.hour
            )
            cutoff = now + lead_time
            if self.travel_on < cutoff:
                ve.add_error(None, BOOKING_TOO_CLOSE_ERROR_MESSAGE)

    def _validate(self):
        """Validation rules we must enforce before record can be saved to database"""
        with raise_validation_errors() as ve:
            # Verify based on hourly or one-way travel
            if self.booking_type == BookingType.HOURLY:
                self._validate_hourly(ve)
            if self.booking_type == BookingType.ONE_WAY:
                self._validate_one_way(ve)

            # Verify that we dont exceed total capacity of vehicle
            vehicle_class = getattr(self, "vehicle_class", None)
            if vehicle_class:
                # If vehicle class has been selected we know the limit
                passenger_count_limit = vehicle_class.max_passenger_count
                baggage_count_hard_limit = vehicle_class.max_baggage_count
            else:
                # Otherwise the limit should be the max out of the available options
                # This applies when validating booking at step 1 before vehicle class
                # has been chosen
                passenger_count_limit = VehicleClass.objects.aggregate(
                    passenger_count_limit=Max("max_passenger_count")
                )["passenger_count_limit"]
                baggage_count_hard_limit = VehicleClass.objects.aggregate(
                    baggage_count_limit=Max("max_baggage_count")
                )["baggage_count_limit"]

            if self.passenger_count and self.passenger_count > passenger_count_limit:
                ve.add_error(
                    "passenger_count",
                    f"Passenger count can be at most {passenger_count_limit}",
                )

            if self.baggage_count and self.baggage_count > baggage_count_hard_limit:
                ve.add_error(
                    "baggage_count",
                    f"Baggage count can be at most {baggage_count_hard_limit}",
                )

            if self.passenger_count and self.baggage_count:
                baggage_count_soft_limit = VehicleClass.objects.filter(
                    max_passenger_count__gte=self.passenger_count
                ).aggregate(baggage_count_limit=Max("max_baggage_count"))[
                    "baggage_count_limit"
                ]
                if (
                    not baggage_count_soft_limit
                    or self.baggage_count > baggage_count_soft_limit
                ):
                    ve.add_error(
                        "baggage_count",
                        f"Baggage count can be at most {baggage_count_soft_limit} when you have {self.passenger_count} passengers",
                    )

            if not self.passenger:
                if not self.passenger_name:
                    ve.add_error(
                        "passenger_name", "Please enter a name for the passenger"
                    )
                if not self.passenger_phone:
                    ve.add_error(
                        "passenger_phone",
                        "Please enter a phone number for the passenger",
                    )

            # Verify that we dont exceed baby capacity of vehicle
            if (
                vehicle_class
                and self.get_required_child_seat_count()
                > self.vehicle_class.max_child_seat_count
            ):
                field = "booster_seat"
                for name in [
                    "booster_seat_count",
                    "rear_facing_baby_seat_count",
                    "forward_facing_baby_seat_count",
                ]:
                    if getattr(self, name):
                        field = name
                        break
                ve.add_error(
                    field,
                    f"Selected vehicle accommodates up to {self.vehicle_class.max_child_seat_count} child seats.",
                )

            if (
                self.child_under8_count
                and self.get_required_child_seat_count() < self.child_under8_count
            ):
                field = "booster_seat_count"
                for name in [
                    "booster_seat_count",
                    "rear_facing_baby_seat_count",
                    "forward_facing_baby_seat_count",
                ]:
                    if getattr(self, name):
                        field = name
                        break
                ve.add_error(
                    field,
                    f"You must select {self.child_under8_count} child { 'seat' if self.child_under8_count == 1 else 'seats' } for your chosen number of children.",
                )

            if self.get_required_child_seat_count() > (self.child_under8_count or 0):
                ve.add_error(
                    "child_under8_count",
                    "You must select the same number of children as child seats required.",
                )

            if self.from_address_type == BookingAddressType.AIRPORT:
                if (
                    self.from_airport_arrival_after_landing == 0
                    and not self.from_airport_driver_required_on_landing
                ):
                    ve.add_error(
                        "from_airport_arrival_after_landing",
                        "Please choose how long after the driver should arrive.",
                    )

            if (
                self.booking_payment_method == BookingPaymentMethod.DRIVER_COLLECT
                and self.driver_collect_method == BookingDriverCollectMethod.NONE
            ):
                ve.add_error(
                    "driver_collect_method",
                    "Must be provided when Payment Method is Driver Collect.",
                )

    def get_required_child_seat_count(self):
        return sum(
            filter(
                None,
                [
                    self.forward_facing_baby_seat_count,
                    self.rear_facing_baby_seat_count,
                    self.booster_seat_count,
                ],
            )
        )

    def is_first_booking(self):
        """
        The first booking on the account is defined by the following rules:
            1: When two bookings are made on different dates, the booking made on the
                later date cannot be the first booking
            2: When two bookings are made on the same date, the booking with the
                later pick-up time cannot be the first booking
            3: When two bookings are made on the same date and have the same pick-up date and time,
                the booking made later in the day cannot be the first booking
            4: When two bookings are made at the exact same time and have the same pick-up date and time,
                neither booking can be the first booking
        :return: Whether this booking is the first booking on the account
        """
        return (
            not self.account.bookings.filter(
                Q(created_at__date__lt=self.created_at)
                | Q(created_at__date=self.created_at, travel_on__lt=self.travel_on)
                | Q(created_at__lte=self.created_at, travel_on=self.travel_on)
            )
            .exclude(pk=self.pk)
            .exists()
        )

    def is_modifiable_by_client(self) -> bool:
        """Is booking modifiable by client? Not applicable to changes made by staff"""
        now = timezone.localtime()
        cutoff = now + timezone.timedelta(hours=CLIENT_BOOKING_UPDATE_CUTOFF_HOURS)
        return self.travel_on >= cutoff and self.booking_status in (
            BookingStatus.UNVERIFIED,
            BookingStatus.VERIFIED,
            BookingStatus.CHANGED,
        )


class BookingLog(TimestampFieldsMixin):
    """
    This's not a real auditing log; we dont keep values before-n-after/fields for capacity to
    reconstruct - its a simple verbose timeline log to be viewed by end user, nothing more.

    records would be added by respective serializers' update(); we dont intend to keep a track
    for create() or delete().
    """

    user = models.ForeignKey(User, on_delete=CASCADE)
    booking = models.ForeignKey(Booking, on_delete=CASCADE)
    source = models.CharField(max_length=settings.MAX_LENGTH_SHORT_DESCRIPTION)
    description = models.TextField()

    class Meta(DefaultPermissionsMeta):
        db_table = "scbp_core_booking_log"


class BookingPriceVariation(models.Model):
    booking = models.ForeignKey(
        Booking, on_delete=models.PROTECT, related_name="price_variations"
    )
    variation_type = models.PositiveSmallIntegerField(
        choices=PriceVariationType.choices.items()
    )
    # Only used if variation_type is OTHER
    variation_type_other_description = models.CharField(blank=True, max_length=100)
    amount = CurrencyValueField()

    class Meta(DefaultPermissionsMeta):
        db_table = "scbp_core_booking_price_variation"
        constraints = [
            get_choices_check_constraint(
                PriceVariationType.choices,
                "variation_type",
                "scbp_core_booking_price_variation_valid",
            )
        ]

    def __str__(self):
        return f"{PriceVariationType.choices[self.variation_type]} - ${self.amount}"


class BookingOutOfPocket(models.Model):
    booking = models.ForeignKey(
        Booking, on_delete=models.PROTECT, related_name="out_of_pockets"
    )

    description = models.CharField(max_length=settings.MAX_LENGTH_SHORT_DESCRIPTION)
    amount = CurrencyValueField()

    class Meta(DefaultPermissionsMeta):
        db_table = "scbp_core_booking_out_of_pocket"

    def __str__(self):
        return f"{self.description} - ${self.amount}"


class BookingAdditionalStop(models.Model):
    booking = models.ForeignKey(
        Booking, on_delete=models.CASCADE, related_name="booking_additional_stops"
    )
    address = models.ForeignKey(
        BookingAddress,
        on_delete=models.CASCADE,
        related_name="booking_additional_stops",
    )
    stop_number = models.PositiveSmallIntegerField()
    is_pick_up = models.BooleanField(default=True)
    address_type = models.PositiveSmallIntegerField(
        choices=BookingAddressType.choices.items(), default=BookingAddressType.CUSTOM
    )

    class Meta(DefaultPermissionsMeta):
        db_table = "scbp_core_booking_additional_stop"
        ordering = ["stop_number"]
        constraints = [
            models.UniqueConstraint(
                fields=["booking", "stop_number"], name="booking_unique_stop_order"
            )
        ]

    def __str__(self):
        action = "Pickup" if self.is_pick_up else "drop off"
        return f"{self.stop_number}: {action} at {str(self.address)}"


class BookingLeadTime(models.Model):
    class Meta(DefaultPermissionsMeta):
        db_table = "scbp_core_booking_lead_time"
        constraints = [
            models.CheckConstraint(
                check=models.Q(**{"hour__in": range(24)}),
                name="scbp_core_booking_lead_time_hour_valid",
            ),
            models.UniqueConstraint(
                fields=["day_type", "hour"],
                name="scbp_core_booking_lead_time_unique_day_type_hour",
            ),
            get_choices_check_constraint(
                HourRateDayType.choices,
                "day_type",
                "scbp_core_booking_lead_time_day_type_valid",
            ),
        ]

    day_type = models.PositiveSmallIntegerField(choices=HourRateDayType.choices.items())
    hour = models.SmallIntegerField()
    lead_time = models.DurationField(default=BOOKING_LEAD_TIME)

    @classmethod
    @lru_cache(maxsize=96)
    def get_lead_time_for(cls, *, day_type, hour):
        return cls.objects.filter(day_type=day_type, hour=hour).first().lead_time
