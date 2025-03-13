from collections import OrderedDict
from decimal import Decimal

from django.contrib.postgres.fields import DateRangeField
from django.db import connection
from django.db import models
from django.db import transaction
from django.db.migrations import RunSQL
from django.db.models import Q
from django.utils import timezone

from scbp_core.fields import get_choices_check_constraint
from scbp_core.model_mixins import TimestampFieldsMixin
from scbp_core.models import AccountPaymentMethodType
from scbp_core.permissions import DefaultPermissionsMeta
from scbp_core.services.credit_card_surcharge import get_surcharge_rate

STATEMENT_NUMBER_START = 10000


class StatementStatus:
    PENDING = 1
    PAID = 2

    choices = OrderedDict(((PENDING, "Pending"), (PAID, "Paid")))


class AccountStatement(TimestampFieldsMixin):
    account = models.ForeignKey("scbp_core.Account", models.PROTECT)
    statement_number = models.CharField(max_length=50, unique=True)
    # NOTE: This is normalised in postgres to upper bound being non-inclusive. Use the
    # get_period_end() method to get the end of period inclusive rather than reading period.upper.
    # On first assignment it may be inclusive but after reading from database it will be
    # exclusive
    period = DateRangeField()
    issued_on = models.DateField()
    payment_method = models.PositiveSmallIntegerField(
        choices=list(AccountPaymentMethodType.choices.items())
    )
    statement_status = models.PositiveSmallIntegerField(
        choices=list(StatementStatus.choices.items()), default=StatementStatus.PENDING
    )
    date_paid = models.DateTimeField(null=True)
    custom_message = models.TextField(blank=True)

    class Meta(DefaultPermissionsMeta):
        db_table = "scbp_core_statement"
        default_related_name = "statements"
        constraints = [
            models.CheckConstraint(
                check=Q(
                    date_paid__isnull=True, statement_status=StatementStatus.PENDING
                )
                | Q(date_paid__isnull=False, statement_status=StatementStatus.PAID),
                name="scbp_core_statement_date_paid_status",
            ),
            get_choices_check_constraint(
                AccountPaymentMethodType.choices,
                "payment_method",
                "scbp_core_statement_payment_method",
            ),
            get_choices_check_constraint(
                StatementStatus.choices,
                "statement_status",
                "scbp_core_statement_statement_status",
            ),
        ]

    STATEMENT_SEQUENCE_NAME = "scbp_core_statement_number_sequence"

    @classmethod
    def get_custom_migration_commands(cls):
        return [
            RunSQL(
                f"CREATE SEQUENCE IF NOT EXISTS {cls.STATEMENT_SEQUENCE_NAME} START {STATEMENT_NUMBER_START}",
                f"DROP SEQUENCE {cls.STATEMENT_SEQUENCE_NAME}",
                elidable=False,
            )
        ]

    def __str__(self):
        return self.statement_number

    def get_next_statement_number(self):
        with connection.cursor() as cursor:
            cursor.execute("SELECT nextval(%s)", [self.STATEMENT_SEQUENCE_NAME])
            row = cursor.fetchone()
            return str(row[0])

    def get_credit_card_surcharge_rate(self):
        return get_surcharge_rate(self.account.credit_card_type)

    def save(self, *args, **kwargs):
        if not self.id:
            self.statement_number = self.get_next_statement_number()
        super().save(*args, **kwargs)
        # Create a payment record for this statement IF:
        # 1. The payment method is Credit Card
        # 2. There are invoice records attached to this statement without associated payments

        from scbp_core.models import InvoiceStatus

        cc_invoices = self.invoices.filter(
            payment__isnull=True,
            # Only select invoices being paid by CC - eg. driver collect invoices
            # if mixed in shouldn't be charged
            payment_method=AccountPaymentMethodType.CREDIT_CARD,
            invoice_status=InvoiceStatus.PENDING,
            # Michael confirmed 27/03/2020 that refunds should be excluded from statements
            # They will manually handle these for non COD invoices. COD invoices are paid
            # immediately so never get here.
            invoice_total_amount__gt=Decimal("0"),
        )
        if (
            self.payment_method == AccountPaymentMethodType.CREDIT_CARD
            and cc_invoices.count() > 0
        ):
            # Local import to avoid circular import
            from scbp_core.models import Payment

            with transaction.atomic():
                self.refresh_from_db()
                invoices = cc_invoices.select_for_update()
                invoice_total = invoices.aggregate(models.Sum("invoice_total_amount"))[
                    "invoice_total_amount__sum"
                ]
                payment = Payment(
                    account=self.account,
                    payment_method=self.payment_method,
                    base_amount=invoice_total,
                )
                payment.save()
                self.payment = payment
                invoices.update(payment=payment)
                payment.charge(defer=True)

    def get_period_start(self):
        return self.period.lower

    def get_period_end(self):
        # From the docs: Regardless of the bounds specified when saving the data,
        # PostgreSQL always returns a range in a canonical form that includes the
        # lower bound and excludes the upper bound; that is [).
        # So end date inclusive we need to subtract a day
        if self.period.upper_inc:
            # It will be inclusive if assigned like that however before save... so need to handle both cases
            return self.period.upper
        return self.period.upper - timezone.timedelta(days=1)
