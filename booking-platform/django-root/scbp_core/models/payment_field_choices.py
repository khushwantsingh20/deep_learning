from collections import OrderedDict


class PaymentStatus:
    SUCCESS = 1
    FAILURE = 2
    PENDING = 3

    choices = OrderedDict(
        ((SUCCESS, "Success"), (FAILURE, "Failure"), (PENDING, "Pending"))
    )
