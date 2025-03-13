import time

from django.utils import timezone
from fastprogress.fastprogress import ConsoleProgressBar
import googlemaps

from scbp_core.models import Booking

from .data_migration.bookings import migrate_booking
from .models import LegacyBookings


def run():
    last_record = (
        Booking.objects.filter(legacy_jobnumber__isnull=False)
        .order_by("legacy_jobnumber")
        .first()
    )
    lbs = LegacyBookings.objects.filter(
        # Only clients that have booked in last 2 years
        calcdaterequired__gt=(timezone.now() - timezone.timedelta(weeks=52 * 2)),
        clientno__status="Active",
        calcdeleted=False,
    ).order_by("-jobnumber")
    if last_record:
        lbs = lbs.filter(jobnumber__lt=last_record.legacy_jobnumber)
    mb = ConsoleProgressBar(lbs)

    def migrate(b, attempt=1):
        try:
            migrate_booking(b)
        except googlemaps.exceptions.ApiError:
            if attempt > 10:
                raise
            print(  # noqa T001
                f"Got googlemaps API error...waiting 10 seconds (attempt {attempt})"
            )
            time.sleep(10)
            migrate(mb, attempt + 1)

    for legacy_booking in mb:
        migrate(legacy_booking)
