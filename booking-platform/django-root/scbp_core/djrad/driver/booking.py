from datetime import timedelta
from operator import itemgetter

from django.core.signing import BadSignature
from djrad_rest.util import DjradEntityResponse
from rest_framework.fields import SerializerMethodField
from rest_framework.response import Response

from scbp_core.djrad.common.address import BaseAddressSerializer
from scbp_core.djrad.driver.base import ScbpDriverModelRegistration
from scbp_core.djrad.driver.base import ScbpDriverModelSerializer
from scbp_core.djrad.driver.base import ScbpDriverModelViewSet
from scbp_core.djrad.sites import driver_site
from scbp_core.fields import TravelOnDateField
from scbp_core.fields import TravelOnTimeField
from scbp_core.models import BookingStatus
from scbp_core.models import transaction
from scbp_core.models.booking import Booking
from scbp_core.models.booking import BookingAdditionalStop
from scbp_core.models.booking import BookingAddress
from scbp_core.models.booking import BookingOutOfPocket
from scbp_core.models.booking import BookingPriceVariation
from scbp_core.services.driver_url_token import parse_url_token


class BookingAddressSerializer(BaseAddressSerializer):
    class Meta:
        model = BookingAddress
        fields = BaseAddressSerializer.BASE_FIELDS + (
            "address_instructions",
            "address_label",
        )


class BookingAdditionalStopSerializer(ScbpDriverModelSerializer):
    address = BookingAddressSerializer()

    class Meta:
        model = BookingAdditionalStop
        fields = ("address", "stop_number", "is_pick_up")
        extra_kwargs = {"is_pick_up": {"default": False}}

    @transaction.atomic
    def create(self, validated_data):
        address = validated_data.pop("address")
        address = BookingAddressSerializer(data=address)
        address.is_valid()
        address = address.save()
        validated_data["address"] = address
        return super().create(validated_data)


class PriceVariationSerializer(ScbpDriverModelSerializer):
    class Meta:
        model = BookingPriceVariation
        fields = ["variation_type", "amount"]


class OutOfPocketSerializer(ScbpDriverModelSerializer):
    class Meta:
        model = BookingOutOfPocket
        fields = ["description", "amount"]


