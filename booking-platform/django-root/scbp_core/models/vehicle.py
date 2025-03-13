from collections import OrderedDict

from django.conf import settings
from django.db import models
from django.db import transaction
from ordered_model.models import OrderedModelBase
from ordered_model.models import OrderedModelManager

from scbp_core.fields import get_choices_check_constraint
from scbp_core.fields import PhoneNumberField
from scbp_core.model_mixins import ArchivableMixin
from scbp_core.model_mixins import VehicleClassPriceMixin
from scbp_core.permissions import DefaultPermissionsMeta


class VehicleOperatorClassificationType:
    FRANCHISE = 1
    CONTRACTOR = 2
    RELATED = 3
    INTERSTATE = 4
    EXTERNAL = 5
    OTHER = 6
    COMPANY = 7

    choices = OrderedDict(
        (
            (FRANCHISE, "Franchise Owner"),
            (CONTRACTOR, "Contractor - Own Car"),
            (RELATED, "Related Party"),
            (INTERSTATE, "Interstate"),
            (EXTERNAL, "External"),
            (COMPANY, "Company Car"),
            (OTHER, "Other"),
        )
    )


class VehicleColorManager(models.Manager):
    def get_by_natural_key(self, color_abbreviation):
        return self.get(color_abbreviation=color_abbreviation)


class VehicleColor(models.Model):
    title = models.CharField(max_length=settings.MAX_LENGTH_NAME)
    color_abbreviation = models.CharField(max_length=3)
    color_code = models.CharField(
        max_length=30, help_text="Must be valid CSS color string"
    )

    objects = VehicleColorManager()

    class Meta(DefaultPermissionsMeta):
        db_table = "scbp_core_color"
        default_related_name = "colors"
        verbose_name = "vehicle colour"
        verbose_name_plural = "vehicle colours"

    def __str__(self):
        return f"{self.title} ({self.color_code})"

    def natural_key(self):
        return (self.color_abbreviation,)


class VehicleClassManager(OrderedModelManager):
    def get_by_natural_key(self, abbreviation):
        return self.get(abbreviation=abbreviation)


class VehicleClass(OrderedModelBase, VehicleClassPriceMixin):
    title = models.CharField(max_length=settings.MAX_LENGTH_NAME)
    abbreviation = models.CharField(max_length=10, blank=True)
    description = models.CharField(max_length=settings.MAX_LENGTH_SHORT_DESCRIPTION)
    max_passenger_count = models.PositiveSmallIntegerField()
    max_baggage_count = models.PositiveSmallIntegerField()
    max_child_seat_count = models.PositiveSmallIntegerField()
    image = models.ImageField()
    available_colors = models.ManyToManyField(VehicleColor)

    is_any_class = models.BooleanField(
        default=False,
        help_text="Is this class used as the generic 'Any Class' display?",
    )

    # Should class show up for interstate bookings?
    # Interstate classes should not show up for Victoria bookings
    # and non-interstate classes should show up for Victoria bookings
    is_interstate = models.BooleanField(
        default=False,
        help_text="Is this class valid for and exclusive to interstate bookings?",
    )

    sort_key = models.PositiveIntegerField(default=500, db_index=True)

    order_field_name = "sort_key"

    objects = VehicleClassManager()

    class Meta(DefaultPermissionsMeta):
        db_table = "scbp_core_vehicle_class"
        default_related_name = "vehicle_classes"
        ordering = ["sort_key"]
        verbose_name_plural = "vehicle classes"
        indexes = [
            models.Index(fields=["sort_key", "abbreviation"]),
        ]

    @transaction.atomic
    def save(self, *args, **kwargs):
        # Only one vehicle can be flagged as is_any_class at a time
        if self.is_any_class:
            VehicleClass.objects.filter(is_any_class=True).exclude(id=self.id).update(
                is_any_class=False
            )
            self.abbreviation = ""
        else:
            self.abbreviation = self.abbreviation.upper()
        if not self.pk:
            last = VehicleClass.objects.order_by("sort_key").last()
            if last:
                self.sort_key = last.sort_key + 1

        super().save(*args, **kwargs)

        # we'll trigger a PriceList save as well in order to keep PriceList "updated":
        # when PriceList gets saved, it'll recreate a mapping between itself and all vehicle classes,
        # which means whatever changes we made here would made its way to the PriceList.
        # see PriceList.save() for more.
        from scbp_core.models import PriceList

        PriceList.get_current().save()

    def __str__(self):
        return self.title

    def natural_key(self):
        return (self.abbreviation,)


