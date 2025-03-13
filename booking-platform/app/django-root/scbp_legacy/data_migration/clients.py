from collections import defaultdict
from functools import lru_cache
import logging
import re
from typing import Optional
from typing import Union

from django.conf import settings
from django.db import models
from django.db import transaction
from django.db.models import Max
from django.db.models import Q
from django.db.models.functions import Cast
from django.db.models.functions import Trim
from django.utils import timezone

from scbp_core.models import Account
from scbp_core.models import AccountCategoryType
from scbp_core.models import AccountInvoicingMethodType
from scbp_core.models import AccountPaymentMethodType
from scbp_core.models import AccountPaymentTermsType
from scbp_core.models import AccountToClient
from scbp_core.models import ClientAddress
from scbp_core.models import ClientAddressLegacyTable
from scbp_core.models import ClientAddressType
from scbp_core.models import ClientUser
from scbp_core.models import RateScheduleType
from scbp_core.models import StaffUser
from scbp_core.models.guest_traveller import GuestTraveller
from scbp_core.models.user import ClientUserPriority
from scbp_core.models.user_type import UserType
from scbp_legacy.data_migration.util import choose_first
from scbp_legacy.data_migration.util import strip
from scbp_legacy.models import LegacyClient
from scbp_legacy.models import LegacyContact
from scbp_legacy.models import LegacyCreditaccount
from scbp_legacy.models import LegacyFrequentdestinations
from scbp_legacy.models import LegacyFrequentpickups
from scbp_legacy.models_services import AddressBookContacts

logger = logging.getLogger("legacy_migration")


# Some things require a contact title. Use this where we have none.
DEFAULT_TITLE = "M"

# Some things require a contact number. Use this where we have none.
DUMMY_PHONE_NUMBER = "-1"


def _get_distinct_values(model, field_name):
    return (
        model.objects.order_by(field_name)
        .values(field_name)
        .distinct()
        .values_list(field_name, flat=True)
    )


def parse_priority(value):
    """
    >>> distinct_values = _get_distinct_values(LegacyClient, 'priority')
    >>> { v: parse_priority(v) for v in distinct_values }
    {None: 3, 0: 3, 1: 1, 2: 2, 3: 3}
    """
    if not value:
        return ClientUserPriority.LOW
    return value


def parse_cc_expiry(expiry_date: str):
    """
    >>> parse_cc_expiry("0901")
    (9, 1)
    >>> parse_cc_expiry("09/01")
    (9, 1)
    >>> parse_cc_expiry("/".join(["09", "01"]))
    (9, 1)
    >>> parse_cc_expiry("09.01")
    (9, 1)
    >>> # Make sure doesn't throw on any values
    >>> distinct_values = _get_distinct_values(LegacyCreditaccount, 'creditcardexpirydate')
    >>> for v in distinct_values:
    ...     month, year = parse_cc_expiry(v)
    """
    if expiry_date is None or not expiry_date.strip():
        return None, None
    expiry_date = expiry_date.strip()
    try:
        if "/" not in expiry_date and len(expiry_date) == 4:
            month = expiry_date[:2]
            year = expiry_date[-2:]
        else:
            month, year = re.split("[ ./\\\\]", expiry_date)
        return int(month), int(year)
    except ValueError:
        return None, None


def parse_card_type(card_type: Optional[str]):
    """Parse card type so uses consistent values
    >>> parse_card_type(None)
    >>> parse_card_type("")
    >>> parse_card_type("M/C")
    'Mastercard'
    >>> parse_card_type("B/C")
    'Bankcard'
    >>> parse_card_type("Amex")
    'American Express'
    >>> distinct_values = _get_distinct_values(LegacyCreditaccount, 'creditcardtype')
    >>> sorted(filter(bool, list({ parse_card_type(v) for v in distinct_values })))
    ['American Express', 'Bankcard', 'Diners', 'Mastercard', 'Visa']
    """
    if card_type is None or not card_type.strip():
        return None
    card_type = card_type.strip()
    mapping = {"B/C": "Bankcard", "M/C": "Mastercard", "Amex": "American Express"}
    return mapping.get(card_type, card_type)


