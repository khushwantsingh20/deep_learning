import datetime
from decimal import Decimal

import factory.django

from scbp_core.models import BookingOutOfPocket
from scbp_core.models import PriceAdjustment
from scbp_core.models import PriceList
from scbp_core.models import PriceVariationType
from scbp_core.models.booking import BookingPriceVariation
from scbp_core.models.pricing import Holiday
from scbp_core.models.pricing import PriceOverride
from scbp_core.models.pricing import SpecialEvent
from scbp_core.tests.factory.util import SCBPFactory

factory.Faker._DEFAULT_LOCALE = "en_AU"


class PriceListFactory(SCBPFactory):
    class Meta:
        model = PriceList

    rate_schedule_standard = Decimal(0)
    rate_schedule_retail = Decimal(10)
    rate_schedule_corporate = Decimal(5)
    rate_schedule_institution = Decimal(10)


class HolidayFactory(SCBPFactory):
    class Meta:
        model = Holiday


class SpecialEventFactory(SCBPFactory):
    class Meta:
        model = SpecialEvent


class BookingPriceVariationFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = BookingPriceVariation

    variation_type = PriceVariationType.ADHOC


class BookingOutOfPocketFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = BookingOutOfPocket


class PriceOverrideFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = PriceOverride

    start_time = datetime.time(hour=10)
    end_time = datetime.time(hour=16)
    fixed_cost = Decimal(60)


class PriceAdjustmentFactory(SCBPFactory):
    class Meta:
        model = PriceAdjustment
