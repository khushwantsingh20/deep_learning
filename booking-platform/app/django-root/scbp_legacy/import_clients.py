from django.utils import timezone
from fastprogress.fastprogress import ConsoleProgressBar

from scbp_core.models import ClientUser

from .data_migration import migrate_client_and_account
from .models import LegacyClient


def run():
    # We import newest records first. This is so when we encounter duplicate emails the most recent
    # client gets the authoritative version (eg. client@domain.com) and subsequent ones get generated
    # variations (client+2@domain.com)
    last_record = (
        ClientUser.objects.filter(legacy_clientno__isnull=False)
        .order_by("legacy_clientno")
        .first()
    )
    lcs = (
        LegacyClient.objects.filter(
            status="Active",
            # Only clients that have booked in last 5 years
            bookings__calcdaterequired__gt=(
                timezone.now() - timezone.timedelta(weeks=52 * 5)
            ),
        )
        .distinct()
        .order_by("-clientno")
    )
    if last_record:
        lcs = lcs.filter(clientno__lt=last_record.legacy_clientno)
    mb = ConsoleProgressBar(lcs)
    for legacy_client in mb:
        migrate_client_and_account(legacy_client)
