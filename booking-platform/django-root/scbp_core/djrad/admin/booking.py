from collections import OrderedDict
from datetime import timedelta
from distutils.util import strtobool
from typing import Union
import warnings

from allianceutils.models import raise_validation_errors
from django.conf import settings
from django.core.exceptions import ValidationError as CoreValidationError
from django.db import models
from django.db.models import BooleanField
from django.db.models import Case
from django.db.models import Count
from django.db.models import ExpressionWrapper
from django.db.models import F
from django.db.models import Q
from django.db.models import Sum
from django.db.models import Value
from django.db.models import When
from django.db.models.functions import Abs
from django.db.models.functions import Concat
from django.db.models.functions import Replace
from django.db.models.functions import TruncHour
from django.http import JsonResponse
from django.utils import timezone
from django.utils.datetime_safe import datetime
from django.utils.timezone import localtime
from django.utils.timezone import make_aware
from django_filters import DateFromToRangeFilter
from django_filters import DateTimeFilter
from django_filters import Filter
from django_filters import MultipleChoiceFilter
from djrad_rest.util import DjradEntityResponse
from rest_framework import serializers
from rest_framework import status
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from rest_framework.fields import get_error_detail
from rest_framework.fields import SerializerMethodField
from rest_framework.response import Response

from scbp_core.djrad.admin.base import ScbpAdminBookingViewSet
from scbp_core.djrad.admin.base import ScbpAdminModelRegistration
from scbp_core.djrad.admin.base import ScbpAdminModelSerializer
from scbp_core.djrad.admin.base import ScbpAdminModelViewSet
from scbp_core.djrad.admin.base import ScbpAdminViewSetPermissions
from scbp_core.djrad.admin.filters import RefineAccountChoiceFilter
from scbp_core.djrad.admin.filters import RefineClientUserChoiceFilter
from scbp_core.djrad.base import ScbpFilterSet
from scbp_core.djrad.common.address import BaseAddressSerializer
from scbp_core.djrad.common.booking import create_log
from scbp_core.djrad.common.booking import get_booking_values
from scbp_core.djrad.sites import admin_site
from scbp_core.models import AccountPaymentMethodType
from scbp_core.models import AccountPaymentTermsType
from scbp_core.models import BookingDriverCollectMethod
from scbp_core.models import BookingLog
from scbp_core.models import BookingMethod
from scbp_core.models import BookingPaymentMethod
from scbp_core.models import BookingStatus
from scbp_core.models import BookingType
from scbp_core.models import LegacyReviewStatus
from scbp_core.models import PriceList
from scbp_core.models import transaction
from scbp_core.models import VehicleClass
from scbp_core.models.account import Account
from scbp_core.models.booking import Booking
from scbp_core.models.booking import BookingAdditionalStop
from scbp_core.models.booking import BookingAddress
from scbp_core.models.booking import BookingOutOfPocket
from scbp_core.models.booking import BookingPriceVariation
from scbp_core.models.user import ClientUser
from scbp_core.services.booking_status_emails import send_booking_confirmation_email
from scbp_core.services.campaign_monitor import create_or_update_subscription
from scbp_core.services.pricing import PriceCalculator
from scbp_core.tasks.send_notifications import send_message_to_user


class BookingAddressSerializer(BaseAddressSerializer):
    class Meta:
        model = BookingAddress

        # NOTE: If you add new fields here also need to update AddressFieldDescriptor
        fields = BaseAddressSerializer.BASE_FIELDS + (
            "address_instructions",
            "address_label",
        )


class BookingAdditionalStopSerializer(ScbpAdminModelSerializer):
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


class PriceVariationSerializer(ScbpAdminModelSerializer):
    class Meta:
        model = BookingPriceVariation
        fields = ["variation_type", "amount", "id", "variation_type_other_description"]
        # We make id writable to allow us to overwrite existing values in BookingSerializer.create_instances
        extra_kwargs = {"id": {"read_only": False, "required": False}}


class OutOfPocketSerializer(ScbpAdminModelSerializer):
    class Meta:
        model = BookingOutOfPocket
        fields = ["description", "amount", "id"]
        # We make id writable to allow us to overwrite existing values in BookingSerializer.create_instances
        extra_kwargs = {"id": {"read_only": False, "required": False}}


class BookingConfirmationEmailUserField(serializers.PrimaryKeyRelatedField):
    def get_queryset(self):
        """
        Customize get_queryset to filter to users on the current account
        """
        if self.parent and self.parent.instance and self.parent.instance.account:
            return self.parent.instance.account.clients.all()
        return ClientUser.objects.none()