class VehicleOperator(ArchivableMixin):
    vehicle_operator_no = models.CharField(max_length=6)
    company_name = models.CharField(max_length=settings.MAX_LENGTH_NAME)

    lat = models.FloatField()
    long = models.FloatField()
    address = models.CharField(max_length=settings.MAX_LENGTH_SHORT_DESCRIPTION)

    abn = models.CharField(max_length=settings.MAX_LENGTH_NAME)
    is_abn_verified = models.BooleanField(default=False)

    contact_title = models.CharField(max_length=settings.MAX_LENGTH_NAME, blank=True)
    contact_first_name = models.CharField(max_length=settings.MAX_LENGTH_NAME)
    contact_last_name = models.CharField(max_length=settings.MAX_LENGTH_NAME)
    contact_phone = PhoneNumberField(blank=True)
    contact_mobile = PhoneNumberField()
    contact_email = models.CharField(max_length=settings.MAX_LENGTH_NAME)

    classification = models.PositiveSmallIntegerField(
        choices=VehicleOperatorClassificationType.choices.items()
    )
    has_agreement_with_sc = models.BooleanField(default=False)
    agreement_date = models.DateField(null=True, blank=True)
    renewal_date = models.DateField(null=True, blank=True)

    service_fee_percent = models.IntegerField()
    marketing_levy = models.IntegerField("Marketing Levy (%)")
    monthly_depot_fee = models.IntegerField("Monthly Depot Fee ($)")

    bank_name = models.CharField(max_length=settings.MAX_LENGTH_NAME)
    bank_account_name = models.CharField(max_length=settings.MAX_LENGTH_NAME)
    bank_bsb = models.CharField(
        max_length=settings.MAX_LENGTH_NAME, verbose_name="Bank BSB"
    )
    bank_account_number = models.CharField(max_length=settings.MAX_LENGTH_NAME)

    class Meta(DefaultPermissionsMeta):
        db_table = "scbp_core_vehicle_operator"
        default_related_name = "vehicle_operators"
        verbose_name = "vehicle operator"
        verbose_name_plural = "vehicle operators"

        constraints = [
            get_choices_check_constraint(
                VehicleOperatorClassificationType.choices,
                "classification",
                "scbp_core_vehicle_operator_classification_valid",
            )
        ]

    def __str__(self):
        return self.company_name


class Vehicle(ArchivableMixin):
    car_no = models.CharField(max_length=6)
    commerical_passenger_vehicle_license = models.CharField(
        max_length=settings.MAX_LENGTH_SHORT_DESCRIPTION
    )

    make = models.CharField(max_length=settings.MAX_LENGTH_NAME)
    model = models.CharField(max_length=settings.MAX_LENGTH_NAME)
    year_of_manufacture = models.IntegerField()
    odometer = models.IntegerField()

    car_class = models.ForeignKey(VehicleClass, models.PROTECT)
    color = models.ForeignKey(VehicleColor, models.PROTECT)

    inspection_date = models.DateField()
    radio_serial_no = models.CharField(max_length=settings.MAX_LENGTH_NAME)

    vehicle_operator = models.ForeignKey(VehicleOperator, on_delete=models.CASCADE)

    class Meta(DefaultPermissionsMeta):
        db_table = "scbp_core_vehicle"
        default_related_name = "vehicles"
        verbose_name = "vehicle"
        verbose_name_plural = "vehicles"
        ordering = ["car_no"]

    def __str__(self):
        return f"{self.car_no} - {self.car_class}"
