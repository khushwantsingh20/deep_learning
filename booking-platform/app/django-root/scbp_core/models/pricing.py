from collections import defaultdict
from datetime import datetime
from decimal import Decimal
from functools import lru_cache
from typing import DefaultDict
from typing import Tuple

from django.conf import settings
from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from django.core.validators import MinValueValidator
from django.core.validators import RegexValidator
from django.db import models
from django.db import transaction
from django.db.models import CASCADE
from django.db.models import PROTECT
from django.db.models import Q
from django.db.models.manager import BaseManager
from django.utils import timezone

from scbp_core.fields import CurrencyValueField
from scbp_core.fields import get_choices_check_constraint
from scbp_core.fields import PercentageValueField
from scbp_core.models import VehicleClass
from scbp_core.models import VehicleClassPriceMixin
from scbp_core.models.account import Account
from scbp_core.models.pricing_type import HourRateDayType
from scbp_core.models.pricing_type import HourRateHourType
from scbp_core.permissions import DefaultPermissionsMeta

postcode_validator = RegexValidator(r"^\d+$", "Postcode must be numeric")


class PriceListQuerySet(models.QuerySet):
    def delete(self):
        raise ValueError("delete not supported")


class PriceList(models.Model):
    """PriceList only ever has one active current record and one active future record.
    The current PriceList record will have a is_current flag and the future record will
    have is_future and scheduled_from fields. A record can't be both is_current and is_future.

    This table records the settings used for pricing calculations. It acts as an audit trail of
    itself as each modification creates a new record.

    Updating price settings should result the creation of a new record

    Creating a booking will use the is_current PriceList unless:
        * The travel_on date falls within the scheduled_from date on the future record.
        * The scheduled_from date is today or passed, in which case the future record will
        become current and the old current record archived.
    """

    objects = BaseManager.from_queryset(PriceListQuerySet)()

    # Hourly settings
    hourly_initial_fee = CurrencyValueField(
        help_text="Initial fee for the period up to the value of Hourly Tier 1 Start At (eg. for the first hour). This is a fixed fee.",
        default=Decimal("88"),
    )
    hourly_tier1_start_at = models.PositiveSmallIntegerField(
        default=1,
        help_text="Where price per 10 minutes for tier 1 starts from. Ends at value of Hourly Tier 2 Start At",
    )
    hourly_tier2_start_at = models.PositiveSmallIntegerField(
        default=6,
        help_text="Where price per 10 minutes for tier 2 starts from. Every hour after this value is charged at hourly tier 2 rate",
    )
    block_size_minutes = models.PositiveSmallIntegerField(
        default=10,
        help_text="Number of minutes hourly block prices are charged for (eg. 10 minutes)",
    )
    hourly_tier1_rate_per_block = CurrencyValueField(
        default=Decimal("12"),
        help_text="Rate per block size for hours from Hourly Tier 1 Start At to Hourly Tier 2 Start at (eg. $X per 10 minutes from hour 1 - 6)",
    )
    hourly_tier2_rate_per_block = CurrencyValueField(
        default=Decimal("10"),
        help_text="Rate per block size for all hours after Hourly Tier 2 Start At (eg. $X per 10 minutes from hour 6+)",
    )

    # Surcharges, fees
    out_of_area_boundary_km = models.PositiveIntegerField(
        help_text="Number of km's from the GPO that determines the boundary for out of area rate",
        default=25,
    )
    interstate_fee = CurrencyValueField(
        default=Decimal("11"), help_text="Fee for interstate bookings"
    )
    airport_surcharge = CurrencyValueField(
        default=Decimal("5"),
        help_text="Fee for trips starting or ending at the airport",
    )
    government_booking_fee = CurrencyValueField(
        default=Decimal("1.10"), help_text="Government fees/taxes"
    )
    company_booking_fee = CurrencyValueField(
        default=Decimal("0.00"), help_text="Southern Cross booking fee"
    )
    airport_parking_fee = CurrencyValueField(
        default=Decimal("4.50"),
        help_text="Fee for parking at the airport while waiting to pick up passenger",
    )

    # Peak settings
    off_peak_discount_percentage = PercentageValueField(
        default=Decimal("5"),
        help_text="Percentage discount for trips made during off-peak hours",
    )
    peak_percent = PercentageValueField(
        default=Decimal("5"),
        help_text="Percentage surcharge for trips made during peak hours",
    )
    peak_max_amount = CurrencyValueField(
        default=Decimal("10"), help_text="Maximum peak trip surcharge"
    )
    out_of_hours_fee = CurrencyValueField(
        default=Decimal("11"),
        help_text="Fee for pickup outside of normal operating hours except on holidays",
    )
    public_holiday_out_of_hours_fee = CurrencyValueField(
        default=Decimal("16"),
        help_text="Fee for pickup outside of normal operating hours on holidays",
    )
    public_holiday_fee = CurrencyValueField(
        default=Decimal("11"),
        help_text="Fee for holiday pickup within normal operating hours",
    )

    # Minimum fees
    off_peak_minimum_fee = CurrencyValueField(
        default=Decimal("36"), help_text="Minimum base price for off-peak pickups"
    )
    standard_minimum_fee = CurrencyValueField(
        default=Decimal("55"), help_text="Minimum base price for standard/peak pickups"
    )
    saturday_night_minimum_fee = CurrencyValueField(
        default=Decimal("88"), help_text="Minimum base price for Saturday night pickups"
    )

    # Extra options
    wedding_ribbon_fee = CurrencyValueField(
        default=Decimal("44"), help_text="Fee for wedding ribbons on car"
    )
    child_seat_fee = CurrencyValueField(
        default=Decimal("11.00"), help_text="Fee per child seat"
    )
    additional_stop_fee = CurrencyValueField(
        default=Decimal("11"), help_text="Fee per additional stop"
    )
    color_selection_fee = CurrencyValueField(
        default=Decimal("22.00"),
        help_text="Fee to select car colour",
        verbose_name="Colour Selection Fee",
    )
    car_park_pass_fee = CurrencyValueField(
        default=Decimal("22.00"), help_text="Corporate Car Park pass fee"
    )

    # Rate Schedules
    rate_schedule_standard = PercentageValueField(
        default=Decimal("0"),
        min_value=-100,
        help_text="% Percentage rate adjustment apply to Standard accounts",
    )

    rate_schedule_retail = PercentageValueField(
        default=Decimal("10"),
        min_value=-100,
        help_text="% Percentage rate adjustment apply to Retail accounts",
    )

    rate_schedule_corporate = PercentageValueField(
        default=Decimal("-5"),
        min_value=-100,
        help_text="% Percentage rate adjustment apply to Corporate accounts",
    )

    rate_schedule_institution = PercentageValueField(
        default=Decimal("-10"),
        min_value=-100,
        help_text="% Percentage rate adjustment apply to Institution accounts",
    )

    # We use null to represent False so we can have a unique constraint on this field
    # There should only ever be 1 is_current=True, rest should be null
    is_current = models.BooleanField(default=True, null=True, unique=True)
    current_from = models.DateTimeField(auto_now_add=True)
    current_until = models.DateTimeField(null=True)
    # Future price list
    # The scheduled_from field will be used when creating a booking with a travel_on
    # date in the future to determine if the booking should use a future pricing record
    # or the current price record. If the travel_on falls within, the future record will
    # be used.
    #
    # We also check this field to move the future record to current if today's
    # date is within the scheduled date.
    scheduled_from = models.DateTimeField(null=True)
    # is_future will only ever have one record. As per is_current, this field has
    # a unique constraint and other records will be null.
    is_future = models.BooleanField(default=None, null=True)

    created_by = models.ForeignKey(
        get_user_model(),
        on_delete=models.PROTECT,
        null=True,
        help_text="User responsible for creating this record. May be null for initial system generated one.",
    )

    class Meta(DefaultPermissionsMeta):
        db_table = "scbp_core_price_list"
        unique_together = [["is_current", "is_future"]]

    def save(self, *args, save_existing=False, **kwargs):
        # Unless we explicitly opt to save existing record we always create a new record, closing
        # off the previous record
        with transaction.atomic():
            if not save_existing and self.pk:
                if not self.is_current and not self.is_future:
                    # Price lists that aren't current basically exist as audit trail - should not
                    # be able to update them
                    raise ValueError("Cannot update price list that is not current")
                if self.is_future and not self.scheduled_from:
                    raise ValueError(
                        "Cannot update future price list that doesn't have a scheduled date"
                    )

                existing = PriceList.objects.get(pk=self.pk)
                existing.current_until = timezone.now()
                existing.is_current = None
                if self.is_future:
                    existing.is_future = None
                    existing.save(save_existing=True)
                    self.is_future = True
                else:
                    existing.save(save_existing=True)
                    self.is_current = True

                self.pk = None
                self.current_until = None

            super().save(*args, **kwargs)

            if not save_existing:
                # in addition to this, we'll also want to relink ourselves with all vehicle classes
                # this should also cover cases where new class's being added etc
                pool = []
                fields = [f.attname for f in VehicleClassPriceMixin._meta.fields]
                for vc in VehicleClass.objects.all():
                    kwargs = {}
                    for f in fields:
                        kwargs[f] = getattr(vc, f)
                    pool.append(
                        VehicleClassPriceList(
                            price_list=self, vehicle_class=vc, **kwargs
                        )
                    )
                VehicleClassPriceList.objects.bulk_create(pool)

    def delete(self, using=None, keep_parents=False):
        raise ValueError("delete not supported")

    @staticmethod
    def _set_future_pricelist_as_current(obj):
        with transaction.atomic():
            existing = PriceList.objects.get(is_current=True)
            existing.current_until = timezone.now()
            existing.is_current = None
            existing.save(save_existing=True)
            obj.is_future = None
            obj.scheduled_from = None
            obj.is_current = True
            obj.save(save_existing=True)

    @classmethod
    def get_current(cls, travel_date=None):
        obj, created = cls.objects.get_or_create(is_current=True)

        # Get the future price list and check if it is scheduled from today onwards
        # Set the future price list as current if so.
        # if we are sent through a travel date, check whether the travel date is
        # within the future scheduled_from date if not, we just use the current price
        # list.
        try:
            future_obj = cls.objects.get(is_future=True, is_current=None)
            today = timezone.localtime(timezone.now())

            if future_obj.scheduled_from is not None:
                if future_obj.scheduled_from <= today:
                    cls._set_future_pricelist_as_current(future_obj)
                    return future_obj

            if travel_date is not None and future_obj.scheduled_from is not None:
                if future_obj.scheduled_from <= travel_date:
                    return future_obj
        except cls.DoesNotExist:
            pass

        return obj

    @classmethod
    def get_future(cls):
        obj, created = cls.objects.get_or_create(is_future=True, is_current=None)
        return obj