class BookingSerializer(ScbpAdminModelSerializer):
    from_address = BookingAddressSerializer()
    destination_address = BookingAddressSerializer(required=False, allow_null=True)
    booking_additional_stops = BookingAdditionalStopSerializer(
        many=True, required=False
    )
    price_variations = PriceVariationSerializer(many=True, required=False)
    out_of_pockets = OutOfPocketSerializer(many=True, required=False)
    request_confirmation_email = serializers.BooleanField(
        write_only=True, default=False
    )
    confirmation_email_user = BookingConfirmationEmailUserField(
        write_only=True, required=False, allow_null=True
    )
    prepay = serializers.BooleanField(write_only=True, default=False)

    passenger_fullname = SerializerMethodField()
    passenger_or_client_phone = SerializerMethodField()
    total_time_spent = SerializerMethodField()

    vehicle_class_name = SerializerMethodField()
    vehicle_class_abbreviation = serializers.CharField(
        source="vehicle_class.abbreviation", read_only=True
    )
    vehicle_color_title = serializers.CharField(
        source="vehicle_color.title", read_only=True
    )

    client_user_fullname = SerializerMethodField()

    invoice_sent_date = SerializerMethodField()
    invoice_sent_amount = SerializerMethodField()
    will_charge_on_complete = SerializerMethodField()

    variation_amount = SerializerMethodField()
    legacy_price = SerializerMethodField()
    legacy_price_variance = SerializerMethodField()

    travel_on_date = serializers.DateField(required=False)
    travel_on_time = serializers.TimeField(required=False)

    driver_no = serializers.IntegerField(
        source="driver.driver_no", read_only=True, required=False
    )
    requested_driver_no = serializers.IntegerField(
        source="requested_driver.driver_no", read_only=True
    )

    def __init__(self, *args, price_estimate_only=False, **kwargs):
        """Create serializer and specify what step we are up to for validation"""
        self._price_estimate_only = price_estimate_only
        super().__init__(*args, **kwargs)
        if "data" in kwargs:
            if "driver" in kwargs["data"] and "driver_number" in kwargs["data"]:
                msg = (
                    "Both 'driver' and 'driver_number' in data passed to serializer. These "
                    "both operate on the same source field and so the last value set will "
                    "overwrite the other. You should not rely on order of operations here; "
                    "fix usage to only pass through one field"
                )
                if settings.DEBUG:
                    raise ValueError(msg)
                else:
                    warnings.warn(msg)

    account__related_label = serializers.CharField(
        source="account.account_nickname", read_only=True
    )

    class Meta:
        fields = (
            "account",
            "account__related_label",
            "client_user",
            "client_user_fullname",
            "passenger",
            "passenger_name",
            "passenger_phone",
            "passenger_count",
            "baggage_count",
            "booking_time",
            "dropoff_time",
            "from_address_type",
            "from_address",
            "from_flight_number",
            "from_airport_driver_required_on_landing",
            "from_airport_notes_for_driver",
            "from_airport_arrival_after_landing",
            "destination_address_type",
            "destination_address",
            "destination_airport_terminal",
            "destination_flight_departure_time",
            "travel_on",
            "travel_on_date",
            "travel_on_time",
            "dropoff_time",
            "total_distance",
            "wait_time",
            "hourly_booking_duration",
            "vehicle_class",
            "vehicle_class_name",
            "vehicle_class_abbreviation",
            "vehicle_color",
            "vehicle_color_title",
            "booster_seat_count",
            "forward_facing_baby_seat_count",
            "rear_facing_baby_seat_count",
            "requires_wedding_ribbons",
            "requires_car_park_pass",
            "driver_notes",
            "office_notes",
            "admin_general_notes",
            "signboard_text",
            "purchase_order_number",
            "booking_additional_stops",
            "booking_method",
            "is_out_of_area",
            "booking_type",
            "booking_number",
            "driver",
            "requested_driver",
            "vehicle",
            "booking_status",
            "price_total",
            "price_breakdown",
            "price_variations",
            "out_of_pockets",
            "purchase_order_number",
            "passenger_fullname",
            "passenger_or_client_phone",
            "pickup_time",
            "total_time_spent",
            "supplier_confirmation_number",
            "is_time_tba",
            "child_under8_count",
            "request_confirmation_email",
            "confirmation_email_user",
            "prepay",
            "invoice_sent_date",
            "invoice_sent_amount",
            "will_charge_on_complete",
            "booking_payment_method",
            "driver_collect_method",
            "is_managed_in_legacy",
            "legacy_price_breakdown",
            "variation_amount",
            "legacy_price",
            "legacy_price_variance",
            "driver_no",
            "requested_driver_no",
            "pencil_note",
        )
        model = Booking
        extra_kwargs = {
            "baggage_count": {"default": 0},
            "child_under8_count": {"default": 0},
            "passenger_count": {"default": 1},
            "vehicle_class": {
                "default": lambda: VehicleClass.objects.filter(is_any_class=True)
                .first()
                .id
            },
            "travel_on": {"read_only": True},
            "driver_collect_method": {"allow_null": True, "required": False},
        }

    def get_extra_kwargs(self):
        extra_kwargs = super().get_extra_kwargs()
        if self.instance:
            # booking_method can only be set on created; can't be changed afterwards
            if "booking_method" not in extra_kwargs:
                extra_kwargs["booking_method"] = {}
            extra_kwargs["booking_method"]["read_only"] = True
        return extra_kwargs

    def get_passenger_fullname(self, instance):
        if instance.passenger:
            return f"{instance.passenger.first_name} {instance.passenger.last_name}"
        else:
            return instance.passenger_name

    def get_passenger_or_client_phone(self, instance):
        if instance.passenger:
            return (
                instance.passenger.contact_phone
                or instance.passenger.contact_phone_alternate
            )
        return instance.passenger_phone

    def get_client_user_fullname(self, instance):
        if instance.client_user:
            return instance.client_user.get_full_name()

    def get_total_time_spent(self, instance):
        if not instance.dropoff_time or not instance.pickup_time:
            return timedelta()

        # We don't care about the seconds as we want to get the difference
        # between the full minutes and eliminate rounding errors.
        dropoff_time = instance.dropoff_time.replace(second=0, microsecond=0)
        pickup_time = instance.pickup_time.replace(second=0, microsecond=0)
        booking_time = instance.travel_on.replace(second=0, microsecond=0)

        total_time = dropoff_time - pickup_time

        # If our booking time is before the pickup time we want to use that
        # to calculate our total time.
        if booking_time < pickup_time:
            total_time = dropoff_time - booking_time
        return total_time

    def get_vehicle_class_name(self, instance):
        if instance.vehicle_class:
            return instance.vehicle_class.title

    def get_invoice_sent_date(self, instance):
        invoice = instance.invoices.order_by("issued_on").first()
        if invoice:
            return invoice.issued_on.strftime("%d/%m/%Y")
        return None

    def get_invoice_sent_amount(self, instance):
        return instance.invoices.aggregate(Sum("invoice_total_amount"))[
            "invoice_total_amount__sum"
        ]

    def get_will_charge_on_complete(self, instance: Booking):
        return instance.get_short_payment_type() == "CF"

    def to_internal_value(self, data):
        # Convert empty strings sent to run_number to None - empty string indicates null value
        if data.get("run_number", None) == "":
            data["run_number"] = None
        return super().to_internal_value(data)

    def get_variation_amount(self, record):
        if hasattr(record, "variation_amount"):
            return record.variation_amount
        return None

    def get_legacy_price(self, record):
        if hasattr(record, "legacy_price"):
            return record.legacy_price
        return None

    def get_legacy_price_variance(self, record):
        if hasattr(record, "legacy_price_variance"):
            return record.legacy_price_variance
        return None

    def create_instances(
        self, validated_data, *, save=False, request_use_existing_breakdown=False
    ):
        """Create an instance of the booking record without saving it

        If this is an update then re-uses the existing Booking record and associated
        foreign key records (eg. from_address, destination_address) but creates new
        BookingOutOfPocket, BookingAdditionalStop and BookingPriceVariation records.

        We can use this to do pricing calculation and validate the model using
        normal django *clean() methods
        """

        ModelClass = self.Meta.model

        additional_stops = []
        price_variations = []
        out_of_pocket_expenses = []
        instance = self.instance or ModelClass()
        for key, value in validated_data.items():
            if key == "booking_additional_stops":
                for v in value:
                    address = BookingAddress(**v["address"])
                    if save:
                        address.save()
                    additional_stops.append(
                        BookingAdditionalStop(**{**v, "address": address})
                    )
                continue
            if key == "out_of_pockets":
                out_of_pocket_expenses = []
                for variation_params in value:
                    if "id" in variation_params:
                        variation = instance.out_of_pockets.get(
                            id=variation_params["id"]
                        )
                        for subkey, subvalue in variation_params.items():
                            setattr(variation, subkey, subvalue)
                        out_of_pocket_expenses.append(variation)
                    else:
                        out_of_pocket_expenses.append(
                            BookingOutOfPocket(**variation_params)
                        )
                continue
            if key == "price_variations":
                price_variations = []
                for variation_params in value:
                    if "id" in variation_params:
                        variation = instance.price_variations.get(
                            id=variation_params["id"]
                        )
                        for subkey, subvalue in variation_params.items():
                            setattr(variation, subkey, subvalue)
                        price_variations.append(variation)
                    else:
                        price_variations.append(
                            BookingPriceVariation(**variation_params)
                        )
                continue
            if isinstance(self.fields.get(key, None), serializers.ModelSerializer):
                # Could be None, eg. unsetting destination_address when saving hourly booking
                if value is not None:
                    value = self.fields[key].Meta.model(**value)
                    if save:
                        value.save()
            setattr(instance, key, value)

        if save:
            request_confirmation_email = (
                # Verify that the user wants to send a confirmation email
                validated_data.pop("request_confirmation_email", False)
                # Verify that the user has selected a user to send the confirmation email to
                and validated_data.pop("confirmation_email_user", None)
            )
            request_prepay = validated_data.pop("prepay", False)
            if self.instance:
                old_values = get_booking_values(self.instance)

                if "booking_additional_stops" in validated_data:
                    # Dispatch does not send the 'booking_additional_stops' key which breaks save
                    # for hourly bookings
                    # ideally speaking should do id comparison & update here,
                    # but linked records would be very limited in number
                    # (expecting 0 for most records; 1-2 otherwise) so we probably can get by with this?
                    addresses = list(instance.additional_stops.all())
                    # Clear many to many relations
                    instance.additional_stops.clear()
                    # Delete the actual address objects
                    for address in addresses:
                        address.delete()

                # Remove only those price variations and out of pocket expenses that were removed by the client
                # Removing all creates an update loop on the dispatch screen
                # Variations filtered by id because having None in list (for new variation) results in
                # empty query set (and duplication of variations)
                instance.price_variations.exclude(
                    id__in=[
                        variation.id for variation in price_variations if variation.id
                    ]
                ).delete()
                instance.out_of_pockets.exclude(
                    id__in=[
                        variation.id
                        for variation in out_of_pocket_expenses
                        if variation.id
                    ]
                ).delete()
                if instance.booking_status in [
                    BookingStatus.UNVERIFIED,
                    BookingStatus.CHANGED,
                ]:
                    instance.booking_status = BookingStatus.VERIFIED

                    # send a notification to user via celery
                    send_message_to_user.delay(
                        instance.client_user.id,
                        "Booking verified",
                        f"Your booking #{instance.booking_number} has been approved. Tap to review your bookings",
                        f"Your booking #{instance.booking_number} has been approved",
                        f"my-account/billing-accounts/{instance.account_id}/account-details/bookings/{instance.pk}/detail/",
                    )
            else:
                # Verify admin-created bookings - without this the booking would be unverified,
                # which doesn't fit the workflow (the employee verified the booking in the process of making it)
                instance.booking_status = BookingStatus.VERIFIED

            price_list = (
                PriceList.get_current(travel_date=instance.travel_on)
                if not hasattr(instance, "price_list")
                else instance.price_list
            )
            use_existing_breakdown = (
                request_use_existing_breakdown
                or not instance.should_recalculate_price()
            )
            calculator = PriceCalculator(
                instance,
                price_list,
                additional_stops=[stop.address for stop in additional_stops],
                price_variations=price_variations,
                out_of_pockets=out_of_pocket_expenses,
                use_previous=use_existing_breakdown,
            )
            instance.update_from_calculator(calculator)
            instance.price_list = price_list
            indicated_differences = instance.get_changed_fields()
            instance.save(prepay=request_prepay)
            create_or_update_subscription.delay(instance.client_user_id)
            for record in additional_stops + price_variations + out_of_pocket_expenses:
                setattr(record, "booking", instance)
                record.save()

            if self.instance:
                # we'll only write to log if there's a self.instance (ie. update).
                # need to do it here because price_total's one of fields we want to capture.
                new_values = get_booking_values(
                    instance, additional_stops, price_variations, out_of_pocket_expenses
                )
                create_log(self, indicated_differences, old_values, new_values)
                if request_confirmation_email and not instance.is_managed_in_legacy:
                    if isinstance(request_confirmation_email, ClientUser):
                        request_confirmation_email = request_confirmation_email.email
                    send_booking_confirmation_email(
                        instance, request_confirmation_email
                    )

            else:
                request_confirmation_email = instance.client_user.email
                send_booking_confirmation_email(instance, request_confirmation_email)

        return instance, additional_stops, price_variations, out_of_pocket_expenses

    def validate(self, attrs):
        attrs = super().validate(attrs)
        attrs["created_by"] = self.context["request"].user

        date = attrs.pop("travel_on_date", None)
        time = attrs.pop("travel_on_time", None)
        if date and time:
            attrs["travel_on"] = timezone.make_aware(
                timezone.datetime.combine(date, time)
            )

        try:
            (
                instance,
                additional_stops,
                price_variations,
                out_of_pocket_expenses,
            ) = self.create_instances(attrs)
        except BookingOutOfPocket.DoesNotExist:
            raise ValidationError(
                {
                    "out_of_pockets",
                    "Not allowed to adjust out of pocket entries for other bookings",
                }
            )
        except BookingPriceVariation.DoesNotExist:
            raise ValidationError(
                {"price_variations": "Not allowed to adjust price for other bookings"}
            )
        # Validate presence of additional stops for hourly bookings
        # Dispatch does not pass 'booking_additional_stops' key - it's disregarded here
        if instance.booking_type == BookingType.HOURLY and (
            ("booking_additional_stops" in attrs and not additional_stops)
            or (
                "booking_additional_stops" not in attrs
                and not instance.additional_stops.all()
            )
        ):
            raise ValidationError(
                {"booking_additional_stops": "Required for hourly bookings"}
            )
        # Store instances so that we can access it after validate has run
        self.validated_instances = (
            instance,
            additional_stops,
            price_variations,
            out_of_pocket_expenses,
        )
        # Ensure driver_collect_method aligns with booking_payment_method
        if "booking_payment_method" in attrs:
            if attrs["booking_payment_method"] == BookingPaymentMethod.DRIVER_COLLECT:
                if "driver_collect_method" not in attrs or attrs[
                    "driver_collect_method"
                ] not in (
                    BookingDriverCollectMethod.CAB_CARD,
                    BookingDriverCollectMethod.CABCHARGE,
                    BookingDriverCollectMethod.CAB_CASH,
                ):
                    if not self._price_estimate_only:
                        raise ValidationError(
                            {
                                "driver_collect_method": "Must be provided when Payment Method is Driver Collect"
                            }
                        )
            else:
                # If payment method is not driver-collect, driver_collect_method must be NONE
                attrs["driver_collect_method"] = BookingDriverCollectMethod.NONE

        # We need to validate addresses separately as they are separate
        # models. Extract them here and set field to None; we validate them
        # manually below
        from_address = getattr(instance, "from_address", None)
        destination_address = getattr(instance, "destination_address", None)
        try:
            with raise_validation_errors(instance.full_clean) as ve:
                if from_address:
                    try:
                        from_address.full_clean()
                        # Remove existing error from model full_clean - this
                        # will only ever be something like 'field cannot be null'
                        # The hasattr check validates the presence of error_dict before we attempt to
                        # access it - otherwise updating the convoy and run numbers on the dispatch
                        # screen fails with 400 errors
                        if (
                            hasattr(ve, "error_dict")
                            and "from_address" in ve.error_dict
                        ):
                            del ve.error_dict["from_address"]
                    except CoreValidationError as v:
                        ve.add_error("from_address", v)
                if destination_address:
                    try:
                        destination_address.full_clean()
                        # If we have additional stops, remove the model validation error that is
                        # validating on the pickup and destination addresses being the same.
                        if (
                            additional_stops
                            and instance.booking_type == BookingType.ONE_WAY
                            and hasattr(ve, "error_dict")
                            and "destination_address" in ve.error_dict
                        ):
                            del ve.error_dict["destination_address"]

                    except CoreValidationError as v:
                        ve.add_error("destination_address", v)
                if additional_stops:
                    stop_errors = [{}] * len(additional_stops)
                    for i, stop in enumerate(additional_stops):
                        try:
                            stop.address.full_clean()
                        except CoreValidationError as v:
                            stop_errors[i] = v.error_dict
                    if list(filter(bool, stop_errors)):
                        ve.add_error("additional_stops", stop_errors)
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
        if not error_dict:
            return
        # Based on the current step we are validating extract the errors relevant
        # to that step. If there are no errors then we consider it valid; otherwise
        # re-raise the validation error with only the errors for this step.
        if self._price_estimate_only:
            skip_fields = {
                "passenger",
                "account",
                "client_user",
                "passenger_name",
                "passenger_phone",
                "created_by",
            }
            raise ValidationError(
                {f: error_dict[f] for f in error_dict if f not in skip_fields}
            )

        raise ValidationError(error_dict)

    @transaction.atomic
    def create(self, validated_data):
        instance, *_ = self.create_instances(validated_data, save=True)
        BookingLog.objects.create(
            user=instance.created_by,
            booking=instance,
            description="Booking created",
            source="Admin",
        )
        return instance

    @transaction.atomic
    def update(self, instance, validated_data, *, use_existing_breakdown=False):
        instance, *_ = self.create_instances(
            validated_data,
            save=True,
            request_use_existing_breakdown=use_existing_breakdown,
        )
        return instance


