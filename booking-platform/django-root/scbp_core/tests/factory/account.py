import factory
from factory.fuzzy import FuzzyChoice

from scbp_core.models import Account
from scbp_core.models import AccountCategoryType
from scbp_core.models import AccountDriverCollectMethod
from scbp_core.models import AccountInvoicingMethodType
from scbp_core.models import AccountPaymentMethodType
from scbp_core.models import AccountPaymentTermsType
from scbp_core.models import AccountToClient
from scbp_core.tests.factory.util import SCBPFactory

factory.Faker._DEFAULT_LOCALE = "en_AU"


class AccountFactory(SCBPFactory):
    account_no = None
    payment_terms = AccountPaymentTermsType.COD
    category = FuzzyChoice([c[0] for c in AccountCategoryType.choices.items()])
    payment_method = FuzzyChoice(
        [c[0] for c in AccountPaymentMethodType.choices.items()]
    )
    invoicing_method = FuzzyChoice(
        [c[0] for c in AccountInvoicingMethodType.choices.items()]
    )
    legacy_accountno = ""
    contact_title = FuzzyChoice(["Mr", "Mrs", "Ms", "Miss"])
    contact_first_name = factory.Faker("first_name")
    contact_last_name = factory.Faker("last_name")
    contact_phone_mobile = factory.Faker("phone_number")

    @factory.lazy_attribute
    def driver_collect_method(self):
        if self.payment_method == AccountPaymentMethodType.DRIVER_COLLECT:
            return FuzzyChoice(
                (
                    AccountDriverCollectMethod.CABCHARGE,
                    AccountDriverCollectMethod.CAB_CARD,
                    AccountDriverCollectMethod.CAB_CASH,
                )
            ).fuzz()
        return AccountDriverCollectMethod.NONE

    class Meta:
        model = Account
        default_auto_fields = True


class AccountToClientFactory(SCBPFactory):
    class Meta:
        model = AccountToClient


class AccountWithClientUserFactory(AccountFactory):
    clients = factory.RelatedFactory(AccountToClientFactory, "account")
