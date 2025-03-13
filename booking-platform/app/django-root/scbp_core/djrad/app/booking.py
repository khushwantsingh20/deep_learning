from datetime import datetime
from typing import Union

from allianceutils.models import raise_validation_errors
from django.core.exceptions import ValidationError as CoreValidationError
from django.db import transaction
from django.db.models import Q
from django.db.models import Value
from django.db.models.functions import Concat
from django.utils import timezone
from django.utils.timezone import localtime
from django.utils.timezone import make_aware
from django_filters import DateFromToRangeFilter
from djrad_rest import mixins
from djrad_rest.filters import RefineModelChoiceFilter
from djrad_rest.util import DjradEntityResponse
from djrad_rest.viewsets import DjradGenericViewSet
from rest_framework import serializers
from rest_framework import status
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from rest_framework.fields import empty
from rest_framework.fields import get_error_detail
from rest_framework.fields import SerializerMethodField
from rest_framework.response import Response
from rest_framework.serializers import SerializerMetaclass
from rest_framework.settings import api_settings

from scbp_core.djrad.app.base import ScbpAppFilterSet
from scbp_core.djrad.app.base import ScbpAppModelRegistration
from scbp_core.djrad.app.base import ScbpAppModelSerializer
from scbp_core.djrad.app.base import ScbpAppViewSetPermissions
from scbp_core.djrad.base import ScbpModelBaseViewSet
from scbp_core.djrad.common.address import BaseAddressSerializer
from scbp_core.djrad.common.booking import create_log
from scbp_core.djrad.common.booking import get_booking_values
from scbp_core.djrad.sites import app_site
from scbp_core.fields import TravelOnDateField
from scbp_core.fields import TravelOnTimeField
from scbp_core.models import Account
from scbp_core.models import Booking
from scbp_core.models import BookingAdditionalStop
from scbp_core.models import BookingAddress
from scbp_core.models import BookingLog
from scbp_core.models import BookingStatus
from scbp_core.models import BookingType
from scbp_core.models import ClientUser
from scbp_core.models import PriceList
from scbp_core.models import VehicleClass
from scbp_core.models import VehicleColor
from scbp_core.models.booking_field_choices import (
    UPDATE_BOOKING_TOO_CLOSE_ERROR_MESSAGE,
)
from scbp_core.services.campaign_monitor import create_or_update_subscription
from scbp_core.services.generate_client_bookings_csv import generate_client_bookings_csv
from scbp_core.services.pricing import PriceCalculator
from scbp_core.services.pricing_breakdown import get_client_facing_breakdown
from scbp_core.tasks.send_notifications import send_message_to_user


class CreateBookingAddressSerializer(BaseAddressSerializer):
    class Meta:
        model = BookingAddress
        fields = BaseAddressSerializer.BASE_FIELDS + (
            "address_instructions",
            "address_label",
        )

        extra_kwargs = {
            "lat": {"required": True},
            "long": {"required": True},
            "source_id": {"required": True},
        }


class CreateBookingAdditionalStopSerializer(ScbpAppModelSerializer):
    address = CreateBookingAddressSerializer()
    is_pick_up = serializers.BooleanField(required=False, default=False)

    class Meta:
        model = BookingAdditionalStop
        fields = ("address", "is_pick_up", "address_type")

    def save(self, **kwargs):
        if "booking" not in kwargs or "stop_number" not in kwargs:
            raise ValueError(
                "You must pass 'booking' and 'stop_number' as kwargs to save"
            )

        return super().save(**kwargs)

    @transaction.atomic
    def create(self, validated_data):
        address_data = validated_data.pop("address")

        address = BookingAddress(**address_data)
        address.save()

        return super().create({**validated_data, "address": address})

    def update(self, instance, validated_data):
        # Even for updating existing bookings we just recreate the additional stop records
        # so we don't need to worry about update
        raise NotImplementedError("update not implemented; only intended for creation")