class HourRateType(models.Model):
    class Meta(DefaultPermissionsMeta):
        db_table = "scbp_core_hour_rate_type"
        constraints = [
            models.CheckConstraint(
                check=models.Q(**{"hour__in": range(24)}),
                name="scbp_core_pricing_hour_rate_hour_valid",
            ),
            models.UniqueConstraint(
                fields=["day_type", "hour"],
                name="scbp_core_pricing_hour_rate_unique_day_type_hour",
            ),
            get_choices_check_constraint(
                HourRateDayType.choices,
                "day_type",
                "scbp_core_pricing_hour_rate_day_type_valid",
            ),
            get_choices_check_constraint(
                HourRateHourType.choices,
                "hour_type",
                "scbp_core_pricing_hour_rate_hour_type_valid",
            ),
        ]

    day_type = models.PositiveSmallIntegerField(choices=HourRateDayType.choices.items())
    hour = models.SmallIntegerField()
    hour_type = models.PositiveSmallIntegerField(
        choices=HourRateHourType.choices.items(), default=HourRateHourType.STANDARD
    )

    @classmethod
    @lru_cache(maxsize=96)
    def get_hour_type_for(cls, *, day_type, hour):
        return cls.objects.filter(day_type=day_type, hour=hour).first().hour_type


class Holiday(models.Model):
    class Meta(DefaultPermissionsMeta):
        db_table = "scbp_core_holiday"
        ordering = ["date"]

    title = models.CharField(
        max_length=settings.MAX_LENGTH_NAME, help_text="Holiday name"
    )
    date = models.DateField(help_text="Holiday date including year", unique=True)

    @classmethod
    @lru_cache()
    def is_holiday(cls, date):
        return cls.objects.filter(date=date).exists()