class BookingSerializer(ScbpDriverModelSerializer):
    display_status = SerializerMethodField()
    driver = SerializerMethodField()
    vehicle_class = SerializerMethodField()
    equipment = SerializerMethodField()
    client_name = SerializerMethodField()
    passenger = SerializerMethodField()
    passenger_phone = SerializerMethodField()
    payment_method = SerializerMethodField()
    booking_value = SerializerMethodField()
    hourly_booking_duration = SerializerMethodField()

    from_address = BookingAddressSerializer(required=False, allow_null=True)
    destination_address = BookingAddressSerializer(required=False, allow_null=True)
    booking_additional_stops = BookingAdditionalStopSerializer(
        many=True, required=False
    )

    buttons = SerializerMethodField()

    travel_on_date = TravelOnDateField()
    travel_on_time = TravelOnTimeField()

    # passenger_fullname = SerializerMethodField()

    def __init__(self, *args, price_estimate_only=False, **kwargs):
        """Create serializer and specify what step we are up to for validation"""
        self._price_estimate_only = price_estimate_only
        super().__init__(*args, **kwargs)

    class Meta:
        model = Booking
        fields = (
            "booking_number",
            "booking_type",
            "display_status",
            "driver",
            "travel_on_date",
            "travel_on_time",
            "vehicle_class",
            "passenger",
            "passenger_phone",
            "passenger_count",
            "baggage_count",
            "equipment",
            "client_name",
            "from_address",
            "from_address_type",
            "from_flight_number",
            "from_airport_driver_required_on_landing",
            "from_airport_arrival_after_landing",
            "from_airport_notes_for_driver",
            "pickup_time",
            "dropoff_time",
            "booking_additional_stops",
            "destination_address_type",
            "destination_address",
            "destination_airport_terminal",
            "destination_flight_departure_time",
            "hourly_booking_duration",
            "signboard_text",
            "booking_payment_method",
            "payment_method",
            "booking_value",
            "driver_notes",
            "booking_status",
            "buttons",
        )
        extra_kwargs = {f: {"required": False} for f in fields}

    def get_hourly_booking_duration(self, instance):
        if instance.hourly_booking_duration:
            hours, sub_hour = divmod(
                instance.hourly_booking_duration, timedelta(hours=1)
            )
            minutes = sub_hour // timedelta(minutes=1)
            return f"{hours}:{minutes}"
        return ""

    def get_display_status(self, instance):
        if instance.booking_status in [
            BookingStatus.CLEARED,
            BookingStatus.CONFIRMED,
            BookingStatus.KNOCKED_BACK,
            BookingStatus.PICKED_UP,
        ]:
            return BookingStatus.choices[instance.booking_status]
        if instance.booking_status == BookingStatus.VARIATION:
            return "Cleared With Variations"
        if instance.booking_status in [BookingStatus.CHANGED]:
            return "Cancelled"
        return "Allocated To You"

    def get_driver(self, instance):
        return f"{instance.driver.driver_no} - {instance.driver.get_full_name()}"

    def get_vehicle_class(self, instance):
        return instance.vehicle_class.abbreviation

    def get_equipment(self, instance):
        options = []
        if instance.vehicle_color:
            options.append(instance.vehicle_color.color_abbreviation)
        if instance.booster_seat_count > 0:
            options.append(f"BOOSTERx{instance.booster_seat_count}")
        if instance.forward_facing_baby_seat_count > 0:
            options.append(f"FORWARDx{instance.forward_facing_baby_seat_count}")
        if instance.rear_facing_baby_seat_count > 0:
            options.append(f"REARx{instance.rear_facing_baby_seat_count}")
        if instance.requires_wedding_ribbons:
            options.append("RIBBON")
        if instance.requires_car_park_pass:
            options.append("BHP")
        return ", ".join(options)

    def get_client_name(self, instance):
        return instance.client_user.get_full_name()

    def get_passenger(self, instance):
        if not instance.passenger:
            return instance.passenger_name
        return instance.passenger.get_full_name()

    def get_passenger_phone(self, instance):
        if not instance.passenger:
            return instance.passenger_phone
        return instance.passenger.contact_phone

    def get_payment_method(self, instance):
        return instance.get_driver_payment_type()

    def get_booking_value(self, instance):
        return instance.price_total

    def get_buttons(self, instance):
        """
        Returns info to allow the frontend to render the driver action buttons for this booking
        :return: A list of (label, new_value, require_verification) tuples (label is the button label, new_value
            is the status resulting from clicking the button, require_verification is whether the user should be
            required to verify the status change before it goes through)
        """
        if instance.booking_status == BookingStatus.CONFIRMED:
            return [("Picked Up", BookingStatus.PICKED_UP, False)]
        elif instance.booking_status == BookingStatus.PICKED_UP:
            return [
                ("Cleared", BookingStatus.CLEARED, False),
                ("Cleared with Variations", BookingStatus.VARIATION, False),
            ]
        elif instance.booking_status not in [
            BookingStatus.CHANGED,
            BookingStatus.CLEARED,
            BookingStatus.COMPLETED,
            BookingStatus.KNOCKED_BACK,
            BookingStatus.VARIATION,
        ]:
            return [
                ("Confirm", BookingStatus.CONFIRMED, False),
                ("Knockback", BookingStatus.KNOCKED_BACK, True),
            ]
        return []


class BookingViewSet(ScbpDriverModelViewSet):
    serializer_class = BookingSerializer
    queryset = Booking.objects.all().order_by("-travel_on")
    permission_classes = []

    def list(self, request, *args, **kwargs):
        token = request.query_params.get("token", None)
        try:
            booking, driver = itemgetter("booking", "driver")(parse_url_token(token))
        except BadSignature:
            return DjradEntityResponse(status=400)
        except ValueError:
            # Booking not assigned to this driver
            booking_number = int(token.split(":")[0])
            return Response(
                [
                    {
                        "booking_number": booking_number,
                        "display_status": "Assigned to someone else",
                        "id": 0,
                    }
                ]
            )

        queryset = self.get_queryset().filter(pk=booking.pk)
        serializer = self.get_serializer(queryset, many=True)
        return DjradEntityResponse(serializer)

    def update(self, request, *args, **kwargs):
        # We want to raise an exception if token is not passed in - hence no exception handling here
        token = request.data.pop("token")
        booking, _ = itemgetter("booking", "driver")(parse_url_token(token))
        instance = self.get_object()
        # Verify the token is for the requested booking and raise an exception otherwise
        assert instance == booking
        # Save the changes
        serializer = self.get_serializer(instance, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        # Return the changed record
        return Response(serializer.data)


class BookingRegistration(ScbpDriverModelRegistration):
    viewset_class = BookingViewSet


driver_site.register(Booking, BookingRegistration)
