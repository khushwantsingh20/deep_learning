from typing import Dict
from typing import Union

from bleach import clean
from django.conf import settings
from django.core.validators import MaxValueValidator
from django.core.validators import MinValueValidator
from django.db import models
from django.utils.timezone import localtime
from rest_framework import serializers


class HtmlField(models.TextField):
    """Django field type corresponding to HTML text

    Parameters:
        allowed_tags (iterable): The set of allowed HTML tags (any others will be escaped/stripped from the text)
            Effective default is bleach.sanitizer.ALLOWED_TAGS
            See https://bleach.readthedocs.io/en/latest/clean.html#allowed-tags-tags fur further details
        allowed_attributes (list, map, or callable): The set of allowed HTML attributes
            Effective default is bleach.sanitizer.ALLOWED_ATTRIBUTES
            See https://bleach.readthedocs.io/en/latest/clean.html#allowed-attributes-attributes for further details
        allowed_styles (list): The set of allowed CSS styles
            Effective default is []
        strip_tags (bool): Controls whether to strip disallowed tags from the output (when True)
            or to escape disallowed tags (when False)
            Default is False
        strip_comments (bool): Controls whether or not to strip out comments
            Default is True
        trusted (bool): Whether the data going into this field comes only from trusted sources
            Default is False
            Setting this to True disables the entire cleaning process on save - be very careful when doing this!

    Attributes:
        bleach_options (obj): The bleach options to be used for HTML sanitization
            Compiled from the allowed_tags, allowed_attributes, allowed_styles, strip_tags, and strip_comments parameters
        trusted (bool): Whether the data going into this field comes only from trusted sources
            Copied directly from the trusted parameter
    """

    def __init__(
        self,
        allowed_tags=None,
        allowed_attributes=None,
        allowed_styles=None,
        strip_tags=None,
        strip_comments=None,
        trusted=False,
        *args,
        **kwargs,
    ):
        super().init(*args, **kwargs)
        self.bleach_options = self.get_bleach_options(
            allowed_tags, allowed_attributes, allowed_styles, strip_tags, strip_comments
        )
        self.trusted = trusted

    @staticmethod
    def get_bleach_options(
        allowed_tags=None,
        allowed_attributes=None,
        allowed_styles=None,
        strip_tags=None,
        strip_comments=None,
    ):
        bleach_args = {}

        if allowed_tags:
            bleach_args["tags"] = allowed_tags
        elif hasattr(settings, "BLEACH_ALLOWED_TAGS"):
            bleach_args["tags"] = settings.BLEACH_ALLOWED_TAGS

        if allowed_attributes:
            bleach_args["attributes"] = allowed_attributes
        elif hasattr(settings, "BLEACH_ALLOWED_ATTRIBUTES"):
            bleach_args["attributes"] = settings.BLEACH_ALLOWED_ATTRIBUTES

        if allowed_styles:
            bleach_args["styles"] = allowed_styles
        elif hasattr(settings, "BLEACH_ALLOWED_STYLES"):
            bleach_args["styles"] = settings.BLEACH_ALLOWED_STYLES

        if strip_tags:
            bleach_args["strip"] = strip_tags
        elif hasattr(settings, "BLEACH_STRIP_TAGS"):
            bleach_args["strip"] = settings.BLEACH_STRIP_TAGS

        if strip_comments:
            bleach_args["strip_comments"] = strip_comments
        elif hasattr(settings, "BLEACH_STRIP_COMMENTS"):
            bleach_args["strip_comments"] = settings.BLEACH_STRIP_COMMENTS

        return bleach_args

    def pre_save(self, model_instance, add):
        raw_value = getattr(model_instance, self.attname)
        cleaned = (
            clean(raw_value, **self.bleach_options) if not self.trusted else raw_value
        )
        setattr(model_instance, self.attname, cleaned)
        return cleaned