def parse_credit_card_number(number: Optional[str]):
    """
    >>> parse_credit_card_number(None)
    ''
    >>> parse_credit_card_number("")
    ''
    >>> parse_credit_card_number("1")
    '1'
    >>> parse_credit_card_number("**** **** **** 4321 ")
    '4321'
    """
    if number is None or not number.strip():
        return ""
    number = number.strip()
    return number[-4:]


def parse_invoicing_method(method: Optional[str]) -> AccountInvoicingMethodType:
    """
    >>> distinct_values = _get_distinct_values(LegacyCreditaccount, 'invoicingmethod')
    >>> { v: parse_invoicing_method(v) for v in distinct_values }
    {None: 1, '': 1, 'Both': 1, 'Email': 1, 'Mail': 3}
    """
    method = strip(method)
    if not method:
        return AccountInvoicingMethodType.EMAIL
    mapping = {
        "Email": AccountInvoicingMethodType.EMAIL,
        "Mail": AccountInvoicingMethodType.MAIL,
        "Both": AccountInvoicingMethodType.EMAIL,
    }
    if method not in mapping:
        raise ValueError(f"Unexpected value {method}")
    return mapping[method]


def parse_rate_schedule(rate_schedule: Optional[str]) -> RateScheduleType:
    """
    >>> distinct_values = _get_distinct_values(LegacyCreditaccount, 'rateschedule')
    >>> { v: parse_rate_schedule(v) for v in distinct_values }
    {'AAMI': 4, 'Corporate': 3, 'Retail': 2, 'Standard': 1}
    """
    rate_schedule = strip(rate_schedule)
    if not rate_schedule:
        return RateScheduleType.STANDARD
    mapping = {
        "Standard": RateScheduleType.STANDARD,
        "Corporate": RateScheduleType.CORPORATE,
        "Retail": RateScheduleType.RETAIL,
        # Old value - maps to corporate in new system. Only 7 accounts have this set.
        "AAMI": RateScheduleType.INSTITUTION,
    }
    if rate_schedule not in mapping:
        raise ValueError(f"Unexpected value {rate_schedule}")
    return mapping[rate_schedule]


def generate_account_nickname(
    legacy_client: LegacyClient, legacy_account: Optional[LegacyCreditaccount]
):
    client_name = strip(
        strip(legacy_client.surname) + " " + strip(legacy_client.firstnames)
    )
    organisation = None
    dept = None
    if legacy_account:
        organisation = strip(legacy_account.organisation)
        dept = strip(legacy_account.dept)
    if not organisation:
        organisation = strip(legacy_client.organisation)
    name = "/".join(
        filter(
            bool,
            [organisation, client_name, dept],
        )
    )
    if name:
        return name
    return "Default Account"


def get_account_approved_by():
    return StaffUser.objects.get_or_create(
        email="client-southerncross+datamigration@alliancesoftware.com.au",
        defaults=dict(
            first_name="Legacy",
            last_name="System",
            user_type=UserType.STAFF_TELEPHONIST,
        ),
    )[0]


@lru_cache()
def get_legacy_max_accountno():
    f = Q()
    for i in range(10):
        f |= Q(acc_trimmed__contains=str(i))
    return (
        LegacyCreditaccount.objects.annotate(acc_trimmed=Trim("accountno"))
        .filter(f)
        .exclude(acc_trimmed__contains="/")
        .aggregate(acc_no=Max(Cast("acc_trimmed", models.IntegerField())))
    )["acc_no"]


def get_account_no(legacy_client: LegacyClient, account_no: Optional[str]):
    # Turns out account no in old system is not used - they just use client number.
    # When we import we only create 1 account per client so we can safely just
    # use the client no for the account no
    return legacy_client.clientno


