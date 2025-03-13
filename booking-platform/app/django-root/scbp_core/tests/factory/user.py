import random

import factory
from factory.fuzzy import FuzzyChoice

from scbp_core.models import ClientAddress
from scbp_core.models import ClientAddressType
from scbp_core.models import ClientUser
from scbp_core.models import DriverUser
from scbp_core.models import StaffUser
from scbp_core.models import User
from scbp_core.models.guest_traveller import GuestTraveller
from scbp_core.models.user_type import UserType
from scbp_core.tests.factory.methods import valid_addresses
from scbp_core.tests.factory.util import SCBPFactory

factory.Faker._DEFAULT_LOCALE = "en_AU"


class UserFactory(SCBPFactory):
    first_name = factory.Faker("first_name")
    last_name = factory.Faker("last_name")

    @factory.post_generation
    def password(record, create, extracted, **kwargs):
        password = User.objects.make_random_password()
        record.set_password(password)
        record._unencrypted_password = password

    @classmethod
    def _after_postgeneration(cls, instance, create, results=None):
        super()._after_postgeneration(instance, create, results)
        if create:
            # restore _password after save() wipes it
            instance._password = instance._unencrypted_password
            delattr(instance, "_unencrypted_password")

    class Meta:
        model = User
        default_auto_fields = True


class StaffFactory(UserFactory):
    user_type = FuzzyChoice([c[0] for c in UserType.get_staff_choices()])

    class Meta:
        model = StaffUser


class ClientUserFactory(UserFactory):
    legacy_clientno = None
    legacy_contactno = None

    class Meta:
        model = ClientUser


class GuestTravellerFactory(SCBPFactory):
    name = factory.Faker("name")
    phone_number = factory.Faker("phone_number")
    client_user = factory.SubFactory(ClientUserFactory)

    class Meta:
        model = GuestTraveller


class ClientAddressFactory(SCBPFactory):
    address_type = FuzzyChoice([c[0] for c in ClientAddressType.choices.items()])
    address_label = factory.Faker("name")
    client = factory.SubFactory(ClientUserFactory)
    address_details = factory.Dict({"utc_offset": 600})
    source_id = factory.Faker("uuid4")
    postal_code = factory.Faker("postcode")
    formatted_address = factory.Faker("street_address")
    lat = factory.Faker("latitude")
    long = factory.Faker("longitude")
    legacy_recordid = ""
    legacy_seqno = None
    legacy_table = None

    class Meta:
        model = ClientAddress

    @classmethod
    def build_valid_address(cls, name=None, **kwargs):
        if name is None:
            name = random.sample(sorted(valid_addresses.keys()), 1)[0]
        if name not in valid_addresses:
            valid_choices = ", ".join(valid_addresses.keys())
            raise ValueError(f"Invalid name {name}. Valid choices: {valid_choices}")
        return cls(**valid_addresses[name], **kwargs)


class DriverFactory(UserFactory):
    class Meta:
        model = DriverUser

    current_vehicle = None
