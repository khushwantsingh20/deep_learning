from django.core.exceptions import ValidationError
from django.db.utils import IntegrityError
from django.test import TestCase

from scbp_core.tests.factory.pricing import PriceAdjustmentFactory


class PriceAdjustmentModelTestCase(TestCase):
    def setUp(self):
        super().setUp()

    def test_uniqueness_validation(self):
        test1 = PriceAdjustmentFactory.build(
            from_postcode="3131", to_postcode="3000", percentage=2
        )
        test1.full_clean()
        test1.save()
        test2 = PriceAdjustmentFactory.build(
            from_postcode="3131", to_postcode="3000", percentage=4
        )
        with self.assertRaises(ValidationError):
            test2.full_clean()
        with self.assertRaises(IntegrityError):
            test2.save()

    def test_excessive_discount_invalid(self):
        test = PriceAdjustmentFactory.build(
            from_postcode="3000", to_postcode="3131", percentage=-99
        )
        try:
            test.full_clean()
        except ValidationError as e:
            self.fail(f"full_clean() should not have raised ValidationError (got {e})")
        test.percentage = -100
        with self.assertRaises(ValidationError):
            test.full_clean()