# Define what fields are required for each step. Each step is additive to the
# previous step
_fields_by_step = {
    1: {
        "booking_type",
        "travel_on_date",
        "travel_on_time",
        "passenger_count",
        "baggage_count",
        "from_address",
        "from_address_type",
        "from_flight_number",
        "from_airport_driver_required_on_landing",
        "from_airport_arrival_after_landing",
        "from_airport_notes_for_driver",
        "destination_address",
        "destination_address_type",
        "destination_flight_number",
        "destination_airport_terminal",
        "destination_flight_departure_time",
        "hourly_booking_duration",
        "passenger",
        "passenger_name",
        "passenger_phone",
    },
    2: {"vehicle_class_id"},
    3: {
        "vehicle_color_id",
        "booster_seat_count",
        "forward_facing_baby_seat_count",
        "rear_facing_baby_seat_count",
        "requires_wedding_ribbons",
        "additional_stops",
    },
    4: {
        "driver_notes",
        "office_notes",
        "signboard_text",
        "purchase_order_number",
        "account",
        "booking_payment_method",
        "driver_collect_method",
        "non_field_errors",  # Show non-field errors such as too close to travel time errors
    },
}

# these fields are only validated if you are logged in
_fields_require_user = {"passenger", "passenger_name", "passenger_phone"}

last_step_number = list(_fields_by_step.keys())[-1]

_booking_fields = (
    "passenger",
    "passenger_name",
    "passenger_phone",
    "passenger_fullname",
    "booking_type",
    "travel_on_date",
    "travel_on_time",
    "passenger_count",
    "baggage_count",
    "vehicle_class_id",
    "vehicle_color_id",
    "booster_seat_count",
    "forward_facing_baby_seat_count",
    "rear_facing_baby_seat_count",
    "requires_wedding_ribbons",
    "from_address",
    "from_address_type",
    "from_flight_number",
    "from_airport_driver_required_on_landing",
    "from_airport_arrival_after_landing",
    "from_airport_notes_for_driver",
    "destination_address",
    "destination_address_type",
    "destination_airport_terminal",
    "destination_flight_departure_time",
    "hourly_booking_duration",
    "additional_stops",
    "driver_notes",
    "office_notes",
    "purchase_order_number",
    "signboard_text",
    "account",
    "booking_method",
    "booking_payment_method",
    "driver_collect_method",
    "booking_number",
    "is_interstate",
)


def _get_fields_for_step(step_number, user):
    fields = set()
    is_logged_in = user and not user.is_anonymous
    for step in range(1, step_number + 1):
        step_fields = _fields_by_step.get(step, set())
        if not is_logged_in:
            step_fields = step_fields - _fields_require_user
        fields.update(step_fields)
    return fields


# Some fields are named differently on the serializer vs model - this specifies
# the mapping between them. eg. "vehicle_class_id": "vehicle_class" means we will
# set the 'vehicle_class' on the Booking instance to the value of 'vehicle_class_id'
# from the serializer.
_serializer_to_model_field_map = {
    "vehicle_class_id": "vehicle_class",
    "vehicle_color_id": "vehicle_color",
}

# Map some fields to show errors against another field
_error_field_map = {
    **dict(
        zip(
            _serializer_to_model_field_map.values(),
            _serializer_to_model_field_map.keys(),
        ),
    ),
    "travel_on": "travel_on_date",
}


class CreateBookingSerializerMetaclass(SerializerMetaclass):
    """Checks that all fields are optional

    We apply validation based on current step so some fields are required on some
    steps but not other. More importantly we want to apply full_clean() and let
    our model to the validation for most things; if fields are optional our validate()
    function is never called.

    Things will still work without this but it's less than ideal on frontend (you
    get only some of the relevant validation errors rather than all).
    """

    def __new__(cls, *args, **kwargs):
        c = super().__new__(cls, *args, **kwargs)
        optional_fields = []
        for name, f in c().get_fields().items():
            if f.required:
                optional_fields.append(name)
        if optional_fields:
            optional_fields = ", ".join(optional_fields)
            raise ValueError(
                f'{c.__name__} must have all fields as optional due to how we apply validation. Check the field definition for the following fields and make sure "required=False" is passed: {optional_fields}'
            )
        return c


