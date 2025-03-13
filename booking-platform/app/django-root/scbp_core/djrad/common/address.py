from django.db import transaction
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response

from scbp_core.djrad.base import ScbpModelSerializer
from scbp_core.models import ClientAddress


class BaseAddressSerializer(ScbpModelSerializer):
    """Base serializer for addresses. Maps to frontend field AddressField.

    NOTE: If you add new fields here also need to update AddressFieldDescriptor
    """

    BASE_FIELDS = (
        "formatted_address",
        "lat",
        "long",
        "suburb",
        "postal_code",
        "country_code",
        "source_id",
        "map_url",
        "address_details",
        "place_name",
    )


class SetAddressSourceViewSetMixin:
    """Add viewset action to set address source id

    Source ID is currently the Google maps place ID. For imported data from legacy
    system no client addresses have place ids as they were never captured. We
    fill this out as we encounter them on the frontend.
    """

    @action(["post"], detail=True, url_path="set-address-source-id")
    def set_address_source_id(self, request, pk):
        source_id = request.data.get("source_id")
        if not source_id:
            raise ValidationError({"source_id": "source_id must be specified"})
        address = self.get_object()
        address.source_id = source_id
        with transaction.atomic():
            address.save()
            # Update any other addresses that happen to have the same address
            ClientAddress.objects.filter(
                source_id="", formatted_address=address.formatted_address
            ).update(source_id=address.source_id)

        return Response(self.get_serializer(address).data)
