from django.db.utils import IntegrityError
from django.test import TestCase

from scbp_core.models.pricing import HourRateType
from scbp_core.models.pricing_type import HourRateDayType
from scbp_core.models.pricing_type import HourRateHourType


class TestHourRateTypeModel(TestCase):
    def test_within_normal_parameters(self):
        hour_rate_type = HourRateType(
            hour=12,
            day_type=HourRateDayType.WEEKDAY,
            hour_type=HourRateHourType.STANDARD,
        )
        hour_rate_type.save()
        self.assertEqual(hour_rate_type.day_type, HourRateDayType.WEEKDAY)

    def test_invalid_day_type(self):
        hour_rate_type = HourRateType(
            hour=12, day_type=1001, hour_type=HourRateHourType.STANDARD
        )
        with self.assertRaisesMessage(
            IntegrityError,
            'new row for relation "scbp_core_hour_rate_type" violates check constraint "scbp_core_pricing_hour_rate_day_type_valid"',
        ):
            hour_rate_type.save()

    def test_invalid_hour_type(self):
        hour_rate_type = HourRateType(
            hour=12, day_type=HourRateDayType.WEEKDAY, hour_type=1001
        )
        with self.assertRaisesMessage(
            IntegrityError,
            'new row for relation "scbp_core_hour_rate_type" violates check constraint "scbp_core_pricing_hour_rate_hour_type_valid"',
        ):
            hour_rate_type.save()

    def test_negative_hour(self):
        hour_rate_type = HourRateType(
            hour=-1,
            day_type=HourRateDayType.WEEKDAY,
            hour_type=HourRateHourType.STANDARD,
        )
        with self.assertRaisesMessage(
            IntegrityError,
            'new row for relation "scbp_core_hour_rate_type" violates check constraint "scbp_core_pricing_hour_rate_hour_valid"',
        ):
            hour_rate_type.save()

    def test_too_large_hour(self):
        hour_rate_type = HourRateType(
            hour=24,
            day_type=HourRateDayType.WEEKDAY,
            hour_type=HourRateHourType.STANDARD,
        )
        with self.assertRaisesMessage(
            IntegrityError,
            'new row for relation "scbp_core_hour_rate_type" violates check constraint "scbp_core_pricing_hour_rate_hour_valid"',
        ):
            hour_rate_type.save()
