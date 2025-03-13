from django.test import TransactionTestCase

from scbp_core.tests.factory.user import ClientUserFactory
from scbp_core.tests.factory.user import StaffFactory


class LoginTestCase(TransactionTestCase):
    @classmethod
    def setUpTestData(cls):
        client = ClientUserFactory(
            email="client@localhost.dev", first_name="Bob", last_name="Marley"
        )
        client.set_password("password")
        client.save()
        staff = StaffFactory(
            email="staff@localhost.dev", first_name="Walter", last_name="White"
        )
        staff.set_password("password")
        staff.save()
