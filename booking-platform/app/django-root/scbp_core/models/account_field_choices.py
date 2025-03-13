from collections import OrderedDict


class RateScheduleType:
    STANDARD = 1
    RETAIL = 2
    CORPORATE = 3
    INSTITUTION = 4

    choices = OrderedDict(
        (
            (STANDARD, "Standard"),
            (RETAIL, "Retail"),
            (CORPORATE, "Corporate"),
            (INSTITUTION, "Institution"),
        )
    )

    pricing_map = {
        STANDARD: "rate_schedule_standard",
        RETAIL: "rate_schedule_retail",
        CORPORATE: "rate_schedule_corporate",
        INSTITUTION: "rate_schedule_institution",
    }


class AccountCategoryType:
    PERSONAL = 1
    BUSINESS = 2

    choices = OrderedDict(((PERSONAL, "Personal"), (BUSINESS, "Business")))


class AccountPaymentTermsType:
    COD = 1
    THIRTY_DAYS = 3

    choices = OrderedDict(((COD, "COD"), (THIRTY_DAYS, "30 Days")))


class AccountPaymentMethodType:
    INVOICE = 1
    CREDIT_CARD = 2
    DRIVER_COLLECT = 3

    choices = OrderedDict(
        (
            (INVOICE, "Invoice"),
            (CREDIT_CARD, "Credit Card"),
            (DRIVER_COLLECT, "Driver Collect"),
        )
    )


class AccountDriverCollectMethod:
    NONE = 0
    CABCHARGE = 1
    CAB_CARD = 2
    CAB_CASH = 3

    choices = OrderedDict(
        (
            (NONE, "-"),
            (CAB_CARD, "Credit Card"),
            (CABCHARGE, "Cab Charge"),
            (CAB_CASH, "Cash"),
        )
    )


class AccountInvoicingMethodType:
    EMAIL = 1
    SMS = 2
    MAIL = 3

    choices = OrderedDict(((EMAIL, "Email"), (SMS, "SMS"), (MAIL, "Mail")))