# List of addresses people have used for melbourne airport
# We don't want address book entries for these
melb_airport_addresses = [
    "mel airport 3045",
    "melb  airport 3045",
    "melb airoport 3045",
    "melb airport",
    "melb airport 3000",
    "melb airport 3045",
    "melb airport 3046",
    "melb airport 3051",
    "melb airport 3054",
    "melb airport 3055",
    "melb airport 3065",
    "melb airport`",
    "melb airpot 3045",
    "melb airprt 3045",
    "melb airp[ort 3045",
    "melb int airport",
    "melb int airport 3045",
    "melb intairport 3045",
    "melbourne airport",
    "melbourne airport 3045",
    "melb airport",
    "melb airport 3045",
]


def create_address(client, formatted_address, address_label, **kwargs):
    if (
        address_label.lower()
        in ["airport", "melbourne airport", "melb airport", "melb. airport"]
        or strip(formatted_address.lower()) in melb_airport_addresses
    ):
        return None
    if (
        not ClientAddress.objects.filter(client=client)
        .filter(
            formatted_address=formatted_address,
            address_label=address_label,
            address_instructions=kwargs.get("address_instructions", ""),
        )
        .exists()
    ):
        return ClientAddress.objects.create(
            client=client,
            formatted_address=formatted_address,
            address_label=address_label,
            country_code="AU",
            address_details="",
            lat=0,
            long=0,
            source_id="",
            **kwargs,
        )


def create_invoice_account(
    payment_method: str,
    client_user: ClientUser,
    legacy_client: LegacyClient,
    category: AccountCategoryType,
):
    logger.info(f"CLIENT {legacy_client.pk}: Creating invoice account")
    legacy_account: Optional[LegacyCreditaccount] = getattr(
        legacy_client, "credit_account", None
    )
    account_kwargs = dict(
        category=category,
        account_nickname=generate_account_nickname(legacy_client, legacy_account),
        payment_method=AccountPaymentMethodType.INVOICE,
        payment_terms=AccountPaymentTermsType.THIRTY_DAYS,
    )
    if hasattr(legacy_client, "credit_account"):
        billing_address = " ".join(
            map(
                strip,
                filter(
                    bool,
                    [
                        legacy_account.addrnumber,
                        legacy_account.addrstreet,
                        legacy_account.addrstreettype,
                        legacy_account.addrsuburb,
                        legacy_account.addrpcode,
                        legacy_account.addrstate,
                    ],
                ),
            )
        )
        account = Account(
            **account_kwargs,
            account_no=get_account_no(legacy_client, legacy_account.accountno),
            billing_address=billing_address,
            contact_first_name=strip(legacy_account.firstnames),
            contact_last_name=strip(legacy_account.surname),
            contact_title=strip(legacy_account.title) or DEFAULT_TITLE,
            contact_phone_landline=strip(legacy_account.phone),
            contact_phone_mobile=strip(legacy_account.mobile),
            account_email=choose_first(
                [legacy_account.emailaddress, client_user.email]
            ),
            invoicing_method=parse_invoicing_method(legacy_account.invoicingmethod),
            rate_schedule=parse_rate_schedule(legacy_account.rateschedule),
            approved_by=get_account_approved_by(),
            legacy_accountno=legacy_account.accountno,
        )
        # For non COD we need a number - set it to dummy value
        if not account.contact_phone_mobile and not account.contact_phone_landline:
            account.contact_phone_mobile = DUMMY_PHONE_NUMBER
        account.save()
    else:
        billing_address = " ".join(
            map(
                strip,
                filter(
                    bool,
                    [
                        legacy_client.addrnumber,
                        legacy_client.addrstreet,
                        legacy_client.addrstreettype,
                        legacy_client.addrsuburb,
                        legacy_client.addrpostcode,
                        legacy_client.addrstate,
                    ],
                ),
            )
        )
        account = Account.objects.create(
            **account_kwargs,
            account_no=get_account_no(legacy_client, None),
            billing_address=billing_address,
            contact_first_name=client_user.first_name,
            contact_last_name=client_user.last_name,
            contact_title=strip(legacy_client.title) or DEFAULT_TITLE,
            contact_phone_mobile=strip(legacy_client.phone) or DUMMY_PHONE_NUMBER,
            account_email=client_user.email,
            invoicing_method=AccountInvoicingMethodType.EMAIL,
            approved_by=get_account_approved_by(),
        )
    AccountToClient.objects.create(
        client_user=client_user,
        account=account,
        is_account_admin=True,
        is_default_account=True,
    )
    logger.info(
        f"CLIENT {legacy_client.pk}: Created invoice account {account.pk} from payment method of {payment_method}"
    )
    return account


