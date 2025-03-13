import datetime
from decimal import Decimal
from typing import Union

from celery import shared_task
from dateutil import parser
from django.db import transaction
from psycopg2.extras import DateRange

from scbp_core.models import Account
from scbp_core.models import AccountStatement
from scbp_core.models import Invoice
from scbp_core.models import InvoiceStatus
from scbp_core.services.send_statement_email import send_statement_emails


def get_date_for_value(
    value: Union[datetime.datetime, datetime.date, str, bytes]
) -> datetime.date:
    """
    We don't necessarily know what will be passed in as a date representation.  `parser.parse` is OK with strings, bytes
    etc. but raises if a date/datetime value is passed in.
    """
    if isinstance(value, datetime.date):
        return value
    if isinstance(value, datetime.datetime):
        return value.date()
    return parser.parse(value).date()


@shared_task
def create_statements(
    *, account_id=None, payment_method=None, raw_lower, raw_upper, custom_message=""
):
    """
    Take the serialized parameters from CreateStatementsSerializer, create the
    corresponding statement records, and generate and email the statement documents

    :param account_id: The ID of the account to generate a statement for - None for all accounts
    :param payment_method: The payment method for which to generate statements - None for all payment methods
    :param raw_lower: The start of the date range for which to generate statements
    :param raw_upper: The end of the date range for which to generate statements
    :param custom_message: (Optional) Custom message to attach to all of the created statements
    """
    # Convert the raw date strings into dates
    lower = get_date_for_value(raw_lower)
    upper = get_date_for_value(raw_upper)

    # Create the date range object to pass into AccountStatement constructor
    # Bounds '[]' ensures both lower and upper are included in range
    date_range = DateRange(lower=lower, upper=upper, bounds="[]")

    # Get the set of accounts
    with transaction.atomic():
        raw_accounts = (
            Account.all_objects.filter(pk=account_id)
            if account_id
            else Account.all_objects.all()
        ).prefetch_related("bookings", "bookings__invoices")
        if payment_method:
            raw_accounts = raw_accounts.filter(payment_method=payment_method)

        # Set up the filter for invoice values
        invoice_filter = {"issued_on__range": (lower, upper), "statement__isnull": True}
        if payment_method:
            invoice_filter["payment_method"] = payment_method

        # Fetch the set of accounts for which statements should be generated
        # We start from the invoice for the sake of efficiency
        # (in dev, starting from account induced a noticeable delay)
        all_invoices = Invoice.objects.filter(
            # Michael confirmed 27/03/2020 that refunds should be excluded from statements
            # They will manually handle these for non COD invoices. COD invoices are paid
            # immediately so never get here.
            invoice_total_amount__gt=Decimal("0"),
            booking__account__in=raw_accounts,
            invoice_status=InvoiceStatus.PENDING,
            **invoice_filter,
        ).select_related("booking__account")
        account_references = all_invoices.distinct("booking__account").values(
            "booking__account"
        )
        accounts = Account.objects.filter(
            pk__in=[reference["booking__account"] for reference in account_references]
        ).select_for_update()
        filtered_invoices = all_invoices.filter(
            booking__account__in=accounts
        ).select_for_update()

        # For each account for which we can generate a statement, generate the statement
        generated_statements = []
        for account in accounts:
            invoices = filtered_invoices.filter(booking__account=account)
            statement = AccountStatement(
                account=account,
                period=date_range,
                payment_method=account.payment_method,
                custom_message=custom_message,
            )
            # Statement issued on is always the end of the period
            statement.issued_on = statement.get_period_end()
            statement.save()
            invoices.update(statement=statement)
            generated_statements.append(statement)
            # Trigger charging by saving again
            statement.save()
    # Send the emails outside transaction so failure doesn't rollback
    send_statement_emails(generated_statements)