class BookingFilterSet(ScbpFilterSet):
    account = RefineAccountChoiceFilter()
    client_user = RefineClientUserChoiceFilter()
    travel_date_range = DateFromToRangeFilter(field_name="travel_on__date")
    travel_on_from = DateTimeFilter(field_name="travel_on", lookup_expr="gte")
    travel_on_to = DateTimeFilter(field_name="travel_on", lookup_expr="lte")
    booking_status = MultipleChoiceFilter(
        field_name="booking_status", choices=list(BookingStatus.choices.items())
    )
    booking_method = MultipleChoiceFilter(
        field_name="booking_method", choices=list(BookingMethod.choices.items())
    )
    # This is an odd filter; it will filter on any unverified bookings OR return any
    # of the specified bookings in the filter. The reason for this is from the frontend
    # we poll the backend for unverified bookings. This works fine for bookings that
    # have a status of unverified but for bookings that have been verified we need a way
    # to let the frontend know (via the polling) the unverified bookings already fetched
    # have had a status change. Easiest way to do this per client is to have the client
    # send through the list of id's that we need to refetch. The unverified bookings
    # listing is always kept small so this _shouldn't_ be too bad.
    unverified_or_specified_bookings = Filter(
        method="filter_unverified_or_specified_bookings"
    )
    phone_number = Filter(method="filter_phone_number")

    hide_cancelled_status = Filter(method="filter_cancelled_status")

    class Meta:
        model = Booking
        fields = (
            "booking_number",
            "client_user",
            "account",
            "travel_date_range",
            "travel_on_from",
            "travel_on_to",
            "booking_method",
            "booking_status",
            "unverified_or_specified_bookings",
            "legacy_has_invalid_address",
            "phone_number",
            "hide_cancelled_status",
        )

    def filter_cancelled_status(self, qs, name, value):
        if value == "true":
            return qs.exclude(Q(booking_status__in=[BookingStatus.CANCELLED]))
        return qs

    def filter_unverified_or_specified_bookings(self, qs, name, single_value):
        # It's not clear how to do this properly with django filters... the value it
        # passes is just a single value, not a list of values. Do it manually here
        existing_bookings = []
        if single_value != "null":
            existing_bookings = self.request.query_params.getlist(
                "unverifiedOrSpecifiedBookings"
            )
        return qs.filter(
            Q(booking_status__in=[BookingStatus.UNVERIFIED, BookingStatus.CHANGED])
            | Q(id__in=existing_bookings)
        )

    def filter_phone_number(self, qs, name, value):
        value = str(value).replace(" ", "")
        return qs.annotate(
            contact_phone_stripped=Replace(
                "passenger__contact_phone", Value(" "), Value("")
            ),
            contact_phone_alt_stripped=Replace(
                "passenger__contact_phone_alternate", Value(" "), Value("")
            ),
            passenger_phone_stripped=Replace("passenger_phone", Value(" "), Value("")),
        ).filter(
            Q(contact_phone_stripped__icontains=value)
            | Q(contact_phone_alt_stripped__icontains=value)
            | Q(passenger_phone_stripped__icontains=value)
        )