class CreateUpdateBookingSerializer(
    ScbpAppModelSerializer, metaclass=CreateBookingSerializerMetaclass
):
    vehicle_class_id = serializers.PrimaryKeyRelatedField(
        queryset=VehicleClass.objects.all(), required=False
    )
    vehicle_color_id = serializers.PrimaryKeyRelatedField(
        queryset=VehicleColor.objects.all(), required=False, allow_null=True
    )
    from_address = CreateBookingAddressSerializer(required=False, allow_null=True)
    destination_address = CreateBookingAddressSerializer(
        required=False, allow_null=True
    )
    additional_stops = CreateBookingAdditionalStopSerializer(
        many=True, required=False, source="booking_additional_stops"
    )
    passenger_fullname = SerializerMethodField()
    is_interstate = SerializerMethodField()
    travel_on_date = TravelOnDateField(required=False)
    travel_on_time = TravelOnTimeField(required=False)

    class Meta:
        model = Booking
        fields = _booking_fields
        extra_kwargs = {f: {"required": False} for f in fields}
        extra_kwargs["booking_number"]["read_only"] = True

    def __init__(self, current_step_number=1, *args, **kwargs):
        """Create serializer and specify what step we are up to for validation"""
        self._current_step_number = current_step_number
        super().__init__(*args, **kwargs)

    def save(self, **kwargs):
        if self._current_step_number != last_step_number:
            raise ValueError("Can only save when on final step")
        result = super().save(**kwargs)
        create_or_update_subscription.delay(result.created_by.pk)
        return result

    def create(self, validated_data):
        booking = self._create_or_update(validated_data)
        BookingLog.objects.create(
            user=booking.created_by,
            booking=booking,
            description="Booking created",
            source="Frontend booking process",
        )

        # send a notification to user via celery
        send_message_to_user.delay(
            self.context["request"].user.id,
            "Booking Submitted",
            f"Thank you for travelling with Southern Cross. Your booking #{booking.booking_number} has been submitted for approval. Tap to review your bookings",
            f"Your booking #{booking.booking_number} has been submitted for approval",
            f"my-account/billing-accounts/{booking.account_id}/account-details/bookings/{booking.pk}/detail/",
        )

        return booking

    def _transform_data_for_model(self, data):
        """Transform data from format used on serializer to format required by booking"""

        # We capture fields separately but they are stored as a datetime. Convert
        # them back here.
        date = data.pop("travel_on_date", None)
        time = data.pop("travel_on_time", None)
        if data and time:
            # The date and time entered on frontend are considered to always be in our default timezone
            # so combine and convert it to a timezone aware date in the correct timezone
            # NOTE: This could present challenges when dealing with interstate bookings
            # where the location starts in a different timezone... for now we are not supporting
            # this - it's always Melbourne time.
            data["travel_on"] = localtime(
                make_aware(timezone.datetime.combine(date, time))
            )

        for key in list(data.keys()):
            # Rename any field data if serializer field name differs
            if key in _serializer_to_model_field_map:
                data[_serializer_to_model_field_map[key]] = data.pop(key)
        return data

    def _update(self, instance, validated_data):
        """
        Adjusted from rest_framework.serializers.ModelSerializer.update
        We have a step critical to logging between the field assignments
        and the record save
        :param instance: The Booking instance to update
        :param validated_data: New field values for instance
        :return: The updated instance and indicated differences from the update
        """
        # Verify that addresses were handled properly before entering this function
        assert not isinstance(
            validated_data["from_address"], (list, dict)
        ), "from_address must be an instance of CreateBookingAddressSerializer"
        assert "destination_address" not in validated_data or not isinstance(
            validated_data["destination_address"], (list, dict)
        ), "destination_address (if given) must be an instance of CreateBookingAddressSerializer"
        assert (
            "additional_stops" not in validated_data
        ), "additional_stops must not be passed into _update"

        # Set the attributes on the instance
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        # Get the indicated differences from this update (must be done before saving the record
        indicated_differences = instance.get_changed_fields()
        # Save the instance
        instance.save()
        # Return the instance and indicated differences
        return instance, indicated_differences

    @transaction.atomic
    def _create_or_update(self, validated_data, instance: Booking = None) -> Booking:
        validated_data = {
            key: value for key, value in validated_data.items() if value is not None
        }
        existing_from_address = instance.from_address if instance else None
        existing_destination_address = (
            instance.destination_address if instance else None
        )

        from_addr = validated_data.pop("from_address")
        from_addr = CreateBookingAddressSerializer(
            instance=existing_from_address, data=from_addr
        )
        from_addr.is_valid()
        from_addr = from_addr.save()

        # Associated records to remove when updating an existing booking
        to_delete = []

        if "destination_address" in validated_data:
            to_addr = validated_data.pop("destination_address")
            to_addr = CreateBookingAddressSerializer(
                instance=existing_destination_address, data=to_addr
            )
            to_addr.is_valid()
            to_addr = to_addr.save()
            validated_data["destination_address"] = to_addr
        elif existing_destination_address:
            to_delete.append(existing_destination_address)
            instance.destination_address = None

        validated_data["from_address"] = from_addr
        validated_data["created_by"] = self.context["request"].user
        validated_data["client_user"] = self.context["request"].user.get_profile()

        booking_additional_stops = validated_data.pop("booking_additional_stops", None)

        if instance:
            old_values = get_booking_values(instance)
            booking, base_indicated_differences = self._update(instance, validated_data)
            # ideally speaking should do id comparison & update here, but linked records would be very limited in number
            # (expecting 0 for most records; 1-2 otherwise) so we probably can get by with this?
            to_delete += list(instance.additional_stops.all())

            # Clear many to many relations
            instance.additional_stops.clear()
            # Delete the actual address objects
            for record in to_delete:
                record.delete()
        else:
            booking = super().create(validated_data)

        if booking_additional_stops:
            for stop_number, stop in enumerate(booking_additional_stops, 1):
                serializer = CreateBookingAdditionalStopSerializer(data=stop)
                serializer.is_valid()
                serializer.save(booking=booking, stop_number=stop_number)

        calculator = PriceCalculator(booking)
        booking.update_from_calculator(calculator)
        price_indicated_differences = booking.get_changed_fields()
        if instance:
            new_values = get_booking_values(booking)
            create_log(
                self,
                {**base_indicated_differences, **price_indicated_differences},
                old_values,
                new_values,
            )
        booking.save()

        return booking

    def update(self, instance, validated_data):
        return self._create_or_update(validated_data, instance)

    def validate(self, attrs):
        attrs = super().validate(attrs)
        attrs = self._transform_data_for_model(attrs)
        instance, additional_stops = self.get_instance(attrs)

        # From frontend we set this field automatically to match the total
        # number of car seats chosen
        attrs["child_under8_count"] = sum(
            filter(
                None,
                [
                    attrs.get("forward_facing_baby_seat_count", 0),
                    attrs.get("rear_facing_baby_seat_count", 0),
                    attrs.get("booster_seat_count", 0),
                ],
            )
        )

        # We need to validate addresses separately as they are separate
        # models. Extract them here and set field to None; we validate them
        # manually below
        from_address = getattr(instance, "from_address", None)
        destination_address = getattr(instance, "destination_address", None)

        # Validate using the full_clean() method. See _validate functions on
        # the Booking model.
        instance.validate_up_to_step = self._current_step_number
        try:
            with raise_validation_errors(instance.full_clean) as ve:
                if from_address:
                    try:
                        from_address.full_clean()
                        # Remove existing error from model full_clean - this
                        # will only ever be something like 'field cannot be null'
                        if "from_address" in ve.error_dict:
                            del ve.error_dict["from_address"]
                    except CoreValidationError as v:
                        ve.add_error("from_address", v)
                if destination_address:
                    try:
                        destination_address.full_clean()
                    except CoreValidationError as v:
                        ve.add_error("destination_address", v)
                if instance.booking_type == BookingType.HOURLY and not additional_stops:
                    ve.add_error(
                        "additional_stops",
                        CoreValidationError(
                            message="Additional stops are required for hourly bookings"
                        ),
                    )
                if additional_stops:
                    stop_errors = [{}] * len(additional_stops)
                    for i, stop in enumerate(additional_stops):
                        try:
                            stop.address.full_clean()
                        except CoreValidationError as v:
                            stop_errors[i] = v
                    if list(filter(bool, stop_errors)):
                        ve.add_error("additional_stops", stop_errors)
                # We validate lead time separately here to prevent this validation
                # from interfering with admin booking management
                instance.validate_lead_time(ve)
        except CoreValidationError as ve:
            self._raise_error_if_applicable(ve)
        return attrs

    def _raise_error_if_applicable(
        self, ve: Union[CoreValidationError, ValidationError]
    ):
        """Raises an error if passed validation errors are applicable to current step"""
        if isinstance(ve, CoreValidationError):
            error_dict = get_error_detail(ve)
        else:
            error_dict = ve.detail
        # Based on the current step we are validating extract the errors relevant
        # to that step. If there are no errors then we consider it valid; otherwise
        # re-raise the validation error with only the errors for this step.
        user = None
        if self.context.get("request"):
            user = self.context["request"].user
        fields_for_step = _get_fields_for_step(self._current_step_number, user)
        # Generic catch all error is valid for all steps
        fields_for_step.add(api_settings.NON_FIELD_ERRORS_KEY)

        # Some fields we want to combine into a single error field as it displays
        # nicer on frontend. eg. travel_on_date and travel_on_time are separate fields
        # on serializer but on field in database and so both displayed under travel_on_date
        # as they are rendered together on the form
        # We remove any duplicate errors (eg. This field is required)
        for from_field, to_field in _error_field_map.items():
            for error in error_dict.pop(from_field, []):
                if not error_dict.get(to_field):
                    error_dict[to_field] = []
                if error not in error_dict[to_field]:
                    error_dict[to_field].append(error)

        non_field_errors = error_dict.pop("__all__", None)
        if non_field_errors:
            error_dict[api_settings.NON_FIELD_ERRORS_KEY] = non_field_errors
        error_fields = fields_for_step.intersection(set(error_dict.keys()))
        if error_fields:
            # Collapse additional stop errors to a single field
            # If the type is a dict it means it's the nested serializer validation
            # of each field (formatted_address, lat etc) which does not map to
            # anything specific on frontend as we use the google address autocomplete.
            # The errors are shown all in one place at the bottom of the list so
            # only showing one generic error even if multiple stops have individual
            # errors (this is a compromise to make implementation easier)
            if (
                "additional_stops" in error_dict
                and type(error_dict["additional_stops"][0]) is dict
            ):
                error_dict["additional_stops"] = [
                    "Please check address details and try again"
                ]
            raise ValidationError({f: error_dict[f] for f in error_fields})

    def run_validation(self, data=empty):
        try:
            return super().run_validation(data)
        except ValidationError as ve:
            # We do this here as run_validation can raise validation errors
            # for individual fields without hitting self.validate(). Usually
            # this is for required fields (which we don't use on this serializer)
            # but also happens for other field level validators. Ideally we
            # don't want any field level validators to run - this is mainly here
            # to be sure that even if they do run (eg. we add one without realising
            # down the track) things still work here (ie. we only raise the errors
            # if applicable to the current step).
            self._raise_error_if_applicable(ve)

            # Additional stops are a special case for errors: they are a nested serializer
            # which DRF runs the validation for when you call self.to_internal_value
            # If we don't care about the errors (ie. the step is < 3) then we need to
            # remove the data before the call to self.to_internal_value. This could happen
            # to other fields that have field level validation but in practice there are
            # none - largely because we have made all fields optional. It's only because
            # of the nested serializer here that we need this workaround.
            if (
                ve.detail.get("additional_stops")
                and type(ve.detail["additional_stops"][0]) is dict
            ):
                data = data.copy()
                del data["additional_stops"]
        return self.to_internal_value(data)

    def get_instance(self, validated_data):
        """Create an instance of the booking record without saving it

        We can use this to do pricing calculation and validate the model using
        normal django *clean() methods
        """
        ModelClass = self.Meta.model

        final_data = {}
        additional_stops = []
        for key, value in validated_data.items():
            if value is None:
                continue
            if key == "booking_additional_stops":
                additional_stops = []
                for v in value:
                    data = v.copy()
                    address_data = data.pop("address")
                    stop = BookingAdditionalStop(
                        **data, address=BookingAddress(**address_data)
                    )
                    additional_stops.append(stop)
                continue
            # Rename any field data if serializer field name differs
            if key in _serializer_to_model_field_map:
                key = _serializer_to_model_field_map[key]
            if isinstance(self.fields.get(key, None), serializers.ModelSerializer):
                final_data[key] = self.fields[key].Meta.model(**value)
            else:
                final_data[key] = value
        instance = ModelClass(**final_data)

        return instance, additional_stops

    def get_passenger_fullname(self, instance):
        if instance.passenger:
            return f"{instance.passenger.first_name} {instance.passenger.last_name}"
        return instance.passenger_name

    def get_is_interstate(self, instance):
        return instance.is_interstate()


