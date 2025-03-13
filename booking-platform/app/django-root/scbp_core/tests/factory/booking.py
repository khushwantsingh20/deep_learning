import datetime
from datetime import timedelta

from django.utils import timezone
from django.utils.timezone import make_aware
import factory
from factory.fuzzy import FuzzyDecimal
from factory.fuzzy import FuzzyInteger

from scbp_core.models import Booking
from scbp_core.models import BookingAddress
from scbp_core.models import BookingAddressType
from scbp_core.models import BookingType
from scbp_core.models import PriceList
from scbp_core.models import VehicleClass
from scbp_core.tests.factory.account import AccountWithClientUserFactory
from scbp_core.tests.factory.user import ClientUserFactory
from scbp_core.tests.factory.user import UserFactory
from scbp_core.tests.factory.util import SCBPFactory

factory.Faker._DEFAULT_LOCALE = "en_AU"


"""
Note that out_of_area is set to False by default - this works for most tests
If your test relies on out_of_area non-cache calculation,
    either use is_out_of_area(use_cache=False) or set out_of_area=None on the affected factory
If your test relies on out_of_area specifically being True,
    set out_of_area=True on the affected factory
"""


class HourlyBookingFactory(SCBPFactory):
    class Meta:
        model = Booking

    client_user = factory.SubFactory(ClientUserFactory)
    passenger = factory.SelfAttribute("client_user")
    account = factory.SubFactory(
        AccountWithClientUserFactory,
        clients__client_user=factory.SelfAttribute("...client_user"),
    )
    created_by = factory.SubFactory(UserFactory)
    booking_type = BookingType.HOURLY
    booster_seat_count = 0
    forward_facing_baby_seat_count = 0
    hourly_booking_duration = timedelta(hours=1)
    passenger_count = 1
    baggage_count = 1
    rear_facing_baby_seat_count = 0
    requires_wedding_ribbons = False
    travel_on = make_aware(
        datetime.datetime(year=2019, month=7, day=2, hour=13, minute=30)
    )
    passenger_name = factory.Faker("name")
    passenger_phone = factory.Faker("phone_number")
    out_of_area = False


class OneWayBookingFactory(SCBPFactory):
    class Meta:
        model = Booking

    client_user = factory.SubFactory(ClientUserFactory)
    passenger = factory.SelfAttribute("client_user")
    account = factory.SubFactory(
        AccountWithClientUserFactory,
        clients__client_user=factory.SelfAttribute("...client_user"),
    )
    created_by = factory.SubFactory(UserFactory)
    booking_type = BookingType.ONE_WAY
    passenger_count = 1
    baggage_count = 1
    booster_seat_count = 0
    forward_facing_baby_seat_count = 0
    rear_facing_baby_seat_count = 0
    requires_wedding_ribbons = False
    travel_on = make_aware(
        datetime.datetime(year=2019, month=7, day=2, hour=19, minute=30)
    )
    from_address_type = BookingAddressType.CUSTOM
    destination_address_type = BookingAddressType.CUSTOM
    passenger_name = factory.Faker("name")
    passenger_phone = factory.Faker("phone_number")
    out_of_area = False


class AddressFactory(SCBPFactory):
    class Meta:
        model = BookingAddress

    address_details = factory.Dict({"utc_offset": 600})
    source_id = factory.Faker("uuid4")
    # Just Victorian postcodes by default
    postal_code = factory.Faker("bothify", text="3###", letters="0123456789")
    formatted_address = factory.Faker("street_address")
    lat = factory.Faker("latitude")
    long = factory.Faker("longitude")
    legacy_table = None
    legacy_jobnumber = None
    legacy_stop_number = None


class BookingFactory(SCBPFactory):
    class Meta:
        model = Booking

    travel_on = factory.LazyFunction(
        lambda: timezone.now() + timezone.timedelta(days=1)
    )
    client_user = factory.SubFactory(ClientUserFactory)
    passenger = factory.SelfAttribute("client_user")
    account = factory.SubFactory(
        AccountWithClientUserFactory,
        clients__client_user=factory.SelfAttribute("...client_user"),
    )
    from_address = factory.SubFactory(AddressFactory)
    destination_address = factory.SubFactory(AddressFactory)
    passenger_count = FuzzyInteger(1, 2)
    baggage_count = FuzzyInteger(0, 2)
    created_by = factory.SubFactory(UserFactory)
    vehicle_class = factory.Iterator(VehicleClass.objects.all())
    price_total = FuzzyDecimal(20, 1000)
    price_list = factory.LazyFunction(PriceList.get_current)
    out_of_area = False
    vehicle = None

    legacy_jobnumber = None