class BookingViewSetPermissions(ScbpAdminViewSetPermissions):
    actions_to_perms_map = {
        "get_booking_intensity": ["%(app_label)s.list_%(model_name)s"],
        "estimate_price_new": ["%(app_label)s.add_%(model_name)s"],
        "estimate_price_existing": ["%(app_label)s.change_%(model_name)s"],
        "set_legacy_review_status": ["%(app_label)s.change_%(model_name)s"],
        "sales_analysis_report": ["%(app_label)s.list_%(model_name)s"],
        "decline_booking": ["%(app_label)s.delete_%(model_name)s"],
        "cancel_booking": ["%(app_label)s.delete_%(model_name)s"],
        "reinstate_cancelled_booking": ["%(app_label)s.change_%(model_name)s"],
    }


class BookingViewSet(ScbpAdminBookingViewSet):
    serializer_class = BookingSerializer
    queryset = (
        Booking.objects.all()
        .order_by("-travel_on")
        .select_related(
            "vehicle_class",
            "destination_address",
            "from_address",
            "account",
            "client_user",
            "passenger",
            "driver",
        )
        .prefetch_related("invoices")
    )
    filterset_class = BookingFilterSet
    permission_classes = (BookingViewSetPermissions,)
    ordering_fields = (
        "travel_on",
        "booking_number",
        ("client_user_fullname", ("client_user__last_name", "client_user__first_name")),
        ("account", "account__account_nickname"),
        ("vehicle_class", ("vehicle_class__sort_key", "vehicle_class__abbreviation")),
        "booking_status",
        "booking_method",
        ("from_address", "from_address__suburb"),
        ("destination_address", "destination_address__suburb"),
    )
    related_lookup_filter_fields = {
        "client_user": (
            "name",
            "email",
            "name_last_first",
            "contact_phone",
            "contact_phone_alternate",
        ),
        "account": ("account_no", "account_nickname"),
    }

    def get_related_lookup_queryset(self, model):
        if model == ClientUser:
            return (
                super()
                .get_related_lookup_queryset(model)
                .annotate(
                    name=Concat(F("first_name"), Value(" "), F("last_name")),
                    name_last_first=Concat("last_name", Value(" "), "first_name"),
                )
                .order_by("name")
            )
        if model == Account:
            client = self.request.query_params.get("clientUser")
            if not client:
                return Account.objects.all().order_by("account_no")
            return Account.objects.filter(clients=client).order_by("account_no")
        return super().get_related_lookup_queryset(model)

    def get_queryset(self):
        queryset = super().get_queryset()
        if strtobool(self.request.query_params.get("legacyListView", "False")):
            # For the frontend legacy booking list view we need variation_amount
            # annotation. This is intended to be temporary - once we go live and
            # happy with imported data this can be removed.
            queryset = (
                queryset.filter(legacy_jobnumber__isnull=False)
                .annotate(
                    variation_amount=Sum(
                        "price_variations__amount", output_field=models.DecimalField()
                    ),
                    legacy_price=ExpressionWrapper(
                        F("price_total") + F("variation_amount"),
                        output_field=models.DecimalField(),
                    ),
                    legacy_price_variance=ExpressionWrapper(
                        Abs(F("variation_amount") / F("legacy_price")) * Value(100.0),
                        output_field=models.DecimalField(),
                    ),
                )
                .filter(
                    variation_amount__gt=0,
                    legacy_review_status=LegacyReviewStatus.NOT_REVIEWED,
                )
                .order_by("-legacy_price_variance")
            )
        return queryset

    def destroy(self, request, *args, **kwargs):
        warnings.warn("Don't use 'destroy' - use one of 'decline' or 'cancel'")
        return Response(
            status=status.HTTP_400_BAD_REQUEST,
        )

    @action(methods=["POST"], detail=True, url_path="decline-booking")
    def decline_booking(self, request, pk):
        booking = self.get_object()
        booking.decline(request.user)
        return DjradEntityResponse(deleted_entities={self.get_serializer_class(): [pk]})

    @action(methods=["POST"], detail=True, url_path="cancel-booking")
    def cancel_booking(self, request, pk):
        booking = self.get_object()
        booking.cancel(request.user, request.data["notes"])
        return DjradEntityResponse(deleted_entities={self.get_serializer_class(): [pk]})

    @action(methods=["POST"], detail=True, url_path="reinstate-booking")
    def reinstate_cancelled_booking(self, request, pk):
        booking = self.get_object()
        booking.reinstate_cancelled_booking(request.user)
        booking_serializer = BookingSerializer(booking)
        return DjradEntityResponse(booking_serializer)

    @action(methods=["POST"], detail=True, url_path="set-legacy-review-status")
    def set_legacy_review_status(self, request, pk):
        """Set review status on legacy booking

        Can be removed shortly after go live along with legacy_booking_status field
        """
        object = self.get_object()
        # Currently we only ignore bookings so hardcode it. It's only a status as
        # George discussed maybe having it as multiple so they could group bookings
        # by whether to follow up on them but wants to try with just ignore first.
        object.legacy_review_status = LegacyReviewStatus.DISMISSED
        object.save(is_legacy_import=True)
        return Response(self.get_serializer(instance=object).data)

    @action(methods=["POST"], detail=False, url_path="estimate-price")
    def estimate_price_new(self, request):
        return self._estimate_price(request)

    @action(methods=["GET"], detail=False, url_path="list-intensity")
    def get_booking_intensity(self, request):
        # we dont really care about anything but raw number of bookings, sort by booking time.
        result = {}

        today = timezone.localtime(timezone.now())
        today_start = datetime(today.year, today.month, today.day, tzinfo=today.tzinfo)
        result["today"] = (
            Booking.objects.exclude_unverified()
            .filter(
                travel_on__gte=today_start,
                travel_on__lt=today_start + timedelta(days=1),
            )
            .count()
        )

        if request.GET.get("from", None):
            dayfrom = make_aware(datetime.fromtimestamp(int(request.GET.get("from"))))
        else:
            dayfrom = today

        day_start = datetime(
            dayfrom.year, dayfrom.month, dayfrom.day, tzinfo=dayfrom.tzinfo
        )
        day_end = day_start + timedelta(days=7)

        counts = {}
        for hour, count in (
            Booking.objects.exclude_unverified()
            .filter(travel_on__gte=day_start, travel_on__lt=day_end)
            .annotate(hour=TruncHour("travel_on"))
            .values("hour")
            .annotate(count=Count("id"))
            .values_list("hour", "count")
        ):
            counts[f"{hour.date()}-{hour.hour}"] = count

        result["counts"] = counts

        return JsonResponse(result)

    @action(methods=["POST"], detail=True, url_path="estimate-price")
    def estimate_price_existing(self, request, pk):
        return self._estimate_price(request, self.get_object())

    def create(self, request, *args, **kwargs):
        # Strip out the flag indicating the user will next book a return
        request_return = request.data.pop("request_return", False)
        # Check the rest of the data
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        # Send the response returning the book return flag - the JS needs this for its handling
        headers = self.get_success_headers(serializer.data)
        return DjradEntityResponse(
            serializer,
            status=status.HTTP_201_CREATED,
            headers=headers,
            data={"request_return": request_return},
        )

    def _estimate_price(self, request, instance=None):
        serializer = self.serializer_class(
            instance=instance,
            data=request.data,
            price_estimate_only=True,
            context={"request": request},
        )
        # These fields we don't want to require for estimating a price - remove them
        for f in [
            "client_user",
            "passenger",
            "request_confirmation_email",
            "confirmation_email_user",
            "travel_on",
        ]:
            serializer.fields.pop(f)
        price_travel_on = None
        date = request.data.get("travel_on_date", None)
        time = request.data.get("travel_on_time", None)

        if date and time:
            date = datetime.strptime(date, "%Y-%m-%d").date()
            time = datetime.strptime(time, "%H:%M").time()
            price_travel_on = localtime(
                make_aware(timezone.datetime.combine(date, time))
            )

        if serializer.is_valid():
            (
                booking,
                additional_stops,
                price_variations,
                out_of_pocket_expenses,
            ) = serializer.validated_instances

            price_list = (
                booking.price_list
                if hasattr(booking, "price_list")
                else PriceList.get_current(travel_date=price_travel_on)
            )
            use_existing_breakdown = False
            if instance:
                use_existing_breakdown = not instance.should_recalculate_price()
            calculator = PriceCalculator(
                booking,
                price_list,
                additional_stops=[stop.address for stop in additional_stops],
                price_variations=price_variations,
                out_of_pockets=out_of_pocket_expenses,
                use_previous=use_existing_breakdown,
            )
            return Response(
                {"price": calculator.total(), "breakdown": calculator.price_breakdown()}
            )

        raise ValidationError(serializer.errors)

    @action(detail=False, methods=["GET"], url_path="sales-analysis-report")
    def sales_analysis_report(self, request):
        bookings = (
            self.filter_queryset(self.get_queryset())
            .filter(booking_status=BookingStatus.COMPLETED)
            .select_related("account")
        )
        bookings = (
            bookings.annotate(
                is_driver_collect=Case(
                    When(
                        booking_payment_method=BookingPaymentMethod.DRIVER_COLLECT,
                        then=Value(True),
                    ),
                    default=Value(False),
                    output_field=BooleanField(),
                )
            )
            .values(
                "account__account_no",
                "account__payment_terms",
                "account__payment_method",
                "account__account_nickname",
                "is_driver_collect",
            )
            .annotate(total=Sum("price_total"))
            .order_by("account__account_nickname", "account__account_no")
        )
        summary_data = OrderedDict(
            [
                (
                    (
                        AccountPaymentTermsType.THIRTY_DAYS,
                        AccountPaymentMethodType.INVOICE,
                    ),
                    {"label": "30 Day Invoice", "records": []},
                ),
                (
                    (
                        AccountPaymentTermsType.THIRTY_DAYS,
                        AccountPaymentMethodType.CREDIT_CARD,
                    ),
                    {"label": "EOM Credit Card", "records": []},
                ),
                (
                    (AccountPaymentTermsType.COD, AccountPaymentMethodType.CREDIT_CARD),
                    {"label": "CCOF", "records": []},
                ),
                ("Driver Collect", {"label": "Driver Collect", "records": []}),
            ]
        )

        for booking in bookings:
            if (
                booking["is_driver_collect"]
                or booking["account__payment_method"]
                == AccountPaymentMethodType.DRIVER_COLLECT
            ):
                key = "Driver Collect"
            else:
                key = (
                    booking["account__payment_terms"],
                    booking["account__payment_method"],
                )
            summary_data[key]["records"].append(
                dict(
                    account_no=booking["account__account_no"],
                    name=booking["account__account_nickname"],
                    total=booking["total"],
                )
            )
        for entry in summary_data.values():
            entry["total"] = sum([record["total"] for record in entry["records"]])
        return Response(list(summary_data.values()))


