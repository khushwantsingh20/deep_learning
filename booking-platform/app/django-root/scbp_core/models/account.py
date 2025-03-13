from datetime import date

from allianceutils.models import raise_validation_errors
from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import models
from django.db import transaction
from django.db.models import CASCADE
from django.db.models import Max
from django.db.models import PROTECT

from scbp_core.fields import PhoneNumberField
from scbp_core.model_mixins import ArchivableMixin
from scbp_core.models import ClientUser
from scbp_core.models import get_choices_check_constraint
from scbp_core.models import StaffUser
from scbp_core.models.account_field_choices import AccountCategoryType
from scbp_core.models.account_field_choices import AccountDriverCollectMethod
from scbp_core.models.account_field_choices import AccountInvoicingMethodType
from scbp_core.models.account_field_choices import AccountPaymentMethodType
from scbp_core.models.account_field_choices import AccountPaymentTermsType
from scbp_core.models.account_field_choices import RateScheduleType
from scbp_core.permissions import DefaultPermissionsMeta

ACCOUNT_NUMBER_STARTING_FROM = 50000


class Account(ArchivableMixin):
    account_no = models.IntegerField(editable=False)

    account_nickname = models.CharField(
        max_length=settings.MAX_LENGTH_NAME, db_index=True
    )

    business_name = models.CharField(max_length=settings.MAX_LENGTH_NAME, blank=True)

    account_email = models.CharField(max_length=settings.MAX_LENGTH_NAME, blank=True)
    contact_title = models.CharField(max_length=settings.MAX_LENGTH_NAME, blank=True)
    contact_first_name = models.CharField(
        max_length=settings.MAX_LENGTH_NAME, blank=True
    )
    contact_last_name = models.CharField(
        max_length=settings.MAX_LENGTH_NAME, blank=True
    )
    contact_phone_mobile = PhoneNumberField("Mobile", blank=True)
    contact_phone_landline = PhoneNumberField("Landline", blank=True)

    billing_address = models.CharField(max_length=settings.MAX_LENGTH_NAME, blank=True)
    rate_schedule = models.PositiveSmallIntegerField(
        choices=RateScheduleType.choices.items(), default=RateScheduleType.STANDARD
    )
    category = models.PositiveSmallIntegerField(
        choices=AccountCategoryType.choices.items()
    )
    payment_terms = models.PositiveSmallIntegerField(
        choices=AccountPaymentTermsType.choices.items(),
        default=AccountPaymentTermsType.COD,
    )
    payment_method = models.PositiveSmallIntegerField(
        choices=AccountPaymentMethodType.choices.items()
    )
    driver_collect_method = models.PositiveSmallIntegerField(
        choices=AccountDriverCollectMethod.choices.items(),
        default=AccountDriverCollectMethod.NONE,
    )
    approved_by = models.ForeignKey(StaffUser, null=True, blank=True, on_delete=PROTECT)
    invoicing_method = models.PositiveSmallIntegerField(
        choices=AccountInvoicingMethodType.choices.items()
    )

    credit_card_type = models.CharField(max_length=16, blank=True)
    credit_card_expiry_month = models.PositiveSmallIntegerField(null=True, blank=True)
    credit_card_expiry_year = models.PositiveSmallIntegerField(null=True, blank=True)
    credit_card_last4_digits = models.CharField(max_length=4, blank=True)
    # Token for payment gateway (currently Eway)
    eway_token_customer_id = models.CharField(blank=True, max_length=32)

    clients = models.ManyToManyField(
        ClientUser, through="AccountToClient", through_fields=("account", "client_user")
    )

    # PK into legacy tblCreditAccount table
    legacy_accountno = models.CharField(max_length=10, blank=True)

    class Meta(DefaultPermissionsMeta):
        db_table = "scbp_core_account"
        default_related_name = "accounts"
        verbose_name = "account"
        verbose_name_plural = "accounts"

        constraints = [
            get_choices_check_constraint(
                RateScheduleType.choices,
                "rate_schedule",
                "scbp_core_account_rate_schedule_valid",
            ),
            get_choices_check_constraint(
                AccountPaymentTermsType.choices,
                "payment_terms",
                "scbp_core_account_payment_terms_valid",
            ),
            get_choices_check_constraint(
                AccountPaymentMethodType.choices,
                "payment_method",
                "scbp_core_account_payment_method_valid",
            ),
            get_choices_check_constraint(
                AccountInvoicingMethodType.choices,
                "invoicing_method",
                "scbp_core_account_invoicing_method_valid",
            ),
        ]

    def __str__(self):
        return f"#{self.account_no} - {self.account_nickname}"

    def _validate(self):
        if self.payment_terms != AccountPaymentTermsType.COD:
            required_fields = ["contact_title", "approved_by"]
            errors = {}
            for field in required_fields:
                if not getattr(self, field, ""):
                    errors[field] = (
                        "This field is required when payment method is not COD."
                    )
            if not self.contact_phone_mobile and not self.contact_phone_landline:
                errors["contact_phone_mobile"] = (
                    "A contact number is required when payment method is not COD."
                )
            if len(errors):
                raise ValidationError(errors)

        if (
            Account.objects.filter(account_no=self.account_no)
            .exclude(pk=self.pk)
            .exists()
        ):
            raise ValidationError(
                {
                    "account_no": "This account number is already assigned to other accounts."
                }
            )

        if self.payment_method == AccountPaymentMethodType.DRIVER_COLLECT:
            if self.driver_collect_method not in (
                AccountDriverCollectMethod.CABCHARGE,
                AccountDriverCollectMethod.CAB_CARD,
                AccountDriverCollectMethod.CAB_CASH,
            ):
                raise ValidationError(
                    {
                        "driver_collect_method": "Must be set if payment method is Driver Collect."
                    }
                )

    def clean(self):
        with raise_validation_errors(super().clean) as ve:
            with ve.capture_validation_error():
                self._validate()

    def save(self, *args, **kwargs):
        self._validate()

        # Account Number is an autofield that is supposed to start from desired number and not editable.
        if not self.account_no:
            self.account_no = (
                Account.objects.aggregate(Max("account_no"))["account_no__max"]
                or ACCOUNT_NUMBER_STARTING_FROM
            ) + 1

        super().save()

    def unarchive(self):
        with transaction.atomic():
            super().unarchive()
            for link in AccountToClient.all_objects.filter(
                archived_at__isnull=False, account=self
            ):
                link.unarchive()

    def archive(self, user):
        with transaction.atomic():
            super().archive(user)
            for link in AccountToClient.objects.filter(account=self):
                link.archive(user)

    def delete(self):
        super().delete()
        for link in AccountToClient.objects.filter(account=self):
            link.delete()

    def is_credit_card_expired(self):
        today = date.today()
        month = self.credit_card_expiry_month
        year = self.credit_card_expiry_year
        if year and year < 100:
            year += 2000
        response = (
            self.payment_method == AccountPaymentMethodType.CREDIT_CARD
            and month
            and year
            and (year < today.year or (year == today.year and month < today.month))
        )
        return response


