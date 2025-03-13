from django.test import TestCase

from scbp_core.models import AccountToClient
from scbp_core.rules import can_update_booking
from scbp_core.tests.factory.account import AccountFactory
from scbp_core.tests.factory.booking import BookingFactory
from scbp_core.tests.factory.user import ClientUserFactory


class RulesTestCase(TestCase):
    fixtures = ["vehicle_class.json"]

    def setUp(self):
        self.client_account1_admin = ClientUserFactory()
        self.client_account1_user = ClientUserFactory()
        self.client_account2_admin = ClientUserFactory()
        self.account1 = AccountFactory(eway_token_customer_id="ABC123")
        AccountToClient.objects.create(
            is_account_admin=True,
            account=self.account1,
            client_user=self.client_account1_admin,
        )
        AccountToClient.objects.create(
            is_account_admin=False,
            account=self.account1,
            client_user=self.client_account1_user,
        )
        self.account2 = AccountFactory()
        AccountToClient.objects.create(
            is_account_admin=True,
            account=self.account2,
            client_user=self.client_account2_admin,
        )
        self.booking1 = BookingFactory(
            client_user=self.client_account1_user, account=self.account1
        )
        self.booking2 = BookingFactory(
            client_user=self.client_account2_admin, account=self.account2
        )

    def test_can_update_booking(self):
        self.assertEqual(
            can_update_booking(self.client_account1_admin, self.booking1), True
        )
        self.assertEqual(
            can_update_booking(self.client_account1_user, self.booking1), True
        )
        self.assertEqual(
            can_update_booking(self.client_account2_admin, self.booking1), False
        )

        self.assertEqual(
            can_update_booking(self.client_account1_admin, self.booking2), False
        )
        self.assertEqual(
            can_update_booking(self.client_account1_user, self.booking2), False
        )
        self.assertEqual(
            can_update_booking(self.client_account2_admin, self.booking2), True
        )
