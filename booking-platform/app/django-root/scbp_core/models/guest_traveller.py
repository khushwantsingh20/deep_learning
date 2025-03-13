from django.conf import settings
from django.db import models

from scbp_core.fields import PhoneNumberField
from scbp_core.permissions import DefaultPermissionsMeta


class GuestTraveller(models.Model):
    """Tracks guest travellers for a client"""

    name = models.CharField(max_length=settings.MAX_LENGTH_NAME)
    phone_number = PhoneNumberField()
    client_user = models.ForeignKey(
        "scbp_core.ClientUser",
        models.CASCADE,
        help_text="Client this guest is associated with",
    )

    class Meta(DefaultPermissionsMeta):
        db_table = "scbp_core_guest_traveller"
        ordering = ["name"]
