from datetime import datetime
from datetime import timedelta

from django.core import signing
from django.test import TestCase
from freezegun import freeze_time

from scbp_core.models import VehicleClass
from scbp_core.services.driver_url_token import generate_url_token
from scbp_core.services.driver_url_token import parse_url_token
from scbp_core.tests.factory.account import AccountFactory
from scbp_core.tests.factory.booking import AddressFactory
from scbp_core.tests.factory.booking import OneWayBookingFactory
from scbp_core.tests.factory.user import ClientUserFactory
from scbp_core.tests.factory.user import DriverFactory


class TestDriverGenerator(TestCase):
    fixtures = ["vehicle_class.json"]

    def setUp(self):
        client = ClientUserFactory()
        self.driver = DriverFactory.create(driver_no=101)
        self.booking = OneWayBookingFactory.create(
            created_by=client,
            client_user=client,
            account=AccountFactory(),
            vehicle_class=VehicleClass.objects.first(),
            from_address=AddressFactory.create(source_id="abc"),
            destination_address=AddressFactory.create(source_id="def"),
            driver=self.driver,
        )

    def test_reversibility(self):
        test = generate_url_token(self.booking, self.driver)
        self.assertLessEqual(len(test), 70)
        self.assertEqual(
            parse_url_token(test), {"booking": self.booking, "driver": self.driver}
        )

    def test_wrong_driver(self):
        driver = DriverFactory.create(driver_no=102)
        test = generate_url_token(self.booking, driver)
        with self.assertRaises(ValueError):
            parse_url_token(test)

    def test_irreversible_if_modified(self):
        test = generate_url_token(self.booking, self.driver)
        for position in range(len(test)):
            modified_test = "".join(
                (test[:position], chr(ord(test[position]) + 1), test[position + 1 :])
            )
            with self.assertRaises(signing.BadSignature):
                parse_url_token(modified_test)

    def test_expired_token(self):
        with freeze_time(datetime.now() + timedelta(weeks=-3)):
            test = generate_url_token(self.booking, self.driver)
        with self.assertRaises(signing.SignatureExpired):
            parse_url_token(test)
