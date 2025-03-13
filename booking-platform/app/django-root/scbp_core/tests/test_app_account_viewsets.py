from rest_framework.test import APITestCase

from scbp_core.djrad.app import account_registration
from scbp_core.djrad.sites import app_site
from scbp_core.models import AccountToClient
from scbp_core.tests.factory.account import AccountFactory
from scbp_core.tests.factory.user import ClientUserFactory
from scbp_core.tests.util import suppress_request_warnings


class AccountViewSetTestCase(APITestCase):
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

    @suppress_request_warnings
    def test_permissions(self):
        url = app_site.reverse_registration_url(
            account_registration, "detail", kwargs={"pk": self.account1.pk}
        )
        response = self.client.get(url, format="json")
        self.assertEqual(response.status_code, 404)
        self.client.force_login(self.client_account2_admin)
        response = self.client.get(url, format="json")
        self.assertEqual(response.status_code, 404)
        response = self.client.patch(url, {}, format="json")
        self.assertEqual(response.status_code, 404)
        response = self.client.delete(url, format="json")
        self.assertEqual(response.status_code, 404)

        self.client.force_login(self.client_account1_admin)
        response = self.client.get(url, format="json")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["id"], self.account1.pk)

        response = self.client.patch(url, {}, format="json")
        self.assertEqual(response.status_code, 200)

        # A non-admin user linked to account shouldn't be able to do anything
        # They get all the details they need via the AccountToClientViewSet -
        # we don't want to expose details here they don't need (eg. credit
        # card last digits, payment terms etc)
        self.client.force_login(self.client_account1_user)
        response = self.client.get(url, format="json")
        self.assertEqual(response.status_code, 403)

        response = self.client.patch(url, {}, format="json")
        self.assertEqual(response.status_code, 403)
        response = self.client.delete(url, format="json")
        self.assertEqual(response.status_code, 403)
