from django.db.models import ManyToManyField
from django.utils import timezone
import factory.django
from factory.fuzzy import BaseFuzzyAttribute
from factory.fuzzy import FuzzyDate
from factory.fuzzy import FuzzyInteger
from factory.random import randgen

from scbp_core.fields import PhoneNumberField
from scbp_core.tests.factory.methods import _build_phone_number
from scbp_core.tests.factory.methods import _ignore

factory.Faker._DEFAULT_LOCALE = "en_AU"


class SCBPIntrospector(factory.django.DjangoIntrospector):
    DEFAULT_BUILDERS = factory.django.DjangoIntrospector.DEFAULT_BUILDERS + [
        (PhoneNumberField, _build_phone_number),
        (ManyToManyField, _ignore),
    ]


class SCBPFactoryOptions(factory.django.DjangoOptions):
    DEFAULT_INTROSPECTOR_CLASS = SCBPIntrospector


class SCBPFactory(factory.django.DjangoModelFactory):
    _options_class = SCBPFactoryOptions

    class Meta:
        abstract = True


class FuzzyDateRange(BaseFuzzyAttribute):
    def __init__(
        self, start_date=None, end_date=None, length_min=1, length_max=100, **kwargs
    ):
        super().__init__(**kwargs)
        self.fuzzy_date = FuzzyDate(start_date, end_date)
        self.length_min = length_min
        self.length_max = length_max

    def fuzz(self):
        length = randgen.randint(self.length_min, self.length_max)
        date = self.fuzzy_date.fuzz()

        return [date, date + timezone.timedelta(days=length)]


class FuzzyPositiveInteger(FuzzyInteger):
    def __init__(self, **kwargs):
        super().__init__(0, 2**32 - 1, **kwargs)

    def __int__(self):
        return self.fuzz()
