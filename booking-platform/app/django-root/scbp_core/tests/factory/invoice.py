import factory
from factory.fuzzy import FuzzyChoice
from factory.fuzzy import FuzzyDate

from scbp_core.models import AccountPaymentMethodType
from scbp_core.models import AccountStatement
from scbp_core.models import Invoice
from scbp_core.models import Payment
from scbp_core.models import PaymentStatus
from scbp_core.models import Refund
from scbp_core.tests.factory.account import AccountFactory
from scbp_core.tests.factory.booking import BookingFactory
from scbp_core.tests.factory.util import FuzzyDateRange
from scbp_core.tests.factory.util import FuzzyPositiveInteger
from scbp_core.tests.factory.util import SCBPFactory

factory.Faker._DEFAULT_LOCALE = "en_AU"


class AccountStatementFactory(SCBPFactory):
    class Meta:
        model = AccountStatement

    issued_on = FuzzyDate()
    payment_method = FuzzyChoice(
        [c[0] for c in AccountPaymentMethodType.choices.items()]
    )
    period = FuzzyDateRange()
    account = factory.SubFactory(AccountFactory)


class InvoiceFactory(SCBPFactory):
    class Meta:
        model = Invoice

    issued_on = FuzzyDate()
    booking = factory.SubFactory(BookingFactory)
    booking_price_total = factory.SelfAttribute("booking.price_total")
    invoice_total_amount = factory.SelfAttribute("booking.price_total")
    payment_method = FuzzyChoice(
        [c[0] for c in AccountPaymentMethodType.choices.items()]
    )


class PaymentFactory(SCBPFactory):
    class Meta:
        model = Payment

    account = factory.SubFactory(AccountFactory)
    payment_method = AccountPaymentMethodType.CREDIT_CARD
    status = PaymentStatus.SUCCESS
    transaction_id = FuzzyPositiveInteger()


class RefundFactory(SCBPFactory):
    class Meta:
        model = Refund

    payment_method = AccountPaymentMethodType.CREDIT_CARD
