from django.core.management.base import BaseCommand

from scbp_core.models import ClientUser
from scbp_core.services.campaign_monitor import export_subscriptions


class Command(BaseCommand):
    def handle(self, *args, **options):
        export_subscriptions(ClientUser.objects.order_by("activated_at"))
