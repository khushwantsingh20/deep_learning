""" Mixins used by many models to provide common functionality """

from django.conf import settings
from django.db import models
from django.db.models import QuerySet
from django.utils import timezone

from scbp_core.fields import CurrencyValueField
from scbp_core.fields import PercentageValueField

__all__ = ["TimestampFieldsMixin"]


class VehicleClassPriceMixin(models.Model):
    is_first_child_seat_free = models.BooleanField(default=False)

    # Class class
    # Hourly rates are calculated as
    # first hour fee +
    # rate per 10 minutes for first 6 hours +
    # rate per 10 minutes for each hour after 6
    # (these rates are system wide, not class specific)
    # Then per vehicle class either a fixed amount OR
    # an amount equal to a percentage of the total fee
    # is added, whichever is greater.
    min_hourly_surcharge_fixed = CurrencyValueField(
        "Min hourly surcharge $",
        help_text="Fixed rate added to hourly rate trips for this vehicle class. The greater of this value or the percentage value (defined below) will be added.",
    )
    min_hourly_surcharge_perc = PercentageValueField(
        "Min hourly surcharge %",
        help_text="Percentage rate added to hourly rate trips for this vehicle class. The greater of this value or the fixed rate (defined above) will be added.",
    )

    # KM trip fields
    one_way_pickup_rate = CurrencyValueField()
    one_way_off_peak_pickup_rate = CurrencyValueField()
    one_way_rate_tier1 = CurrencyValueField(
        "One way rate (up to 5km)", help_text="Fee up to 5km"
    )
    one_way_rate_tier2 = CurrencyValueField(
        "One way rate (5km to 40km)", help_text="Fee from 5km to 40km"
    )
    one_way_rate_tier3 = CurrencyValueField(
        "One way rate (beyond 40km)", help_text="Fee per km beyond 40km"
    )
    one_way_off_peak_rate_tier1 = CurrencyValueField(
        "Off-peak one way rate (up to 5km)"
    )
    one_way_off_peak_rate_tier2 = CurrencyValueField(
        "Off-peak one way rate (5km to 40km)"
    )
    one_way_off_peak_rate_tier3 = CurrencyValueField(
        "Off-peak one way rate (beyond 40km)"
    )

    class Meta:
        abstract = True


class TimestampFieldsMixin(models.Model):
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True


class AddressFieldsMixin(models.Model):
    formatted_address = models.CharField(max_length=512)
    place_name = models.CharField(max_length=settings.MAX_LENGTH_NAME, blank=True)
    lat = models.FloatField(verbose_name="Latitude", null=True)
    long = models.FloatField(verbose_name="Longitude", null=True)
    suburb = models.CharField(max_length=255, blank=True)
    postal_code = models.CharField(max_length=settings.MAX_LENGTH_POSTCODE)
    country_code = models.CharField(max_length=2, default="AU")
    # Currently this is the google maps Place ID
    source_id = models.CharField(max_length=256, blank=True)
    # Link to map for this address. Currently Google Maps.
    map_url = models.CharField(max_length=512, blank=True)

    # Extra address details from Google Maps, eg. address_components, utc_offset
    # We don't store utc_offset directly as it's the offset at the time the address
    # was lookup up and could be incorrect for daylight savings
    address_details = models.JSONField(blank=True)

    class Meta:
        abstract = True


class ArchivableQuerySet(QuerySet):
    def active(self):
        return self.filter(archived_at=None)

    def archived(self):
        return self.exclude(archived_at=None)

    def delete(self, hard_delete=False):
        if hard_delete:
            super().delete()
        else:
            self.update(archived_at=timezone.now())


class ArchivableManager(models.Manager):
    def __init__(self, *args, **kwargs):
        self.non_archived_only = kwargs.pop("non_archived_only", True)
        super().__init__(*args, **kwargs)

    def get_queryset(self):
        if self.non_archived_only:
            return ArchivableQuerySet(self.model).active()
        return ArchivableQuerySet(self.model)

    def active(self):
        return self.get_queryset().active()

    def archived(self):
        return self.get_queryset().archived()


class ArchivableMixin(models.Model):
    archived_at = models.DateTimeField(blank=True, null=True)
    archived_by = models.ForeignKey(
        "User", models.PROTECT, related_name="archived_%(class)s", null=True, blank=True
    )

    objects = ArchivableManager()
    all_objects = ArchivableManager(non_archived_only=False)

    class Meta:
        abstract = True

    def archive(self, user):
        self.archived_at = timezone.now()
        self.archived_by = user
        self.is_active = False
        self.save()

    def unarchive(self):
        self.archived_at = None
        self.archived_by = None
        self.is_active = True
        self.save()

    def delete(self, hard_delete=False, **kwargs):
        if hard_delete:
            return super().delete(**kwargs)
        self.archived_at = timezone.now()
        self.save()