def create_prepaid_direct_debit_account(
    payment_method: str,
    client_user: ClientUser,
    legacy_client: LegacyClient,
    category: AccountCategoryType,
):
    logger.info(
        f"CLIENT {legacy_client.pk}: Ignoring payment method {payment_method} - no account created"
    )


def create_credit_account(
    payment_method: str,
    client_user: ClientUser,
    legacy_client: LegacyClient,
    category: AccountCategoryType,
) -> Optional[Account]:
    logger.info(f"CLIENT {legacy_client.pk}: Creating credit account")
    if not hasattr(legacy_client, "credit_account"):
        logger.info(
            f"CLIENT {legacy_client.pk}: No credit account in legacy data; no account created"
        )
        return None
    legacy_account: LegacyCreditaccount = legacy_client.credit_account
    billing_address = " ".join(
        filter(
            bool,
            map(
                strip,
                [
                    legacy_account.addrnumber,
                    legacy_account.addrstreet,
                    legacy_account.addrstreettype,
                    legacy_account.addrsuburb,
                    legacy_account.addrpcode,
                    legacy_account.addrstate,
                ],
            ),
        )
    )
    exp_month, exp_year = parse_cc_expiry(legacy_account.creditcardexpirydate)
    account = Account(
        category=category,
        account_no=get_account_no(legacy_client, legacy_account.accountno),
        account_nickname=generate_account_nickname(legacy_client, legacy_account),
        billing_address=billing_address,
        credit_card_type=strip(legacy_account.creditcardtype or ""),
        credit_card_expiry_month=exp_month,
        credit_card_expiry_year=exp_year,
        credit_card_last4_digits=parse_credit_card_number(
            legacy_account.creditcardnumber
        ),
        contact_first_name=strip(legacy_account.firstnames),
        contact_last_name=strip(legacy_account.surname),
        contact_title=strip(legacy_account.title) or DEFAULT_TITLE,
        contact_phone_mobile=strip(legacy_account.mobile),
        contact_phone_landline=strip(legacy_account.phone),
        account_email=choose_first([legacy_account.emailaddress, client_user.email]),
        invoicing_method=parse_invoicing_method(legacy_account.invoicingmethod),
        rate_schedule=parse_rate_schedule(legacy_account.rateschedule),
        eway_token_customer_id=strip(legacy_account.tokenid),
        payment_method=AccountPaymentMethodType.CREDIT_CARD,
        # Not obvious but 7 day invoice in old system maps to thirty day terms in new system
        payment_terms=(
            AccountPaymentTermsType.THIRTY_DAYS
            if payment_method == "7 Day Invoice"
            else AccountPaymentTermsType.COD
        ),
        approved_by=get_account_approved_by(),
        legacy_accountno=legacy_account.accountno,
    )
    if (
        account.payment_terms != AccountPaymentTermsType.COD
        and not account.contact_phone_mobile
        and not account.contact_phone_landline
    ):
        account.contact_phone_mobile = DUMMY_PHONE_NUMBER
    account.save()
    AccountToClient.objects.create(
        client_user=client_user,
        account=account,
        is_account_admin=True,
        is_default_account=True,
    )
    logger.info(
        f"CLIENT {legacy_client.pk}: Created credit account {account.pk} with payment terms {account.get_payment_terms_display()} from payment method of {payment_method}"
    )
    return account


def create_no_account(
    payment_method: str,
    client_user: ClientUser,
    legacy_client: LegacyClient,
    category: AccountCategoryType,
) -> Optional[Account]:
    logger.info(f"CLIENT {legacy_client.pk}: No payment method set; no account created")
    return None


