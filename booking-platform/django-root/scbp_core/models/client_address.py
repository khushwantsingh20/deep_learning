from collections import OrderedDict

from allianceutils.models import raise_validation_errors
from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import models

from scbp_core.fields import get_choices_check_constraint
from scbp_core.model_mixins import AddressFieldsMixin
from scbp_core.models import BookingAddressType
from scbp_core.permissions import DefaultPermissionsMeta


class ClientAddressType:
    # For convenience in doing comparisons we want the HOME and OFFICE
    # choices for bookings and address book addresses to match
    HOME = BookingAddressType.HOME
    OFFICE = BookingAddressType.OFFICE
    OTHER = BookingAddressType.ADDRESS_BOOK

    choices = OrderedDict(((HOME, "Home"), (OFFICE, "Office"), (OTHER, "Other")))


class ClientAddressLegacyTable:
    ADDRESS_BOOK = 1
    FREQUENT_DESTINATION = 2
    FREQUENT_PICKUP = 3

    choices = OrderedDict(
        (
            (ADDRESS_BOOK, "AddressBookContacts"),
            (FREQUENT_DESTINATION, "FrequentDestinations"),
            (FREQUENT_PICKUP, "FrequentPickups"),
        )
    )


class ClientAddress(AddressFieldsMixin):
    client = models.ForeignKey("scbp_core.ClientUser", on_delete=models.CASCADE)
    # HOME and OFFICE and 2 special cases; everything else is OTHER
    # These exist as special cases so UI on frontend can display
    # them as special standalone options
    address_type = models.PositiveSmallIntegerField(
        choices=ClientAddressType.choices.items()
    )
    # Required if address_type = 'OTHER'
    address_label = models.CharField(max_length=settings.MAX_LENGTH_NAME, blank=True)
    address_instructions = models.TextField(blank=True)

    # PK into legacy tables
    # legacy_table is either tblFrequentDestinations, tblFrequentPickups or AddressBookContacts
    # legacy_recordid is the pk for that table
    # legacy_seqno is for the tblFrequent* tables which have a compound key with this field
    legacy_recordid = models.CharField(blank=True, max_length=50)
    legacy_seqno = models.IntegerField(null=True)
    legacy_table = models.IntegerField(
        choices=list(ClientAddressLegacyTable.choices.items()), null=True
    )

    class Meta(DefaultPermissionsMeta):
        db_table = "scbp_core_client_address"

        constraints = [
            get_choices_check_constraint(
                ClientAddressType.choices,
                "address_type",
                "scbp_core_client_address_address_type_valid",
            ),
            get_choices_check_constraint(
                ClientAddressLegacyTable.choices,
                "legacy_table",
                "scbp_core_client_address_legacy_table_valid",
            ),
            models.UniqueConstraint(
                fields=["legacy_table", "legacy_recordid", "legacy_seqno"],
                name="legacy_client_address_unique",
            ),
        ]

    def _validate(self):
        """Validation rules we must enforce before record can be saved to database

        Serializer will validate most things (require fields etc) - this just enforces
        certain constraints we want to always be true no matter how the record is
        created.
        """
        if self.address_type != ClientAddressType.OTHER:
            if (
                ClientAddress.objects.filter(
                    address_type=self.address_type, client=getattr(self, "client", None)
                )
                .exclude(pk=self.pk)
                .exists()
            ):
                raise ValidationError(
                    {
                        "address_type": "There is already an address of this type for this client"
                    }
                )

        if self.address_type == ClientAddressType.OTHER and not self.address_label:
            raise ValidationError(
                {"address_label": "Please enter a label for this address"}
            )

    def clean(self):
        with raise_validation_errors(super().clean) as ve:
            with ve.capture_validation_error():
                self._validate()

    def save(self, *args, **kwargs):
        self._validate()
        super().save()