class SpecialEventQuerySet(models.QuerySet):
    def events_for_datetime(self, pickup_time: datetime):
        date = pickup_time.date()
        time = pickup_time.time()
        return self.filter(date=date, start_time__lte=time, end_time__gte=time)

    def events_by_location(self, *, start=None, end=None):
        if not start and not end:
            return self
        elif start and not end:
            return self.filter(pickup_postcode__in=[start, "any"])
        elif end and not start:
            return self.filter(dropoff_postcode__in=[end, "any"])
        return self.filter(
            pickup_postcode__in=[start, "any"], dropoff_postcode__in=[end, "any"]
        )


class SpecialEvent(models.Model):
    class Meta(DefaultPermissionsMeta):
        db_table = "scbp_core_special_event"
        ordering = ["date", "start_time", "end_time"]

    objects = SpecialEventQuerySet.as_manager()
    special_event_postcode_validator = RegexValidator(
        r"^(\d+|(A|a)ny)$", "Postcode should be either numeric or 'any'"
    )

    title = models.CharField(
        max_length=settings.MAX_LENGTH_NAME, help_text="Special event name"
    )
    date = models.DateField(help_text="Special event date")
    start_time = models.TimeField(help_text="Special event pricing start time")
    end_time = models.TimeField(help_text="Special event pricing end time")
    pickup_postcode = models.CharField(
        max_length=settings.MAX_LENGTH_POSTCODE,
        help_text="Postcode for pick-ups associated with this event ('any' for all postcodes)",
        validators=[special_event_postcode_validator],
    )
    dropoff_postcode = models.CharField(
        max_length=settings.MAX_LENGTH_POSTCODE,
        help_text="Postcode for drop-offs associated with this event ('any' for all postcodes)",
        validators=[special_event_postcode_validator],
    )
    event_surcharge = CurrencyValueField(
        help_text="Surcharge applied to trips associated with this event"
    )
    event_minimum_hours = models.PositiveSmallIntegerField(
        default=0, help_text="Minimum number of chargeable hours"
    )
    event_minimum_charge = CurrencyValueField(
        default=Decimal("0.00"),
        help_text="Minimum base cost for bookings related to this event",
    )

    def save(self, *args, **kwargs):
        if self.pickup_postcode == "Any":
            self.pickup_postcode = "any"
        if self.dropoff_postcode == "Any":
            self.dropoff_postcode = "any"
        self.full_clean()
        super().save(*args, **kwargs)