def get_account_creation_method(payment_method):
    """
    >>> distinct_values = _get_distinct_values(LegacyClient, 'paymentmethod')
    >>> results = []
    >>> for v in distinct_values:
    ...   payment_method, fn = get_account_creation_method(v)
    ...   results.append((payment_method, fn.__name__))
    >>> results
    [('', 'create_no_account'), ('', 'create_no_account'), ('30 Day Direct Debit', 'create_prepaid_direct_debit_account'), ('30 Day Invoice', 'create_invoice_account'), ('7 Day Invoice', 'create_credit_account'), ('CCOF', 'create_credit_account'), ('Driver Collect', 'create_credit_account'), ('Pre-Paid', 'create_prepaid_direct_debit_account')]
    """
    payment_method = payment_method.strip() if payment_method is not None else ""
    if not payment_method:
        return payment_method, create_no_account
    if payment_method == "30 Day Invoice":
        return payment_method, create_invoice_account
    elif payment_method in ["Pre-Paid", "30 Day Direct Debit"]:
        return payment_method, create_prepaid_direct_debit_account
    elif payment_method in ["Driver Collect", "7 Day Invoice", "CCOF"]:
        return payment_method, create_credit_account
    raise ValueError(f"Unexpected payment_method {payment_method}")


def parse_address_book_type(address_description: str) -> ClientAddressType:
    """Used to map description on AddressBookContacts to type in our system"""
    address_description = strip(address_description).lower()
    mapping = {
        "office": ClientAddressType.OFFICE,
        "work": ClientAddressType.OFFICE,
        "office address": ClientAddressType.OFFICE,
        "home": ClientAddressType.HOME,
        "house": ClientAddressType.HOME,
        "home address": ClientAddressType.HOME,
    }
    return mapping.get(address_description, ClientAddressType.OTHER)


def parse_frequent_address_type(address_description: str) -> ClientAddressType:
    """used to map 'location' on frequent pickup/destination tables in old system to the type in our system

    This field contains values like 'HOME' or 'GRAND HYATT' etc.
    """
    address_description = strip(address_description).lower()
    mapping = {
        "office": ClientAddressType.OFFICE,
        "home": ClientAddressType.HOME,
        "new home": ClientAddressType.HOME,
    }
    return mapping.get(address_description, ClientAddressType.OTHER)


def parse_legacy_client_name(legacy_client: Union[LegacyClient, LegacyContact]):
    first_name = strip(legacy_client.firstnames)
    last_name = strip(legacy_client.surname)
    if not last_name:
        parts = strip(legacy_client.name).split(" ")
        if len(parts) > 1:
            return " ".join(parts[:-1]), parts[-1]
        first_name = strip(legacy_client.name)
    return first_name, last_name


def migrate_client_address_book(legacy_client: LegacyClient, client_user: ClientUser):
    logger.info(f"CLIENT {legacy_client.pk}: Migrating address book")
    matched_address_type_count = defaultdict(int)
    with transaction.atomic():
        for client_ref in legacy_client.web_client_refs.all():
            address: AddressBookContacts
            for address in client_ref.address_book_contacts.all():
                address_type = parse_address_book_type(address.description)
                matched_address_type_count[address_type] += 1
                # Can only have 1 of each type of address apart from OTHER
                if (
                    address_type != ClientAddressType.OTHER
                    and client_user.clientaddress_set.filter(
                        address_type=address_type
                    ).exists()
                ):
                    address_type = ClientAddressType.OTHER
                name = (address.firstname + " " + address.lastname).strip()
                if not address.description:
                    address_label = name
                else:
                    address_label = name + " " + address.description
                formatted_address = strip(
                    " ".join(
                        map(
                            strip,
                            filter(
                                bool,
                                [address.address, address.suburb, address.postcode],
                            ),
                        )
                    )
                )
                new_address = create_address(
                    client=client_user,
                    formatted_address=formatted_address,
                    address_type=address_type,
                    address_label=address_label,
                    suburb=address.suburb,
                    postal_code=address.postcode,
                    legacy_table=ClientAddressLegacyTable.ADDRESS_BOOK,
                    legacy_recordid=address.pk,
                )
                if new_address:
                    logger.info(
                        f"CLIENT {legacy_client.pk}: Migrated address book address {address.pk} to ClientAddress {new_address.pk}"
                    )
    return matched_address_type_count


