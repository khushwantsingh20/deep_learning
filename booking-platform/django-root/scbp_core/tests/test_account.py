from django.test import TestCase
from rest_framework.exceptions import ValidationError

from scbp_core.djrad.admin import AccountSerializer
from scbp_core.models import AccountPaymentMethodType
from scbp_core.models import AccountToClient
from scbp_core.tests.factory.account import AccountFactory
from scbp_core.tests.factory.user import ClientUserFactory


class AccountTestCase(TestCase):
    def test_account_number_auto_increment(self):
        account1 = AccountFactory()
        account2 = AccountFactory()
        self.assertEqual(account1.account_no + 1, account2.account_no)

    def test_account_serializer_does_not_requires_cc_token_on_new_non_cc_payment_account(
        self,
    ):
        data = {
            "rate_schedule": 1,
            "payment_terms": 1,
            "payment_method": AccountPaymentMethodType.INVOICE,
            "account_nickname": "1",
            "account_email": "2",
            "contact_first_name": "3",
            "contact_last_name": "4",
            "billing_address": "5",
            "category": 1,
            "invoicing_method": 2,
        }
        serializer = AccountSerializer(data=data)
        serializer.validate(data)

    def test_account_serializer_requires_cc_token_on_new_cc_payment_account(self):
        data = {
            "rate_schedule": 1,
            "payment_terms": 1,
            "payment_method": AccountPaymentMethodType.CREDIT_CARD,
            "account_nickname": "1",
            "account_email": "2",
            "contact_first_name": "3",
            "contact_last_name": "4",
            "billing_address": "5",
            "category": 1,
            "invoicing_method": 2,
        }
        serializer = AccountSerializer(data=data)
        self.assertRaises(ValidationError, serializer.validate, attrs=data)

        data["encrypted_card"] = {"number": "abc123"}
        serializer = AccountSerializer(data=data)
        serializer.validate(data)

    def test_account_serializer_requires_cc_token_on_existing_account_changing_payment_to_cc(
        self,
    ):
        account = AccountFactory(payment_method=AccountPaymentMethodType.INVOICE)

        data = {"payment_method": AccountPaymentMethodType.CREDIT_CARD}
        serializer = AccountSerializer(account, data=data)
        self.assertRaises(ValidationError, serializer.validate, attrs=data)

    def test_account_serializer_does_not_require_cc_token_on_existing_account_changing_payment_to_non_cc(
        self,
    ):
        account = AccountFactory(payment_method=AccountPaymentMethodType.INVOICE)

        data = {"payment_method": AccountPaymentMethodType.INVOICE}
        serializer = AccountSerializer(account, data=data)
        serializer.validate(data)

    def test_account_serializer_does_not_require_cc_token_on_existing_cc_account_partial_update(
        self,
    ):
        account = AccountFactory(
            payment_method=AccountPaymentMethodType.CREDIT_CARD,
            eway_token_customer_id="token",
            contact_first_name="",
            contact_last_name="",
        )

        data = {"invoicing_method": 3}
        serializer = AccountSerializer(account, data=data)
        # eway requires first and last name to be passed through so we need to collect it when
        # payment method is CC
        with self.assertRaises(ValidationError) as cm:
            serializer.validate(data)
        self.assertRegex(
            cm.exception.detail["contact_first_name"], "first name is required"
        )
        self.assertRegex(
            cm.exception.detail["contact_last_name"], "last name is required"
        )

        data = {
            "invoicing_method": 3,
            "contact_first_name": "test",
            "contact_last_name": "test",
        }
        serializer.validate(data)

    def test_account_archive_updates_links(self):
        account = AccountFactory()
        client_user = ClientUserFactory()
        atoc = AccountToClient.objects.create(
            is_default_account=True,
            account=account,
            client_user=client_user,
        )

        account.archive(client_user)
        atoc.refresh_from_db()
        self.assertIsNone(atoc.is_default_account)

    def test_client_archive_updates_links(self):
        account = AccountFactory()
        client_user = ClientUserFactory()
        atoc = AccountToClient.objects.create(
            is_default_account=True,
            account=account,
            client_user=client_user,
        )

        atoc.save()
        self.assertTrue(atoc.is_default_account)

        client_user.archive(client_user)
        atoc.refresh_from_db()
        self.assertIsNone(atoc.is_default_account)
