from dataclasses import dataclass
from typing import Dict
from typing import Union

from rest_framework import serializers
from rest_framework.exceptions import ValidationError
from rest_framework.settings import api_settings

import eway
from eway.data_types import TokenCard
from eway.data_types import TokenCustomer
from eway.data_types import TokenPaymentResponse
from eway.error import EwayApiError
from eway.error import EwayError
from eway.response_codes import validation_errors as eway_validation_errors


@dataclass
class CustomerDetails:
    first_name: str
    last_name: str
    email: str
    title: str = ""


class EwayEncryptedCardSerializer(serializers.Serializer):
    """Serializer to collect data from frontend for credit card. Pair with EncryptedCreditCardFields component.

    Example:

        from typing import Dict
        from eway.error import EwayError
        from eway.serializers import EwayEncryptedCardSerializer
        from eway.serializers import eway_error_to_validation_error
        from eway.token_payment import TokenPaymentResponse
        # Fictional model that contains a `eway_token_customer_id` field.
        from my_app.models import Account


        def create_or_update_token_payment(
            account: Account, customer_details: Dict, encrypted_card: Dict
        ) -> TokenPaymentResponse:
            try:
                token = EwayEncryptedCardSerializer.create_or_update_token_payment(
                    customer_details, encrypted_card, account.eway_token_customer_id
                )
                account.eway_token_customer_id = token.Customer.TokenCustomerID
                account.save()
                return token
            except EwayError as e:
                raise eway_error_to_validation_error(e)


        class AccountSerializer(MyAppModelSerializer):
            encrypted_card = EwayEncryptedCardSerializer(required=False)

            class Meta:
                model = Account
                fields = (
                    "account_no",
                    "encrypted_card",
                )

            def validate(self, attrs):
                encrypted_card = attrs.get("encrypted_card", None)
                if not encrypted_card and (
                    not self.instance or not self.instance.eway_token_customer_id
                ):
                    raise ValidationError("You need to link a credit card to this account.")
                return super().validate(attrs)

            def create(self, validated_data):
                encrypted_card = validated_data.pop("encrypted_card")
                with transaction.atomic():
                    instance: Account = super().create(validated_data)
                    user = self.context["request"].user
                    create_or_update_token_payment(
                        instance,
                        dict(
                            first_name=user.first_name,
                            last_name=user.last_name,
                        ),
                        encrypted_card,
                    )
                return instance

            def update(self, instance, validated_data):
                encrypted_card = validated_data.pop("encrypted_card", None)
                with transaction.atomic():
                    instance: Account = super().update(instance, validated_data)
                    if encrypted_card:
                        user = self.context["request"].user
                        create_or_update_token_payment(
                            instance,
                            dict(
                                first_name=user.first_name,
                                last_name=user.last_name,
                            ),
                            encrypted_card,
                        )
                return instance
    """

    card_number = serializers.CharField(write_only=True)
    last4 = serializers.CharField(write_only=True)
    cvn = serializers.CharField(write_only=True)
    expiry_month = serializers.CharField(write_only=True)
    expiry_year = serializers.CharField(write_only=True)
    name = serializers.CharField(write_only=True)
    card_type = serializers.CharField(write_only=True)
    card_type_display_name = serializers.CharField(write_only=True)

    @staticmethod
    def create_or_update_token_payment(
        customer_details: Union[CustomerDetails, Dict],
        encrypted_card: Dict,
        existing_token: int = None,
    ) -> TokenPaymentResponse:
        """Create or update an eWay payment token for an account

         If existing_token is none creates a new token otherwise updates token specified

        :param customer_details: title, first name and last name to use for customer in eway
        :param encrypted_card: Data as returned by EwayEncryptedCardSerializer
        :param existing_token: Token from previous call to TokenPayment.create
        """
        if type(customer_details) is dict:
            customer_details = CustomerDetails(**customer_details)
        if existing_token:
            token = eway.TokenPayment.update(
                TokenCustomer(
                    TokenCustomerID=existing_token,
                    Title=customer_details.title,
                    FirstName=customer_details.first_name,
                    LastName=customer_details.last_name,
                    Email=customer_details.email,
                    Country="AU",
                    CardDetails=TokenCard(
                        Number=encrypted_card["card_number"],
                        ExpiryMonth=encrypted_card["expiry_month"],
                        ExpiryYear=encrypted_card["expiry_year"],
                        Name=encrypted_card["name"],
                        CVN=encrypted_card["cvn"],
                    ),
                )
            )
        else:
            token = eway.TokenPayment.create(
                TokenCustomer(
                    Title=customer_details.title,
                    FirstName=customer_details.first_name,
                    LastName=customer_details.last_name,
                    Email=customer_details.email,
                    Country="AU",
                    CardDetails=TokenCard(
                        Number=encrypted_card["card_number"],
                        ExpiryMonth=encrypted_card["expiry_month"],
                        ExpiryYear=encrypted_card["expiry_year"],
                        Name=encrypted_card["name"],
                        CVN=encrypted_card["cvn"],
                    ),
                )
            )
        return token


def eway_error_to_validation_error(eway_error: EwayError):
    """Convert an EwayError to a rest framework ValidationError"""
    if isinstance(eway_error, EwayApiError):
        messages = []
        # For validation errors we can safely expose the message otherwise
        # show generic failure message
        for code in eway_error.error_codes:
            if code.startswith("V"):
                message = eway_validation_errors.get(code, "")
                if message:
                    messages.append(message)
        message = "There was a problem processing your card. Please check card details and try again."
        if messages:
            message = ", ".join(messages)
        return ValidationError({api_settings.NON_FIELD_ERRORS_KEY: message})
    return ValidationError(
        {
            api_settings.NON_FIELD_ERRORS_KEY: "There was an unexpected issue. Please try again."
        }
    )
