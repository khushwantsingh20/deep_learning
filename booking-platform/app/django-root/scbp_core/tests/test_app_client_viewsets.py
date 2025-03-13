from rest_framework.test import APITestCase

from scbp_core.djrad.app import client_address_registration
from scbp_core.djrad.app import guest_traveller_registration
from scbp_core.djrad.sites import app_site
from scbp_core.models import AccountToClient
from scbp_core.models import ClientAddress
from scbp_core.models import ClientAddressType
from scbp_core.models.guest_traveller import GuestTraveller
from scbp_core.tests.factory.account import AccountFactory
from scbp_core.tests.factory.user import ClientAddressFactory
from scbp_core.tests.factory.user import ClientUserFactory
from scbp_core.tests.factory.user import GuestTravellerFactory
from scbp_core.tests.factory.user import StaffFactory
from scbp_core.tests.util import suppress_request_warnings


class ClientAddressViewSetTestCase(APITestCase):
    def setUp(self):
        self.client1 = ClientUserFactory()
        self.client1_address1 = ClientAddressFactory(
            client=self.client1, address_type=ClientAddressType.HOME
        )
        self.client1_address2 = ClientAddressFactory(
            client=self.client1, address_type=ClientAddressType.OFFICE
        )
        self.client2 = ClientUserFactory()
        self.client2_address1 = ClientAddressFactory(
            client=self.client2, address_type=ClientAddressType.HOME
        )
        self.client2_address2 = ClientAddressFactory(
            client=self.client2, address_type=ClientAddressType.OFFICE
        )
        self.client1_account1 = AccountFactory()
        AccountToClient.objects.create(
            is_account_admin=True,
            account=self.client1_account1,
            client_user=self.client1,
        )
        self.client2_account = AccountFactory()
        AccountToClient.objects.create(
            is_account_admin=True,
            account=self.client2_account,
            client_user=self.client2,
        )

    @suppress_request_warnings
    def test_global_permissions(self):
        """Make sure list always responds with 200"""
        url = app_site.reverse_registration_url(client_address_registration, "list")
        response = self.client.get(url, format="json")
        self.assertEqual(response.status_code, 401)
        self.client.force_login(self.client1)
        response = self.client.get(url, format="json")
        self.assertEqual(response.status_code, 200)
        address_ids = [address["id"] for address in response.json()]
        self.assertEqual(len(address_ids), 2)
        self.assertEqual(
            set(address_ids), {self.client1_address1.pk, self.client1_address2.pk}
        )

        self.client.force_login(self.client2)
        response = self.client.get(url, format="json")
        self.assertEqual(response.status_code, 200)
        address_ids = [address["id"] for address in response.json()]
        self.assertEqual(len(address_ids), 2)
        self.assertEqual(
            set(address_ids), {self.client2_address1.pk, self.client2_address2.pk}
        )

        # Create should not give perm error; we expect 400 as will have validation errors
        response = self.client.post(url, {}, format="json")
        self.assertEqual(response.status_code, 400)

    @suppress_request_warnings
    def test_object_permissions(self):
        url = app_site.reverse_registration_url(
            client_address_registration,
            "detail",
            kwargs={"pk": self.client2_address1.pk},
        )
        response = self.client.get(url, format="json")
        self.assertEqual(response.status_code, 404)
        self.client.force_login(self.client1)
        response = self.client.get(url, format="json")
        self.assertEqual(response.status_code, 404)

        self.client.force_login(self.client2)
        response = self.client.get(url, format="json")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["id"], self.client2_address1.pk)

        response = self.client.patch(url, {}, format="json")
        self.assertEqual(response.status_code, 200)

    @suppress_request_warnings
    def test_create_standard(self):
        url = app_site.reverse_registration_url(client_address_registration, "list")
        client = ClientUserFactory()
        self.client.force_login(client)
        post_data = {
            "addressType": ClientAddressType.HOME,
            "postalCode": "3131",
            "formatted_address": "234 Whitehorse Road Nunawading",
            "address_details": {},
        }

        response = self.client.post(url, post_data, format="json")
        self.assertEqual(response.status_code, 201)
        data = response.json()
        created_address = ClientAddress.objects.get(id=data["id"])
        self.assertEqual(created_address.client, client)

        response = self.client.post(url, post_data, format="json")
        self.assertEqual(response.status_code, 400)
        # Should be error on addressType
        self.assertEqual(list(response.json().keys()), ["addressType"])

    @suppress_request_warnings
    def test_create_other(self):
        url = app_site.reverse_registration_url(client_address_registration, "list")
        self.client.force_login(self.client1)
        data = {
            "addressType": ClientAddressType.OTHER,
            "postalCode": "3131",
            "formatted_address": "234 Whitehorse Road Nunawading",
            "address_details": {},
        }
        response = self.client.post(url, data, format="json")
        self.assertEqual(response.status_code, 400)
        # Should be error on addressLabel
        self.assertEqual(list(response.json().keys()), ["addressLabel"])
        data["addressLabel"] = "Test1"
        response = self.client.post(url, data, format="json")
        self.assertEqual(response.status_code, 201)
        data = response.json()
        created_address = ClientAddress.objects.get(id=data["id"])
        self.assertEqual(created_address.client, self.client1)
        self.assertEqual(created_address.address_label, "Test1")

    @suppress_request_warnings
    def test_update_other(self):
        address = ClientAddressFactory(
            client=self.client1,
            address_label="Test1",
            address_type=ClientAddressType.OTHER,
        )
        url = app_site.reverse_registration_url(
            client_address_registration, "detail", kwargs={"pk": address.pk}
        )
        self.client.force_login(self.client1)
        data = {"addressLabel": ""}
        response = self.client.patch(url, data, format="json")
        self.assertEqual(response.status_code, 400)
        # Should be error on addressLabel
        self.assertEqual(list(response.json().keys()), ["addressLabel"])
        data["addressLabel"] = "Test1"
        response = self.client.patch(url, data, format="json")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        created_address = ClientAddress.objects.get(id=data["id"])
        self.assertEqual(created_address.client, self.client1)
        self.assertEqual(created_address.address_label, "Test1")

    @suppress_request_warnings
    def test_linked_account_addresses(self):
        url = app_site.reverse_registration_url(client_address_registration, "list")
        self.client.force_login(self.client1)
        response = self.client.get(url, format="json")
        self.assertEqual(response.status_code, 200)
        address_ids = [address["id"] for address in response.json()]
        self.assertEqual(len(address_ids), 2)
        self.assertEqual(
            set(address_ids), {self.client1_address1.pk, self.client1_address2.pk}
        )

        client_other1 = ClientUserFactory()
        address1 = ClientAddressFactory(
            client=client_other1, address_type=ClientAddressType.HOME
        )
        AccountToClient.objects.create(
            client_user=client_other1,
            account=self.client1_account1,
            is_account_admin=False,
        )
        with self.assertNumQueries(6):
            response = self.client.get(url, {"client": ""}, format="json")
        self.assertEqual(response.status_code, 200)
        address_ids = [address["id"] for address in response.json()]
        self.assertEqual(len(address_ids), 3)
        self.assertEqual(
            set(address_ids),
            {self.client1_address1.pk, self.client1_address2.pk, address1.pk},
        )

        # Link to client2's account and should get access to their addresses too
        AccountToClient.objects.create(
            is_account_admin=True,
            client_user=self.client1,
            account=self.client2_account,
        )
        response = self.client.get(url, {"client": ""}, format="json")
        self.assertEqual(response.status_code, 200)
        address_ids = [address["id"] for address in response.json()]
        self.assertEqual(len(address_ids), 5)
        self.assertEqual(
            set(address_ids),
            {
                self.client1_address1.pk,
                self.client1_address2.pk,
                address1.pk,
                self.client2_address1.pk,
                self.client2_address2.pk,
            },
        )

        # Filter by client should work
        response = self.client.get(url, {"client": client_other1.pk}, format="json")
        self.assertEqual(response.status_code, 200)
        address_ids = [address["id"] for address in response.json()]
        self.assertEqual(len(address_ids), 1)
        self.assertEqual(set(address_ids), {address1.pk})

        # This client has no permission to book other passengers so should only
        # get their own addresses
        self.client.force_login(client_other1)
        response = self.client.get(
            url, {"account": self.client1_account1.pk}, format="json"
        )
        self.assertEqual(response.status_code, 200)
        address_ids = [address["id"] for address in response.json()]
        self.assertEqual(len(address_ids), 1)
        self.assertEqual(set(address_ids), {address1.pk})


