from django.test import TransactionTestCase

from scbp_core.models import AccountToClient
from scbp_core.models import ClientAddressType
from scbp_core.tests.factory.account import AccountFactory
from scbp_core.tests.factory.user import ClientAddressFactory
from scbp_core.tests.factory.user import ClientUserFactory


class BookingProcessTestCase(TransactionTestCase):
    @classmethod
    def setUpTestData(cls):
        client = ClientUserFactory(email="client@localhost.dev")
        client.set_password("password")
        client.save()
        ClientAddressFactory.build_valid_address(
            client=client, address_type=ClientAddressType.HOME
        )

        client_with_account = ClientUserFactory(
            email="client+withaccount@localhost.dev"
        )
        client_with_account.set_password("password")
        client_with_account.save()

        account = AccountFactory()
        AccountToClient.objects.create(
            client_user=client_with_account,
            account=account,
            is_default_account=True,
            is_account_admin=True,
        )


class BookingPassengerSelectTestCase(TransactionTestCase):
    @classmethod
    def setUpTestData(cls):
        client1 = ClientUserFactory(
            first_name="Richard", last_name="Cheese", email="client1@localhost.dev"
        )
        client1.set_password("password")
        client1.save()
        account = AccountFactory()
        AccountToClient.objects.create(
            client_user=client1,
            account=account,
            is_default_account=True,
            is_account_admin=True,
        )
        ClientAddressFactory.build_valid_address(
            "alliance", client=client1, address_type=ClientAddressType.HOME
        )

        client2 = ClientUserFactory(
            first_name="Bob", last_name="Smith", email="client2@localhost.dev"
        )
        client2.set_password("password")
        client2.save()
        AccountToClient.objects.create(
            client_user=client2, account=account, is_default_account=True
        )
        ClientAddressFactory.build_valid_address(
            "ringwood", client=client2, address_type=ClientAddressType.HOME
        )