class AccountToClient(ArchivableMixin):
    account = models.ForeignKey(Account, on_delete=CASCADE)
    client_user = models.ForeignKey(ClientUser, on_delete=CASCADE)
    is_default_account = models.BooleanField(
        null=True, help_text="Is this account set as the default"
    )

    # When checked user can make bookings for anyone on this account, invite people to the account,
    # update account details etc. Without this user can only book for themselves and people on their
    # guest list.
    is_account_admin = models.BooleanField(
        default=False, help_text="Can this user manage this account?"
    )

    @transaction.atomic
    def save(self, *args, **kwargs):
        # Don't allow archived links to be default. If we don't prevent this
        # then constraint on database will prevent creating new links on a client
        # if they have archived links that are marked as default.
        if self.archived_at and self.is_default_account:
            self.is_default_account = None

        if getattr(self, "deleting", False):
            return super().save(*args, **kwargs)

        if self.is_default_account:
            AccountToClient.objects.filter(
                client_user=self.client_user, is_default_account=True
            ).exclude(id=self.id).update(is_default_account=None)
        elif not AccountToClient.objects.filter(
            client_user=self.client_user, is_default_account=True
        ).exists():
            self.is_default_account = True

        super().save(*args, **kwargs)

    @transaction.atomic
    def delete(self, hard_delete=True):
        """
        Note that we default to hard deletes for the links. This is so
        that once you delete a link you can add it back otherwise it's filtered
        out by default. The only need for archiving links is so that if you
        archive an account then the link is also archived.
        """
        if self.is_default_account:
            self.deleting = True
            self.is_default_account = None
            super().delete(hard_delete=hard_delete)

            atoc = AccountToClient.objects.filter(client_user=self.client_user).first()
            if atoc:
                atoc.is_default_account = True
                atoc.save()
        else:
            super().delete(hard_delete=hard_delete)

    class Meta(DefaultPermissionsMeta):
        db_table = "scbp_core_account_to_client"
        default_related_name = "account_to_client"
        unique_together = [
            ["client_user", "account"],
            ["client_user", "is_default_account"],
        ]

    def __str__(self):
        return f"#{self.account} / {self.client_user}"