def migrate_client_contacts(
    legacy_client: LegacyClient, client_user: ClientUser, account: Account
):
    """
    Contacts in existing system are just contact details - no addresses

    They are used to prefill details on booking. Equivalent in the new system is
    a client linked to the same account
    """
    logger.info(f"CLIENT {legacy_client.pk}: Migrating contacts")
    if account is None:
        logger.info(
            f"CLIENT {legacy_client.pk}: No account exists for client - cannot import clients"
        )
        return
    legacy_contacts = legacy_client.contacts.all()
    with transaction.atomic():
        legacy_contact: LegacyContact
        for legacy_contact in legacy_contacts:
            email = get_client_email(
                legacy_client,
                legacy_contact.emailaddress,
                legacy_contact.contactno,
                True,
            )
            number = strip(
                choose_first(
                    [
                        legacy_contact.mobileno,
                        legacy_contact.busphone,
                        legacy_contact.homephone,
                    ]
                )
            )
            first_name, last_name = parse_legacy_client_name(legacy_contact)
            contact_client_user = ClientUser(
                title=strip(legacy_contact.title, ""),
                first_name=first_name,
                last_name=last_name,
                email=email,
                date_joined=client_user.date_joined,
                contact_phone=number,
                is_active=True,
                legacy_contactno=legacy_contact.contactno,
            )
            contact_client_user.save()
            AccountToClient.objects.create(
                client_user=contact_client_user, account=account, is_account_admin=False
            )
            logger.info(
                f"CLIENT {legacy_client.pk}: Migrated contact {legacy_contact.pk}; created client user {contact_client_user.pk}"
            )


def migrate_client_frequent_addresses(
    legacy_client: LegacyClient, client_user: ClientUser
):
    logger.info(
        f"CLIENT {legacy_client.pk}: Migrating frequent pickup and destination addresses"
    )
    """
    Frequent pickups and frequent destinations are stored separately. These are the equivalent
    of saved addresses in new system. These are only managed by the internal system at SC.
    Clients can manage their own addresses through the website but this going into the AddressBookContacts
    table instead which we import in migrate_client_address_book.
    """
    matched_address_type_count = defaultdict(int)
    freq_add: Union[LegacyFrequentdestinations, LegacyFrequentpickups]
    for freq_add in list(legacy_client.legacyfrequentdestinations_set.all()) + list(
        legacy_client.legacyfrequentpickups_set.all()
    ):
        is_pickup = isinstance(freq_add, LegacyFrequentpickups)
        log_label = "pickup" if is_pickup else "destination"
        address_type = parse_frequent_address_type(freq_add.location)
        matched_address_type_count[address_type] += 1
        # Can only have 1 of each type of address apart from OTHER
        if (
            address_type != ClientAddressType.OTHER
            and client_user.clientaddress_set.filter(address_type=address_type).exists()
        ):
            address_type = ClientAddressType.OTHER

        if is_pickup:
            address_label = " - ".join([strip(freq_add.name), strip(freq_add.location)])
            if not address_label:
                address_label = freq_add.address or "?"
        else:
            address_label = choose_first([freq_add.location, freq_add.address, "?"])

        formatted_address = strip(
            " ".join(
                map(
                    strip,
                    filter(bool, [freq_add.address, freq_add.suburb, freq_add.pcode]),
                )
            )
        )
        new_address = create_address(
            client=client_user,
            formatted_address=formatted_address,
            address_type=address_type,
            address_label=address_label,
            address_instructions=strip(freq_add.instructions),
            suburb=strip(freq_add.suburb),
            postal_code=freq_add.pcode,
            legacy_table=(
                ClientAddressLegacyTable.FREQUENT_PICKUP
                if is_pickup
                else ClientAddressLegacyTable.FREQUENT_DESTINATION
            ),
            legacy_recordid=freq_add.pk,
            legacy_seqno=freq_add.seqno,
        )
        if new_address:
            logger.info(
                f"CLIENT {legacy_client.pk}: Migrated frequent {log_label} address {freq_add.pk} to ClientAddress {new_address.pk}"
            )

        if is_pickup:
            if freq_add.name.lower() != legacy_client.name.lower():
                name = strip(freq_add.name)
                if not GuestTraveller.objects.filter(
                    client_user=client_user, name=name
                ).exists():
                    traveller = GuestTraveller.objects.create(
                        client_user=client_user,
                        name=name,
                        phone_number=strip(freq_add.phone),
                    )
                    logger.info(
                        f"CLIENT {legacy_client.pk}: For pickup address {freq_add.pk} created guest traveller {traveller.pk} ({traveller.name})"
                    )
                else:
                    logger.info(
                        f"CLIENT {legacy_client.pk}: Guest traveller already exists for name {name}; skipping"
                    )
    return matched_address_type_count


