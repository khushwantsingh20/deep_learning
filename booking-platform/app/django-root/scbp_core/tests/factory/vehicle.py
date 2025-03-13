import factory
from factory.fuzzy import FuzzyAttribute
from factory.fuzzy import FuzzyDate
from factory.fuzzy import FuzzyFloat
from factory.fuzzy import FuzzyInteger

from scbp_core.models import Vehicle
from scbp_core.models import VehicleClass
from scbp_core.models import VehicleColor
from scbp_core.models import VehicleOperator
from scbp_core.tests.factory.methods import serial
from scbp_core.tests.factory.util import SCBPFactory

factory.Faker._DEFAULT_LOCALE = "en_AU"


class VehicleClassFactory(SCBPFactory):
    class Meta:
        model = VehicleClass

    title = factory.Faker("domain_word")
    description = factory.Faker("sentence")
    max_passenger_count = FuzzyInteger(1, 10)
    max_baggage_count = FuzzyInteger(1, 10)
    max_child_seat_count = FuzzyInteger(1, 4)

    min_hourly_surcharge_fixed = FuzzyInteger(1, 1000)
    min_hourly_surcharge_perc = FuzzyInteger(1, 100)

    one_way_pickup_rate = FuzzyInteger(1, 100)
    one_way_off_peak_pickup_rate = FuzzyInteger(1, 100)
    one_way_rate_tier1 = FuzzyInteger(1, 100)
    one_way_rate_tier2 = FuzzyInteger(1, 100)
    one_way_rate_tier3 = FuzzyInteger(1, 100)
    one_way_off_peak_rate_tier1 = FuzzyInteger(1, 100)
    one_way_off_peak_rate_tier2 = FuzzyInteger(1, 100)
    one_way_off_peak_rate_tier3 = FuzzyInteger(1, 100)


class VehicleColorFactory(SCBPFactory):
    class Meta:
        model = VehicleColor


class VehicleOperatorFactory(SCBPFactory):
    class Meta:
        model = VehicleOperator

    vehicle_operator_no = FuzzyAttribute(lambda: serial(3))
    company_name = factory.Faker("company")

    lat = FuzzyFloat(-90, 90)
    long = FuzzyFloat(-180, 180)
    address = factory.Faker("address")

    abn = FuzzyAttribute(lambda: serial(0, 11))
    is_abn_verified = True

    contact_title = factory.Faker("catch_phrase")
    contact_first_name = factory.Faker("first_name")
    contact_last_name = factory.Faker("last_name")
    contact_email = factory.Faker("email")

    contact_phone = FuzzyAttribute(lambda: "9" + serial(0, 7))
    contact_mobile = FuzzyAttribute(lambda: "04" + serial(0, 8))

    classification = FuzzyInteger(1, 6)

    has_agreement_with_sc = True
    agreement_date = FuzzyDate()
    renewal_date = FuzzyDate()

    service_fee_percent = FuzzyInteger(0, 99)
    marketing_levy = FuzzyInteger(0, 99)
    monthly_depot_fee = FuzzyInteger(0, 99999)

    bank_name = factory.Faker("bs")
    bank_account_name = factory.Faker("windows_platform_token")
    bank_bsb = FuzzyAttribute(lambda: serial(0, 6))
    bank_account_number = FuzzyAttribute(lambda: serial(0, 8))


class VehicleFactory(SCBPFactory):
    class Meta:
        model = Vehicle

    car_no = FuzzyAttribute(lambda: serial(3))
    commerical_passenger_vehicle_license = FuzzyAttribute(lambda: serial(6))

    make = factory.Faker("mac_processor")
    model = factory.Faker("linux_processor")
    year_of_manufacture = FuzzyInteger(1700, 1900)
    odometer = FuzzyInteger(0, 999999)

    car_class = factory.SubFactory(VehicleClassFactory)
    color = factory.SubFactory(VehicleColorFactory)
    vehicle_operator = factory.SubFactory(VehicleOperatorFactory)

    inspection_date = FuzzyDate()
    radio_serial_no = FuzzyAttribute(lambda: serial(10))