class CreateBookingOptionPriceSerializer(serializers.ModelSerializer):
    class Meta:
        model = PriceList
        fields = (
            "wedding_ribbon_fee",
            "child_seat_fee",
            "additional_stop_fee",
            "color_selection_fee",
            "additional_stop_fee",
        )
        # Paranoid: all fields read only on this serializer
        extra_kwargs = {f: {"read_only": True} for f in fields}


class CreateBookingVehicleClassPriceSerializer(serializers.Serializer):
    vehicle_class_id = serializers.PrimaryKeyRelatedField(read_only=True)
    price = serializers.DecimalField(max_digits=14, decimal_places=2, read_only=True)
    breakdown = serializers.DictField(read_only=True)


class CreateUpdateBookingViewSetPermissions(ScbpAppViewSetPermissions):
    actions_to_perms_map = {
        "price_options": [],
        "validate_step": [],
        "create_booking": [],
        "update_booking": ["%(app_label)s.change_%(model_name)s"],
    }


class CreateUpdateBookingViewSet(DjradGenericViewSet):
    serializer_class = CreateUpdateBookingSerializer
    permission_classes = (CreateUpdateBookingViewSetPermissions,)

    def get_queryset(self):
        if not self.request.user or self.request.user.is_anonymous:
            return Booking.objects.none()

        qs = (
            Booking.objects.filter_by_client_access(self.request.user.pk)
            .order_by("-created_at")
            .distinct()
        )

        return qs

    @action(
        detail=False,
        methods=["POST"],
        url_path="price-options",
        url_name="price_options",
    )
    def price_options(self, request):
        travel_on_date = request.data.get("travel_on_date", None)
        travel_on_time = request.data.get("travel_on_time", None)

        travel_date = None
        if travel_on_date and travel_on_time:
            travel_date = datetime.strptime(travel_on_date, "%Y-%m-%d").date()
            try:
                # Expected "00:00" format
                travel_time = datetime.strptime(travel_on_time, "%H:%M").time()
            except ValueError:
                # Handle if we have "00:00:00" time sent through.
                travel_time = datetime.strptime(travel_on_time, "%H:%M:%S").time()
            travel_date = timezone.make_aware(
                timezone.datetime.combine(travel_date, travel_time)
            )

        price_list = PriceList.get_current(travel_date=travel_date)
        serializer = CreateBookingOptionPriceSerializer(price_list)
        return DjradEntityResponse(data={"price_options": serializer.data})

    def _validate(self, current_step_number, data, instance=None):
        serializer = self.get_serializer(
            current_step_number=current_step_number, data=data, instance=instance
        )
        if not serializer.is_valid():
            furthest_step_available = None
            #
            for i in range(0, min(current_step_number, max(_fields_by_step.keys()))):
                furthest_step_available = i
                serializer = self.get_serializer(current_step_number=i + 1, data=data)
                if not serializer.is_valid():
                    # Don't go backwards for record level errors - instead display them where
                    # the user currently is
                    if list(serializer.errors.keys()) == [
                        api_settings.NON_FIELD_ERRORS_KEY
                    ]:
                        continue
                    break
            raise ValidationError(
                {
                    **serializer.errors,
                    "furthest_step_index_available": furthest_step_available,
                }
            )
        return serializer

    @action(
        detail=False,
        methods=["POST"],
        url_path="validate-step",
        url_name="validate_step",
    )
    def validate_step(self, request):
        """Validate step and recalculate prices based on current data

        If data is invalid then errors are returned along with the
        index of the furthest step that is available. This can be used
        on the frontend to ensure that all steps prior to current step
        being saved are valid and if not redirect appropriately.
        """
        data = request.data
        step_index = data.pop("step_index")
        current_step_number = step_index + 1
        serializer = self._validate(current_step_number, data)
        booking, additional_stops = serializer.get_instance(serializer.validated_data)
        price_list = PriceList.get_current(travel_date=booking.travel_on)
        return_data = []
        for vehicle_class in VehicleClass.objects.filter(
            is_interstate=booking.is_interstate()
        ):
            booking.vehicle_class = vehicle_class
            calculator = PriceCalculator(
                booking,
                price_list,
                additional_stops=[stop.address for stop in additional_stops],
            )
            breakdown = calculator.price_breakdown()
            breakdown["formatted"] = get_client_facing_breakdown(breakdown)
            return_data.append(
                {
                    "vehicle_class_id": vehicle_class,
                    "price": calculator.total(),
                    "breakdown": breakdown,
                }
            )
        serializer = CreateBookingVehicleClassPriceSerializer(return_data, many=True)
        return DjradEntityResponse(
            data={
                "travel_on": booking.travel_on,
                "vehicle_class_prices": serializer.data,
                "is_interstate": booking.is_interstate(),
                "is_hourly_out_of_area": booking.booking_type == BookingType.HOURLY
                and any(
                    (
                        booking.is_address_out_of_area(
                            stop,
                            price_list=PriceList.get_current(
                                travel_date=booking.travel_on
                            ),
                        )
                        for stop in [booking.from_address]
                        + [
                            additional_stop.address
                            for additional_stop in additional_stops
                        ]
                    )
                ),
            }
        )

    @action(detail=False, methods=["POST"], url_path="create-booking")
    def create_booking(self, request):
        data = request.data
        serializer = self._validate(last_step_number, data)
        serializer.save()
        return Response(serializer.data)

    def retrieve(self, request, pk):
        booking = self.get_object()
        if not booking.is_modifiable_by_client():
            return Response(
                {
                    "too_close_to_travel_time": True,
                    "message": UPDATE_BOOKING_TOO_CLOSE_ERROR_MESSAGE,
                },
                status=status.HTTP_400_BAD_REQUEST,
            )
        return Response(self.get_serializer(instance=booking).data)

    @action(detail=True, methods=["POST"], url_path="update-booking")
    def update_booking(self, request, pk):
        booking = self.get_object()
        data = request.data
        serializer = self._validate(last_step_number, data, instance=booking)
        extra_kwargs = {}
        if booking.booking_status != BookingStatus.UNVERIFIED:
            extra_kwargs["booking_status"] = BookingStatus.CHANGED
        serializer.save(**extra_kwargs)
        return Response(serializer.data)