class PriceOverrideQuerySet(models.QuerySet):
    def overrides_for_account_and_postcodes(
        self, *, account, from_postcode, to_postcode
    ):
        return self.filter(
            Q(account=account) | Q(account__isnull=True),
            from_postcode=from_postcode,
            to_postcode=to_postcode,
        )


class PriceOverride(models.Model):
    class Meta(DefaultPermissionsMeta):
        db_table = "scbp_core_price_override"
        constraints = [
            models.UniqueConstraint(
                fields=["account", "from_postcode", "to_postcode"],
                name="unique_account_and_postcodes",
            ),
            models.UniqueConstraint(
                fields=["from_postcode", "to_postcode"],
                name="unique_postcodes_for_any_account",
                condition=Q(account__isnull=True),
            ),
            models.CheckConstraint(
                check=Q(is_all_day=True)
                | Q(start_time__isnull=False, end_time__isnull=False),
                name="scbp_core_price_override_time_validation",
            ),
        ]

    objects = PriceOverrideQuerySet.as_manager()

    account = models.ForeignKey(Account, models.CASCADE, blank=True, null=True)
    from_postcode = models.CharField(
        max_length=settings.MAX_LENGTH_POSTCODE,
        help_text="Pick-up postcode",
        validators=[postcode_validator],
    )
    to_postcode = models.CharField(
        max_length=settings.MAX_LENGTH_POSTCODE,
        help_text="Drop-off postcode",
        validators=[postcode_validator],
    )
    start_time = models.TimeField(
        help_text="Earliest pick-up time", blank=True, null=True
    )
    end_time = models.TimeField(help_text="Latest pick-up time", blank=True, null=True)
    fixed_cost = CurrencyValueField(help_text="Fixed base price")
    is_all_day = models.BooleanField(
        help_text="Whether this override applies all day", default=False
    )

    def clean(self):
        errors = {}
        if not self.is_all_day:
            if not self.start_time:
                errors["start_time"] = ["Start time is required"]
            if not self.end_time:
                errors["end_time"] = ["End time is required"]
        if errors:
            raise ValidationError(errors)

    def save(self, **kwargs):
        # Remove times if all day flag is set
        if self.is_all_day:
            self.start_time = None
            self.end_time = None
        self.full_clean()
        return super().save(**kwargs)