def get_client_email(legacy_client, email, clientno_or_contactno, is_contact=False):
    """Get client email for a client user - either from a legacy client (is_contact=False) or legacy contact (is_contact=True)"""
    email = strip(email).lower()
    # There's a bunch of nonsense emails eg n/a, NOEMAIL4PENSIONERS.COM.AU, NOEMAIL etc
    # Just remove them
    if "@" not in email:
        email = None
    # Don't let contacts use email that a real client in old system would have used
    if is_contact and LegacyClient.objects.filter(email=email).exists():
        email = None
    if not email:
        if is_contact:
            email = settings.LEGACY_CONTACT_EMAIL_ADDRESS_TEMPLATE.format(
                clientno_or_contactno
            )
        else:
            email = settings.LEGACY_CLIENT_EMAIL_ADDRESS_TEMPLATE.format(
                clientno_or_contactno
            )
    parts = email.split("@")
    i = 2
    while ClientUser.objects.filter(email=email).exists():
        prev_email = email
        email = f"{parts[0]}+{i}@{parts[1]}"
        if is_contact:
            logger.info(
                f"CLIENT {legacy_client.pk}: Contact email {prev_email} already in use, generating new one... {email}"
            )
        else:
            logger.info(
                f"CLIENT {legacy_client.pk}: Email {prev_email} already in use, generating new one... {email}"
            )
        i += 1
    return email


def migrate_client_and_account(legacy_client: LegacyClient):
    with transaction.atomic():
        category = (
            AccountCategoryType.PERSONAL
            if legacy_client.category == "P"
            else AccountCategoryType.BUSINESS
        )
        logger.info(
            f"CLIENT {legacy_client.pk}: Starting migration for client {legacy_client.clientno}"
        )
        first_name, last_name = parse_legacy_client_name(legacy_client)
        email = get_client_email(
            legacy_client, legacy_client.email, legacy_client.clientno
        )
        client_user = ClientUser(
            title=strip(legacy_client.title, ""),
            first_name=first_name,
            last_name=last_name,
            email=email,
            priority=parse_priority(legacy_client.priority),
            date_joined=legacy_client.datecreated or timezone.datetime(1990, 1, 1),
            contact_phone=strip(legacy_client.phone),
            is_active=True,
            legacy_clientno=legacy_client.clientno,
        )
        client_user.save()
        payment_method, create_account = get_account_creation_method(
            legacy_client.paymentmethod
        )
        account = create_account(payment_method, client_user, legacy_client, category)
        count_by_type1 = migrate_client_address_book(legacy_client, client_user)
        migrate_client_contacts(legacy_client, client_user, account)
        count_by_type2 = migrate_client_frequent_addresses(legacy_client, client_user)
        for key, value in count_by_type1.items():
            count_by_type2[key] += value
        # If user had multiple matches on HOME or OFFICE then just make them all OTHER
        for key, value in count_by_type2.items():
            if value > 1:
                ClientAddress.objects.filter(
                    client=client_user,
                    address_type=key,
                ).update(address_type=ClientAddressType.OTHER)
        return client_user, account