class CreateUpdateBookingRegistration(ScbpAppModelRegistration):
    viewset_class = CreateUpdateBookingViewSet

    registration_id = "scbp_core.writeonlybooking"
    api_route_prefix = "scbp_core.writeonlybooking"

    def get_related_lookup_field_names(self):
        return []


class ExistingBookingAddressSerializer(BaseAddressSerializer):
    class Meta:
        model = BookingAddress
        fields = BaseAddressSerializer.BASE_FIELDS + (
            "address_instructions",
            "address_label",
        )


class ExistingBookingAdditionalStopSerializer(ScbpAppModelSerializer):
    address = ExistingBookingAddressSerializer()

    class Meta:
        model = BookingAdditionalStop
        fields = ("address", "stop_number", "is_pick_up", "address_type")

    @transaction.atomic
    def create(self, validated_data):
        address = validated_data.pop("address")
        address = ExistingBookingAddressSerializer(data=address)
        address.is_valid()
        address = address.save()
        validated_data["address"] = address
        return super().create(validated_data)


class ExistingBookingSerializer(ScbpAppModelSerializer):
    from_address = ExistingBookingAddressSerializer()
    destination_address = ExistingBookingAddressSerializer(required=False)
    additional_stops_detail = ExistingBookingAddressSerializer(
        source="additional_stops", read_only=True, many=True
    )

    passenger_fullname = SerializerMethodField()
    passenger_abbreviated_name = SerializerMethodField()
    client_abbreviated_name = SerializerMethodField()
    client_phone_number = SerializerMethodField()

    vehicle_color = serializers.PrimaryKeyRelatedField(
        queryset=VehicleColor.objects.all(),
        required=False,
        allow_null=True,
        label="Vehicle Colour",
    )
    is_modifiable = SerializerMethodField()

    travel_on_date = TravelOnDateField(required=False)
    travel_on_time = TravelOnTimeField(required=False)

    class Meta:
        model = Booking
        fields = (
            "additional_stops_detail",
            "passenger_abbreviated_name",
            "is_modifiable",
            "client_abbreviated_name",
            "client_user",
            "client_phone_number",
            "vehicle_class",
            "vehicle_color",
            "price_total",
            "booking_status",
        ) + _booking_fields

    def get_passenger_fullname(self, instance):
        if instance.passenger:
            return f"{instance.passenger.first_name} {instance.passenger.last_name}"
        else:
            return instance.passenger_name

    def get_client_abbreviated_name(self, instance):
        if instance.client_user.first_name and instance.client_user.last_name:
            return f"{instance.client_user.first_name[0]}. {instance.client_user.last_name}"
        # This will return whichever is set of first name or last name
        return instance.client_user.get_full_name()

    def get_client_phone_number(self, instance):
        if instance.client_user:
            return instance.client_user.contact_phone

    def get_passenger_abbreviated_name(self, instance):
        if instance.passenger:
            first_name = instance.passenger.first_name
            if first_name:
                if not instance.passenger.last_name:
                    return first_name
                return f"{first_name[0]}. {instance.passenger.last_name}"
            if instance.passenger.last_name:
                return instance.passenger.last_name
            return instance.passenger.email
        else:
            return instance.passenger_name

    def get_is_modifiable(self, instance):
        return instance.is_modifiable_by_client()


