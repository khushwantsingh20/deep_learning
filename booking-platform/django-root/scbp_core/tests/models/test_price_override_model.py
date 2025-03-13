from django.core.exceptions import ValidationError
from django.test import TestCase

from scbp_core.models.pricing import PriceOverride
from scbp_core.tests.factory.account import AccountFactory
from scbp_core.tests.factory.pricing import PriceOverrideFactory


class PriceOverrideModelTestCase(TestCase):
    def setUp(self):
        super().setUp()
        self.accounts = [AccountFactory(), AccountFactory(), AccountFactory()]
        self.postcode_pairs = [["3001", "3002"], ["3003", "3004"]]
        for [from_postcode, to_postcode] in self.postcode_pairs:
            PriceOverrideFactory.create(
                from_postcode=from_postcode, to_postcode=to_postcode
            )
            for account in self.accounts:
                PriceOverrideFactory.create(
                    account=account,
                    from_postcode=from_postcode,
                    to_postcode=to_postcode,
                )

    def test_query_finds_overrides(self):
        for account in self.accounts:
            for [from_postcode, to_postcode] in self.postcode_pairs:
                matching_overrides = (
                    PriceOverride.objects.overrides_for_account_and_postcodes(
                        account=account,
                        from_postcode=from_postcode,
                        to_postcode=to_postcode,
                    )
                )
                query_note = (
                    f"(Account {account}, postcodes [{from_postcode}, {to_postcode}])"
                )
                self.assertEqual(matching_overrides.count(), 2, query_note)
                self.assertEqual(
                    matching_overrides.filter(account=account).count(), 1, query_note
                )
                self.assertEqual(
                    matching_overrides.filter(account__isnull=True).count(),
                    1,
                    query_note,
                )

    def test_query_finds_nothing_without_matches(self):
        """
        Test that a query that does not correspond to any overrides returns no overrides
        """
        # Reverse the destructure to ensure that we get postcodes that match nothing
        [to_postcode, from_postcode] = self.postcode_pairs[0]
        matching_overrides = PriceOverride.objects.overrides_for_account_and_postcodes(
            account=self.accounts[0],
            from_postcode=from_postcode,
            to_postcode=to_postcode,
        )
        self.assertEqual(matching_overrides.count(), 0)

    def test_unique_account_and_postcode_pair_constraint(self):
        with self.assertRaises(ValidationError):
            [from_postcode, to_postcode] = self.postcode_pairs[0]
            PriceOverrideFactory.create(
                account=self.accounts[0],
                from_postcode=from_postcode,
                to_postcode=to_postcode,
            )

    def test_unique_any_account_and_postcode_pair_constraint(self):
        with self.assertRaises(ValidationError):
            [from_postcode, to_postcode] = self.postcode_pairs[0]
            PriceOverrideFactory.create(
                from_postcode=from_postcode, to_postcode=to_postcode
            )

    def test_missing_account(self):
        [from_postcode, to_postcode] = self.postcode_pairs[0]
        matching_overrides = PriceOverride.objects.overrides_for_account_and_postcodes(
            account=None, from_postcode=from_postcode, to_postcode=to_postcode
        )
        self.assertEqual(matching_overrides.count(), 1)
        self.assertIsNone(matching_overrides.first().account)
