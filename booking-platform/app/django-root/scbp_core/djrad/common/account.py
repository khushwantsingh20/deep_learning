from typing import Dict

from eway.data_types import TokenPaymentResponse
from eway.error import EwayError
from eway.serializers import eway_error_to_validation_error
from eway.serializers import EwayEncryptedCardSerializer
from scbp_core.models import Account


def create_or_update_token_payment(
    account: Account, customer_details: Dict, encrypted_card: Dict
) -> TokenPaymentResponse:
    """Create or update an eWay payment token for an account

     Looks at account.eway_token_customer_id to determine if creating or updating a token

     Updates account with created/update token details if successful. On failure raises
     ValidationError.

     No-op if encrypted_card is none type

    :param account: The account to create or update the token for.
    :param customer_details: title, first name and last name to use for customer in eway
    :param encrypted_card: Data as returned by EwayEncryptedCardSerializer
    """
    if encrypted_card:
        try:
            token = EwayEncryptedCardSerializer.create_or_update_token_payment(
                customer_details, encrypted_card, account.eway_token_customer_id
            )
            account.eway_token_customer_id = token.Customer.TokenCustomerID
            account.credit_card_type = encrypted_card["card_type_display_name"]
            account.credit_card_expiry_month = encrypted_card["expiry_month"]
            account.credit_card_expiry_year = encrypted_card["expiry_year"]
            account.credit_card_last4_digits = encrypted_card["last4"]
            account.save()
            return token
        except EwayError as e:
            raise eway_error_to_validation_error(e)