def refine_choices_by_name(query_set, keywords, request):
    qs = Booking.objects.filter_by_client_access(request.user.pk).distinct()

    ids = qs.values_list("client_user_id")

    users = (
        query_set.annotate(
            name_last_first=Concat("last_name", Value(", "), "first_name"),
            name_first_first=Concat("first_name", Value(" "), "last_name"),
        )
        .filter(
            Q(email__icontains=keywords)
            | Q(name_first_first__icontains=keywords)
            | Q(name_last_first__icontains=keywords)
        )
        .filter(id__in=ids)
    )

    return users


class ExistingBookingFilterSet(ScbpAppFilterSet):
    account = RefineModelChoiceFilter(
        queryset=Account.objects.all(),
        refine_choices=lambda query_set, filter_param, request: query_set.filter(
            clients__id=request.user.pk
        ),
    )

    client_user = RefineModelChoiceFilter(
        queryset=ClientUser.objects.all(), refine_choices=refine_choices_by_name
    )

    passenger = RefineModelChoiceFilter(
        queryset=ClientUser.objects.all(), refine_choices=refine_choices_by_name
    )

    travel_date_range = DateFromToRangeFilter(field_name="travel_on__date")

    class Meta:
        model = Booking
        fields = ("client_user", "passenger", "account", "travel_date_range")


