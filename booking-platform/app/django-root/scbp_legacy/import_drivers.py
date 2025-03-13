from fastprogress.fastprogress import ConsoleProgressBar

from scbp_core.models import ClientUser
from scbp_core.models import DriverUser

from .data_migration.drivers import migrate_driver
from .models import LegacyDriver


def run():
    mb = ConsoleProgressBar(LegacyDriver.objects.all())
    if ClientUser.objects.count() < 10000:
        raise ValueError("Import clients first")
    for legacy_driver in mb:
        if not DriverUser.objects.filter(driver_no=legacy_driver.driverno).exists():
            migrate_driver(legacy_driver)