class DistanceOverride(models.Model):
    class Meta(DefaultPermissionsMeta):
        db_table = "scbp_core_distance_override"
        constraints = [
            models.UniqueConstraint(
                fields=["from_postcode", "to_postcode", "from_suburb", "to_suburb"],
                name="scbp_core_distance_override_unique_postcodes",
            )
        ]

    from_suburb = models.CharField(
        max_length=settings.MAX_LENGTH_NAME,
        help_text="If provided match is done against postcode and exact match on suburb.",
        blank=True,
    )

    from_postcode = models.CharField(
        max_length=settings.MAX_LENGTH_POSTCODE,
        validators=[postcode_validator],
    )

    to_postcode = models.CharField(
        max_length=settings.MAX_LENGTH_POSTCODE,
        validators=[postcode_validator],
    )

    to_suburb = models.CharField(
        max_length=settings.MAX_LENGTH_NAME,
        help_text="If provided match is done against postcode and exact match on suburb.",
        blank=True,
    )

    fixed_distance = models.DecimalField(max_digits=5, decimal_places=1)

    def __str__(self):
        desc = str(self.from_postcode)
        if self.from_suburb:
            desc += f" ({self.from_suburb})"
        desc += f" to {self.to_postcode}"
        if self.to_suburb:
            desc += f" ({self.to_suburb})"
        desc += f" = {self.fixed_distance}km"
        return desc

    @classmethod
    @lru_cache()
    def get_override_by_postcodes(
        cls, postcode_pairs: Tuple[Tuple[str]]
    ) -> DefaultDict[Tuple[str], "DistanceOverride"]:
        """Get overrides indexed by postcode pair tuple

        Note that this is cached to avoid lots of queries due to how get_distance
        on Booking is called. We clear this in postsave/create signals (see signals.py)
        """
        filter = Q()
        for from_postcode, to_postcode in postcode_pairs:
            filter |= Q(from_postcode=from_postcode, to_postcode=to_postcode)

        override_by_postcodes: DefaultDict[Tuple[str], "DistanceOverride"] = (
            defaultdict(list)
        )
        for override in DistanceOverride.objects.filter(filter):
            override_by_postcodes[
                (str(override.from_postcode), str(override.to_postcode))
            ].append(override)
        return override_by_postcodes


class PriceAdjustment(models.Model):
    class Meta(DefaultPermissionsMeta):
        db_table = "scbp_core_price_adjustment"
        constraints = [
            models.UniqueConstraint(
                fields=["from_postcode", "to_postcode"],
                name="scbp_core_price_adjustment_unique_postcodes",
            )
        ]

    from_postcode = models.CharField(
        max_length=settings.MAX_LENGTH_POSTCODE,
        help_text="Pick-up postcode",
        validators=[postcode_validator],
    )
    to_postcode = models.CharField(
        max_length=settings.MAX_LENGTH_POSTCODE,
        help_text="Pick-up postcode",
        validators=[postcode_validator],
    )
    percentage = models.SmallIntegerField(validators=[MinValueValidator(-99)])


class VehicleClassPriceList(VehicleClassPriceMixin):
    """
    Holds a link between VehicleClass <-> PriceList.
    Everytime PriceList gets updated, all vehicle class will be relinked with pricelist with their latest ("current") prices.
    """

    price_list = models.ForeignKey(PriceList, on_delete=PROTECT)
    vehicle_class = models.ForeignKey(VehicleClass, on_delete=CASCADE)

    class Meta(DefaultPermissionsMeta):
        db_table = "scbp_core_vehicle_class_price_list"
