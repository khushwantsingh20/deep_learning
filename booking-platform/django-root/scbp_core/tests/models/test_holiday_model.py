from datetime import date

from django.test import TestCase

from scbp_core.models import Holiday
from scbp_core.tests.factory.pricing import HolidayFactory


class HolidayModelTestCase(TestCase):
    def setUp(self):
        super().setUp()
        self.holidays = [
            HolidayFactory(title="Christmas", date=date(year=2019, month=12, day=25))
        ]

    def test_is_holiday_with_holiday_date(self):
        test_date = date(year=2019, month=12, day=25)
        self.assertTrue(Holiday.is_holiday(test_date))

    def test_is_holiday_without_holiday_date(self):
        test_date = date(year=2019, month=9, day=11)
        self.assertFalse(Holiday.is_holiday(test_date))
