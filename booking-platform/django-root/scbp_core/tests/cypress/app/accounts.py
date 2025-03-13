from django.test import TransactionTestCase

from scbp_core.models import AccountToClient
from scbp_core.tests.factory.account import AccountFactory
from scbp_core.tests.factory.user import ClientUserFactory


class AccountSwitchingTestCase(TransactionTestCase):
    @classmethod
    def setUpTestData(cls):
        client = ClientUserFactory(
            email="client@localhost.dev", first_name="Bob", last_name="Marley"
        )
        client.set_password("password")
        client.save()

        client2 = ClientUserFactory(
            email="client2@localhost.dev", first_name="Salty", last_name="Sand"
        )
        client2.set_password("password")
        client2.save()

        account1 = AccountFactory(account_nickname="Account 1")
        account2 = AccountFactory(account_nickname="Account 2")
        account3 = AccountFactory(account_nickname="Account 3")
        for account in [account1, account2, account3]:
            AccountToClient.objects.create(
                client_user=client,
                account=account,
                is_default_account=True if account == account1 else None,
            )

    @classmethod
    def removeAccountLink(cls):
        link = AccountToClient.objects.filter(
            client_user__email="client@localhost.dev",
            account__account_nickname="Account 1",
        ).first()
        link.delete()