class ExistingBookingViewSetPermissions(ScbpAppViewSetPermissions):
    actions_to_perms_map = {
        "cancel_booking": ["%(app_label)s.change_%(model_name)s"],
        "download": ["%(app_label)s.list_%(model_name)s"],
    }


class ExistingBookingViewSet(
    ScbpModelBaseViewSet,
    mixins.RelatedModelLookupMixin,
    mixins.RetrieveModelMixin,
    mixins.UpdateModelMixin,
    mixins.ListModelMixin,
    DjradGenericViewSet,
):
    serializer_class = ExistingBookingSerializer
    filterset_class = ExistingBookingFilterSet
    permission_classes = (ExistingBookingViewSetPermissions,)
    queryset = Booking.objects.none()

    @action(methods=["POST"], detail=True, url_path="cancel-booking")
    def cancel_booking(self, request, pk):
        booking = self.get_object()

        if not booking.is_modifiable_by_client():
            return Response(
                {"message": "Booking can not be cancelled"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        booking.booking_status = BookingStatus.CANCELLED
        booking.save()

        return Response(self.get_serializer(booking).data)

    @action(methods=["GET"], detail=False, url_path="download")
    def download(self, request):
        default_filename = "limomate_my_booking_list.csv"

        qs = self.filter_queryset(self.get_queryset())
        response = generate_client_bookings_csv(default_filename, bookings=qs)

        return response

    def get_queryset(self):
        if not self.request.user or self.request.user.is_anonymous:
            return Booking.objects.none()

        qs = (
            Booking.objects.filter(
                Q(client_user_id=self.request.user.pk)
                | Q(
                    account__account_to_client__is_account_admin=True,
                    account__account_to_client__client_user_id=self.request.user.pk,
                )
            )
            # George request we sort by travel date/time descending on 2020-03-04
            .order_by("-travel_on").select_related(
                "passenger", "client_user", "destination_address", "from_address"
            )
            # Shows distinct bookings on the clients booking list.
            .distinct()
        )

        return qs


class ExistingBookingRegistration(ScbpAppModelRegistration):
    viewset_class = ExistingBookingViewSet

    action_permissions = {
        **ScbpAppModelRegistration.action_permissions,
        "cancel": ["%(app_label)s.change_%(model_name)s"],
    }

    def get_object_actions(self):
        return super().get_object_actions() + ["cancel"]

    def get_async_permissions(self):
        # change_booking requires a query per record. make async to avoid lots of upfront queries
        # whenever serializing lots of bookings even if the permission isn't used
        return ["scbp_core.change_booking"]


create_update_booking_registration = app_site.register(
    Booking, CreateUpdateBookingRegistration
)
app_site.register(Booking, ExistingBookingRegistration)
