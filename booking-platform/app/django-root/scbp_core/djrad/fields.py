from djrad_rest.registration.fields import AnyTypeFieldDescriptor
from djrad_rest.registration.fields import CharFieldDescriptor
from djrad_rest.registration.fields import FloatFieldDescriptor
from djrad_rest.registration.fields import IntegerFieldDescriptor
from djrad_rest.registration.fields import RecordFieldDescriptor
from djrad_rest.registration.fields import TextFieldDescriptor


class HtmlFieldDescriptor(TextFieldDescriptor):
    pass


class AddressFieldDescriptor(RecordFieldDescriptor):
    def __init__(self, label, *args, **kwargs):
        fields = [
            CharFieldDescriptor("formatted_address", required=True),
            CharFieldDescriptor("suburb"),
            CharFieldDescriptor("postal_code", required=True),
            CharFieldDescriptor("country_code"),
            CharFieldDescriptor("source_id"),
            CharFieldDescriptor("map_url"),
            FloatFieldDescriptor("lat", required=True),
            FloatFieldDescriptor("long", required=True),
            AnyTypeFieldDescriptor("address_details"),
            CharFieldDescriptor("address_instructions"),
            CharFieldDescriptor("address_label"),
            CharFieldDescriptor("place_name"),
        ]

        super().__init__(label, fields, *args, **kwargs)


class CreditCardFieldDescriptor(RecordFieldDescriptor):
    def __init__(self, label, *args, **kwargs):
        fields = [
            CharFieldDescriptor("last4"),
            CharFieldDescriptor("cardType"),
            IntegerFieldDescriptor("expMonth"),
            IntegerFieldDescriptor("expYear"),
        ]

        super().__init__(label, fields, *args, **kwargs)