class ClientGuestTravellerViewSetTestCase(APITestCase):
    def setUp(self):
        self.client1 = ClientUserFactory()
        self.client2 = ClientUserFactory()
        self.client1_guest1 = GuestTravellerFactory(client_user=self.client1)
        self.client1_guest2 = GuestTravellerFactory(client_user=self.client1)
        self.client2_guest1 = GuestTravellerFactory(client_user=self.client2)
        self.staff = StaffFactory()

    @suppress_request_warnings
    def test_api_restricted_to_client_user(self):
        url = app_site.reverse_registration_url(guest_traveller_registration, "list")
        self.client.force_login(self.staff)

        response = self.client.get(url, format="json")
        self.assertEqual(response.status_code, 403)

    @suppress_request_warnings
    def test_api_restricted_to_clients_own_list(self):
        url = app_site.reverse_registration_url(guest_traveller_registration, "list")
        self.client.force_login(self.client1)

        response = self.client.get(url, format="json")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(len(data), 2)
        self.assertEqual(
            {datum["id"] for datum in data},
            {self.client1_guest1.id, self.client1_guest2.id},
        )

        # Should be able to update own
        detail_url1 = app_site.reverse_registration_url(
            guest_traveller_registration,
            "detail",
            kwargs={"pk": self.client1_guest1.id},
        )
        response = self.client.patch(detail_url1, {"name": "Modified 1"}, format="json")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            GuestTraveller.objects.get(pk=self.client1_guest1.pk).name, "Modified 1"
        )

        # Can't update someone else (will give 404)
        detail_url2 = app_site.reverse_registration_url(
            guest_traveller_registration,
            "detail",
            kwargs={"pk": self.client2_guest1.id},
        )
        response = self.client.patch(detail_url2, {"name": "Modified 1"}, format="json")
        self.assertEqual(response.status_code, 404)

    def test_api_create_guest(self):
        url = app_site.reverse_registration_url(guest_traveller_registration, "list")
        self.client.force_login(self.client1)

        name = "Johnny"
        phone = "0412777777"
        response = self.client.post(
            url, {"name": name, "phone_number": phone}, format="json"
        )
        self.assertEqual(response.status_code, 201)
        self.assertTrue(
            GuestTraveller.objects.filter(
                name=name, phone_number=phone, client_user=self.client1
            ).exists()
        )
        response = self.client.get(url, format="json")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(len(data), 3)
