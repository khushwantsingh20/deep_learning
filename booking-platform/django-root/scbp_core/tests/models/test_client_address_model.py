from django.core.exceptions import ValidationError
from django.test import TestCase

from scbp_core.models import ClientAddress
from scbp_core.models import ClientAddressType
from scbp_core.tests.factory.user import ClientUserFactory


class TestClientAddress(TestCase):
    def test_validate_unique_types(self):
        data = {
            "postal_code": "3131",
            "formatted_address": "234 Whitehorse Road Nunawading",
            "address_details": {},
        }
        client1 = ClientUserFactory()
        client2 = ClientUserFactory()
        for address_type, label in ClientAddressType.choices.items():
            if address_type == ClientAddressType.OTHER:
                continue
            with self.subTest(msg=f"single record for type {label}"):
                ClientAddress.objects.create(
                    client=client1, address_type=address_type, **data
                )
                ClientAddress.objects.create(
                    client=client2, address_type=address_type, **data
                )
                address = ClientAddress(
                    client=client1, address_type=ClientAddressType.HOME, **data
                )
                with self.assertRaises(
                    ValidationError, msg="There is already an address type"
                ):
                    address.clean()
                with self.assertRaises(
                    ValidationError, msg="There is already an address type"
                ):
                    address.save()

    def test_validate_other(self):
        data = {
            "postal_code": "3131",
            "formatted_address": "234 Whitehorse Road Nunawading",
            "address_details": {},
            "address_type": ClientAddressType.OTHER,
        }
        client1 = ClientUserFactory()
        address = ClientAddress(client=client1, **data)
        with self.assertRaises(ValidationError, msg="enter a label"):
            address.clean()
        with self.assertRaises(ValidationError, msg="enter a label"):
            address.save()

        address = ClientAddress.objects.create(
            client=client1, address_label="Test1", **data
        )
        address.address_label = None
        with self.assertRaises(ValidationError, msg="enter a label"):
            address.clean()
        with self.assertRaises(ValidationError, msg="enter a label"):
            address.save()