class CurrencyValueField(models.DecimalField):
    """Decimal field intended to represent a nominal currency amount"""

    def __init__(self, *args, max_digits=14, decimal_places=2, **kwargs):
        # init defaults ensure default values and pass to super
        super().__init__(
            *args, max_digits=max_digits, decimal_places=decimal_places, **kwargs
        )


class RangeValidationMixin:
    """Mixin that applies a min_value and max_value via validators"""

    def __init__(
        self, *args, min_value=None, max_value=None, validators=None, **kwargs
    ):
        if validators is None:
            validators = []
        self.range_validators = []
        self.min_value = min_value
        self.max_value = max_value
        # Convert min_value and max_value to validators
        if min_value is not None:
            self.range_validators.append(MinValueValidator(min_value))
        if max_value is not None:
            self.range_validators.append(MaxValueValidator(max_value))
        if validators or self.range_validators:
            # Combine range validators with any other validators provided
            kwargs["validators"] = self.range_validators + validators
        super().__init__(*args, **kwargs)

    def deconstruct(self):
        name, path, args, kwargs = super().deconstruct()
        # Remove range validators
        if self.range_validators:
            validators = kwargs.pop("validators", [])
            validators = [v for v in validators if v not in self.range_validators]
            if validators:
                kwargs["validators"] = validators
        if self.min_value is not None:
            kwargs["min_value"] = self.min_value
        if self.max_value is not None:
            kwargs["max_value"] = self.max_value
        return name, path, args, kwargs


class PercentageValueField(RangeValidationMixin, models.DecimalField):
    """DecimalField representing a valid percentage value"""

    def __init__(
        self,
        *args,
        max_digits=5,
        decimal_places=2,
        min_value=0,
        max_value=100,
        **kwargs,
    ):
        # init defaults ensure default values and pass to super
        super().__init__(
            *args,
            max_digits=max_digits,
            decimal_places=decimal_places,
            min_value=min_value,
            max_value=max_value,
            **kwargs,
        )


def get_choices_check_constraint(
    choices: Dict[Union[str, int], str], field_name: str, constraint_name: str
):
    """Generate a database constraint to enforce valid choice selection

    Usage:

        class ClientAddress(AddressFieldsMixin):

            address_type = models.CharField(
                choices=AddressType.choices, max_length=50
            )

            class Meta(DefaultPermissionsMeta):
                db_table = "scbp_core_client_address"
                constraints = [
                    get_choices_check_constraint(
                        AddressType.choices, 'address_type', 'scbp_core_client_address_address_type_valid'
                    ),
                ]

    """
    return models.CheckConstraint(
        check=models.Q(
            **{f"{field_name}__in": [choice[0] for choice in choices.items()]}
        ),
        name=constraint_name,
    )


class PhoneNumberField(models.CharField):
    """Placeholder phonenumber field. we may want to customize this later."""

    def __init__(self, *args, **kwargs):
        max_length = kwargs.pop("max_length", settings.MAX_LENGTH_NAME)
        super().__init__(*args, max_length=max_length, **kwargs)


class TravelOnDateField(serializers.DateField):
    """Field that represents the date part of the `travel_on` field.

    This date is considered to always in be the default timezone (ie. Melbourne)

    On the frontend the user selects a date and time and this entry is considered
    to be in the Melbourne timezone - we make it a timezone aware date on submission.
    """

    def to_representation(self, value):
        # We accept a datetime (the `travel_on` field) but extract the date
        # component once in the correct localtime.
        return super().to_representation(localtime(value).date())

    def get_attribute(self, instance):
        return instance.travel_on


class TravelOnTimeField(serializers.TimeField):
    """Field that represents the time part of the `travel_on` field.

    This time is considered to always in be the default timezone (ie. Melbourne)
    """

    def to_representation(self, value):
        # We accept a datetime (the `travel_on` field) but extract the time
        # component once in the correct localtime.
        return super().to_representation(localtime(value).time())

    def get_attribute(self, instance):
        return instance.travel_on