class BookingRegistration(ScbpAdminModelRegistration):
    viewset_class = BookingViewSet

    action_permissions = {
        **ScbpAdminModelRegistration.action_permissions,
        "list_legacy": ScbpAdminModelRegistration.action_permissions["list"],
        "list_unverified": ScbpAdminModelRegistration.action_permissions["list"],
        "list_intensity": ScbpAdminModelRegistration.action_permissions["list"],
        "job_list_report": ScbpAdminModelRegistration.action_permissions["list"],
        "sales_analysis_report": ScbpAdminModelRegistration.action_permissions["list"],
        "set_legacy_review_status": ScbpAdminModelRegistration.action_permissions[
            "update"
        ],
    }

    def get_filter_names(self, filters):
        filter_names = super().get_filter_names(filters)

        return [
            name for name in filter_names if name != "unverified_or_specified_bookings"
        ]

    def get_object_actions(self):
        return super().get_object_actions() + ["set_legacy_review_status"]

    def get_global_actions(self):
        return super().get_global_actions() + [
            "list_unverified",
            "list_intensity",
            "list_legacy",
            "job_list_report",
            "sales_analysis_report",
        ]


class BookingAddressViewSet(ScbpAdminModelViewSet):
    serializer_class = BookingAddressSerializer
    queryset = BookingAddress.objects.all()


