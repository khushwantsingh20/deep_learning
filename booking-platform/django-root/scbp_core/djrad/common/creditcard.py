from rest_framework import serializers

from scbp_core.models import Account


class CreditCardSerializer(serializers.Field):
    """See CreditCardFieldDescriptor for how this comes through to the frontend"""

    class Meta:
        # If new fields are added update CreditCardFieldDescriptor
        fields = ("last4", "expMonth", "expYear", "cardType")

    def __init__(self, method_name=None, **kwargs):
        self.method_name = method_name
        kwargs["source"] = "*"
        kwargs["read_only"] = True
        super().__init__(**kwargs)

    def to_representation(self, instance: Account):
        return {
            "last_4": instance.credit_card_last4_digits,
            "expMonth": (
                int(instance.credit_card_expiry_month)
                if instance.credit_card_expiry_month
                else None
            ),
            "expYear": (
                int(instance.credit_card_expiry_year)
                if instance.credit_card_expiry_year
                else None
            ),
            "cardType": instance.credit_card_type,
        }
