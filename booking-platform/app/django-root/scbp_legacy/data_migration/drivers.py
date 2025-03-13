from django.utils import timezone

from django_site import settings
from scbp_core.models import DriverUser
from scbp_core.models import User
from scbp_legacy.data_migration import strip
from scbp_legacy.models import LegacyDriver


def migrate_driver(legacy_driver: LegacyDriver):
    address = " ".join(
        map(
            strip,
            filter(
                bool,
                [
                    legacy_driver.addrnumber,
                    legacy_driver.addrstreet,
                    legacy_driver.addrstreettype,
                    legacy_driver.addrsuburb,
                    legacy_driver.addrpostcode,
                    legacy_driver.addrstate,
                ],
            ),
        )
    )
    email = strip(legacy_driver.emailaddress).lower()
    if email and User.objects.filter(email=email).exists():
        email = None
    if not email:
        email = settings.LEGACY_DRIVER_EMAIL_ADDRESS_TEMPLATE.format(
            legacy_driver.driverno
        )
    return DriverUser.objects.create(
        driver_no=legacy_driver.driverno,
        drivers_license_number=legacy_driver.dlno,
        drivers_license_expiry_date=legacy_driver.dlexpdate
        or timezone.datetime(1990, 1, 1),
        date_of_birth=legacy_driver.dob,
        abn=legacy_driver.abn,
        operations_manual_number=strip(legacy_driver.opmanualno),
        operations_manual_issued_date=legacy_driver.opmanualissuedate
        or timezone.datetime(1990, 1, 1),
        operations_manual_returned_date=legacy_driver.opmanualreturndate,
        operations_manual_version=strip(legacy_driver.opmanualversion),
        commision_rate=legacy_driver.commissionrate or 0,
        driver_certificate_number=-1,
        driver_certificate_expiry_date=timezone.datetime(1990, 1, 1),
        start_date=legacy_driver.startdate or timezone.datetime(1990, 1, 1),
        end_date=legacy_driver.terminationdate,
        first_name=legacy_driver.firstname,
        last_name=legacy_driver.lastname,
        email=email,
        address=address,
        mobile=legacy_driver.mobileph or "",
        home_phone=legacy_driver.homeph or "",
    )