class BookingAddressRegistration(ScbpAdminModelRegistration):
    viewset_class = BookingAddressViewSet


class BookingAdditionalStopViewSet(ScbpAdminModelViewSet):
    serializer_class = BookingAdditionalStopSerializer
    queryset = BookingAdditionalStop.objects.all()


class BookingAdditionalStopRegistration(ScbpAdminModelRegistration):
    viewset_class = BookingAdditionalStopViewSet


class BookingLogSerializer(BaseAddressSerializer):
    user = SerializerMethodField()
    created_at = SerializerMethodField()

    class Meta:
        model = BookingLog
        fields = ("user", "source", "description", "created_at")

    def get_user(self, instance):
        return str(instance.user)

    def get_created_at(self, instance):
        return timezone.localtime(instance.created_at).strftime("%d/%m/%y %H:%M")


class BookingLogFilterSet(ScbpFilterSet):
    class Meta:
        model = BookingLog
        fields = ("booking",)


class BookingLogViewSet(ScbpAdminModelViewSet):
    serializer_class = BookingLogSerializer
    queryset = BookingLog.objects.all().order_by("-created_at")
    filterset_class = BookingLogFilterSet

    def get_filter_paginator_class(*args, **kwargs):
        return None


class BookingLogRegistration(ScbpAdminModelRegistration):
    viewset_class = BookingLogViewSet


admin_site.register(Booking, BookingRegistration)
admin_site.register(BookingAddress, BookingAddressRegistration)
admin_site.register(BookingAdditionalStop, BookingAdditionalStopRegistration)
admin_site.register(BookingLog, BookingLogRegistration)
