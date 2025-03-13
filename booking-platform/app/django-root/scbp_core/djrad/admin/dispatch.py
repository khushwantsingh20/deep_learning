from datetime import date
from datetime import timedelta
import re

from dateutil.relativedelta import relativedelta
from django.db.models import Sum
from django_filters import rest_framework as filters
from djrad_rest.util import DjradEntityResponse
from rest_framework import serializers
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from rest_framework.fields import SerializerMethodField
from rest_framework.generics import get_object_or_404
from rest_framework.response import Response

from scbp_core.djrad.admin import ScbpAdminBookingViewSet
from scbp_core.djrad.admin.base import ScbpAdminModelRegistration
from scbp_core.djrad.admin.base import ScbpAdminViewSetPermissions
from scbp_core.djrad.admin.booking import BookingSerializer
from scbp_core.djrad.admin.driver_user import DriverUserSerializer
from scbp_core.djrad.base import ScbpFilterSet
from scbp_core.djrad.sites import admin_site
from scbp_core.models import DriverUser
from scbp_core.models.booking import Booking
from scbp_core.models.booking_field_choices import BookingStatus
from scbp_core.services.booking_status_emails import send_booking_confirmation_email
from scbp_core.services.driver_url_token import generate_url_token
from scbp_core.services.pricing import PriceCalculator
from scbp_core.services.send_sms import send_sms
from scbp_core.services.send_to_driver import send_email

dispatch_booking_status_options = tuple(
    [
        choice
        for choice in BookingStatus.choices.items()
        if choice[0]
        not in [
            BookingStatus.UNVERIFIED,
            BookingStatus.CHANGED,
            BookingStatus.CANCELLED,
        ]
    ]
)


class DispatchDriverNumberField(serializers.SlugRelatedField):
    def __init__(self, **kwargs):
        super().__init__(slug_field="driver_no", source="driver", **kwargs)

    def get_attribute(self, instance):
        return instance.driver_number

    def get_queryset(self):
        return DriverUser.objects.only("driver_no")

    def to_representation(self, obj):
        return str(obj)


class DispatchBookingSerializer(BookingSerializer):
    account = SerializerMethodField()
    additional_stop_count = serializers.IntegerField(source="num_additional_stops")
    booking_priority = serializers.IntegerField()
    booking_value = serializers.DecimalField(
        source="driver_value", max_digits=10, decimal_places=2, read_only=True
    )
    car = serializers.CharField()
    client_phone_number = SerializerMethodField()
    dispatch_category = serializers.CharField()
    display_booking_status = SerializerMethodField()
    driver_number = DispatchDriverNumberField(allow_null=True, required=False)
    from_suburb = serializers.CharField()
    hourly_booking_duration = SerializerMethodField()
    options = SerializerMethodField()
    passenger_name = serializers.CharField(source="computed_passenger_name")
    pay = SerializerMethodField()
    to_suburb = serializers.CharField()

    booking_status = serializers.ChoiceField(choices=dispatch_booking_status_options)
    request_confirmation_email = serializers.BooleanField(default=False)
    prepay = serializers.ReadOnlyField(default=False)

    account__related_number = serializers.CharField(
        source="account.account_no", read_only=True
    )

    class Meta:
        model = Booking
        fields = BookingSerializer.Meta.fields + (
            "from_suburb",
            "to_suburb",
            "account_id",
            "options",
            "passenger_name",
            "client_phone_number",
            "car",
            "booking_priority",
            "convoy_number",
            "run_number",
            "pay",
            "dispatch_category",
            "display_booking_status",
            "booking_value",
            "driver_number",
            "additional_stop_count",
            "account__related_number",
            "is_managed_in_legacy",
            "legacy_price_breakdown",
            "price_breakdown",
        )

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._previous_travel_on = None
        if self.instance and isinstance(self.instance, Booking):
            self._previous_travel_on = self.instance.travel_on

    def get_options(self, instance):
        options = []
        if instance.vehicle_color_id:
            options.append(instance.vehicle_color_abbreviation)
        if instance.booster_seat_count > 0:
            options.append(f"BSTx{instance.booster_seat_count}")
        if instance.forward_facing_baby_seat_count > 0:
            options.append(f"FWDx{instance.forward_facing_baby_seat_count}")
        if instance.rear_facing_baby_seat_count > 0:
            options.append(f"REARx{instance.rear_facing_baby_seat_count}")
        if instance.requires_wedding_ribbons:
            options.append("RIBBON")
        if instance.requires_car_park_pass:
            options.append("BHP")
        if instance.requested_driver:
            options.append(
                f"{instance.requested_driver.driver_no} - {instance.requested_driver.first_name}"
            )

        return ", ".join(options)

    def get_hourly_booking_duration(self, instance):
        if instance.hourly_booking_duration:
            hours, sub_hour = divmod(
                instance.hourly_booking_duration, timedelta(hours=1)
            )
            minutes = sub_hour // timedelta(minutes=1)
            return f"{hours}:{minutes}"
        return ""

    def get_account(self, instance):
        return f"{instance.account.account_no} - {instance.account.account_nickname}"

    def get_display_booking_status(self, instance):
        return BookingStatus.choices[instance.booking_status]

    def get_client_phone_number(self, instance):
        if instance.client_user:
            return instance.client_user.contact_phone

    def get_pay(self, instance):
        return instance.get_short_payment_type()

    def update(self, instance, validated_data):
        if "price_variations" not in validated_data:
            validated_data["price_variations"] = [
                {
                    "variation_type": pv.variation_type,
                    "amount": pv.amount,
                    "id": pv.pk,
                    "variation_type_other_description": pv.variation_type_other_description,
                }
                for pv in instance.price_variations.all()
            ]
        if "out_of_pockets" not in validated_data:
            validated_data["out_of_pockets"] = [
                {"id": oop.pk, "description": oop.description, "amount": oop.amount}
                for oop in instance.out_of_pockets.all()
            ]
        # Determine whether the price variation total has changed requiring a new breakdown
        sum_existing_variations = (
            instance.price_variations.aggregate(Sum("amount"))["amount__sum"] or 0
        )
        sum_new_variations = sum(
            [
                variation["amount"]
                for variation in validated_data.get("price_variations", [])
            ]
        )

        # Determine whether the out of pocket expense total has changed requiring a new breakdown
        sum_existing_out_of_pockets = (
            instance.out_of_pockets.aggregate(Sum("amount"))["amount__sum"] or 0
        )
        sum_new_out_of_pockets = sum(
            [
                out_of_pocket["amount"]
                for out_of_pocket in validated_data.get("out_of_pockets", [])
            ]
        )

        # If travel time has changed we have to recalculate price
        travel_time_changed = (
            self._previous_travel_on
            and validated_data.get("travel_on")
            and self._previous_travel_on != validated_data.get("travel_on")
        )

        # If either of the expense fields has changed in total value, update the price and breakdown
        # This recalculates the booking value displayed on the dispatch screen
        if (
            travel_time_changed
            or (sum_existing_variations != sum_new_variations)
            or (sum_existing_out_of_pockets != sum_new_out_of_pockets)
        ):
            # Note that use_previous is True unless travel time has changed. If the case of a travel
            # time change we have to recalculate the entire price - otherwise we use the existing values
            # and only recalculate the price changes from variations / OOPs
            price_calculator = PriceCalculator(
                instance, instance.price_list, use_previous=not travel_time_changed
            )
            validated_data["price_total"] = price_calculator.total()
            validated_data["price_breakdown"] = price_calculator.price_breakdown()
        if validated_data.get("dropoff_time") and not validated_data.get(
            "pickup_time", instance.pickup_time
        ):
            validated_data["pickup_time"] = instance.travel_on
        return super().update(instance, validated_data, use_existing_breakdown=True)


class SendToDriverSerializer(serializers.Serializer):
    email = serializers.EmailField(allow_blank=True)
    # Esendex supports splitting messages with an upper bound of 600 characters
    message = serializers.CharField(min_length=1, max_length=600)
    mobile = serializers.CharField(max_length=20, allow_blank=True)
    subject = serializers.CharField(min_length=1, max_length=60, allow_blank=True)
    type = serializers.ChoiceField(["email", "sms"])

    def validate_mobile(self, mobile):
        if not re.search(r"^[\d -]+$", mobile):
            raise serializers.ValidationError(
                "Mobile must consist only of numbers, spaces, and dashes"
            )
        return mobile

    def validate(self, data):
        # Verify that we have the correct recipient information
        if data["type"] == "email":
            if not data.get("email", None):
                raise serializers.ValidationError(
                    "Email address must be provided for sending email"
                )
            if not data.get("subject", None):
                raise serializers.ValidationError(
                    "Subject must be provided for sending email"
                )
        if data["type"] == "sms" and not data.get("mobile"):
            raise serializers.ValidationError(
                "Mobile number must be provided for sending SMS"
            )
        return data

    def save(self):
        assert hasattr(
            self, "_errors"
        ), "You must call `.is_valid()` before calling `.save()`."

        assert (
            not self.errors
        ), "You cannot call `.save()` on a serializer with invalid data."

        assert not hasattr(self, "_data"), (
            "You cannot call `.save()` after accessing `serializer.data`."
            "If you need to access data before committing to the database then "
            "inspect 'serializer.validated_data' instead. "
        )

        send_type = self.validated_data["type"]
        if send_type == "email":
            send_email(
                email=self.validated_data["email"],
                subject=self.validated_data["subject"],
                message=self.validated_data["message"],
            )
        else:  # if send_type == 'sms'
            send_sms(
                mobile=self.validated_data["mobile"],
                message=self.validated_data["message"],
            )


class DispatchBookingStatusFilter(filters.MultipleChoiceFilter):
    def __init__(self, *args, **kwargs):
        self.valid_statuses = dispatch_booking_status_options
        kwargs["choices"] = getattr(
            kwargs,
            "choices",
            (("All", "All"), ("Active", "Active")) + self.valid_statuses,
        )
        super().__init__(*args, **kwargs)

    def filter(self, qs, value):
        final_values = set(value)
        if "All" in final_values:
            final_values.discard("All")
            for choice in self.valid_statuses:
                final_values.add(str(choice[0]))
        if "Active" in final_values:
            final_values.discard("Active")
            for choice in self.valid_statuses:
                if "Completed" not in choice[1]:
                    final_values.add(str(choice[0]))
        return super().filter(qs, final_values)


class DispatchInterstateFilter(filters.Filter):
    def filter(self, qs, value):
        if value in ("false", "False", False):
            return qs.filter(is_booking_interstate=False)
        return qs


class TravelRangeTooBroadError(ValidationError):
    pass


class DispatchTravelDateFilter(filters.DateFromToRangeFilter):
    @staticmethod
    def is_invalid_filter_value(value):
        if value:
            sdate = value.start
            edate = value.stop
        return (
            not value
            or not sdate
            or not edate
            or edate >= sdate + relativedelta(days=31)
        )

    def filter(self, qs, value):
        if self.is_invalid_filter_value(value):
            raise TravelRangeTooBroadError(
                "Date range is too broad. Please limit to at most 31 days."
            )
        return super().filter(qs, value)


class DispatchFilterSet(ScbpFilterSet):
    travel_date = DispatchTravelDateFilter(field_name="travel_on__date")
    booking_status = DispatchBookingStatusFilter()
    interstate = DispatchInterstateFilter()

    class Meta:
        model = Booking
        fields = ("travel_date", "booking_status", "interstate")


class DispatchRangeCountFilterSet(ScbpFilterSet):
    """
    This class exists for the sole purpose of collecting the number of bookings matching the given
    date range filter.
    """

    travel_date = filters.DateFromToRangeFilter(field_name="travel_on__date")

    class Meta:
        model = Booking
        fields = ("travel_date",)


class DispatchViewSetPermissions(ScbpAdminViewSetPermissions):
    actions_to_perms_map = {
        "send_to_driver": ScbpAdminViewSetPermissions.default_actions_to_perms_map[
            "update"
        ],
        "get_driver": ScbpAdminViewSetPermissions.default_actions_to_perms_map[
            "update"
        ],
        "associated_email_addresses": ["%(app_label)s.detail_%(model_name)s"],
        "send_confirmation_email": ["%(app_label)s.detail_%(model_name)s"],
        "decline_booking": ["%(app_label)s.delete_%(model_name)s"],
        "complete_booking": ["%(app_label)s.change_%(model_name)s"],
        "cancel_booking": ["%(app_label)s.delete_%(model_name)s"],
    }


class DispatchViewSet(ScbpAdminBookingViewSet):
    serializer_class = DispatchBookingSerializer
    filterset_class = DispatchFilterSet
    permission_classes = (DispatchViewSetPermissions,)
    queryset = (
        Booking.objects.exclude_unverified().dispatch_annotations().sort_by_interstate()
    )
    ordering_fields = (
        "booking_number",
        "travel_on",
        ("passenger_name", "computed_passenger_name"),
        "from_suburb",
        "to_suburb",
        "booking_priority",
        "passenger_count",
        "convoy_number",
        ("car", ("vehicle_class__is_any_class", "vehicle_class__abbreviation")),
        (
            "options",
            (
                "requires_car_park_pass",
                "requires_wedding_ribbons",
                "rear_facing_baby_seat_count",
                "forward_facing_baby_seat_count",
                "booster_seat_count",
                "vehicle_color_present",
            ),
        ),
        "run_number",
        ("driver_number", ("driver__driver_no", "travel_on")),
        ("display_booking_status", "booking_status"),
    )

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop("partial", False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        # Refetch instance so annotations etc added correctly
        instance = self.get_object()

        return Response(self.get_serializer(instance).data)

    def count_for_travel_date(self):
        """
        Only used to obtain the number of bookings for the date range
        :return: The number of bookings in the queryset matching the date range - all other filters are ignored
        """
        request = self.request
        query_params = {
            "travel_date_after": request.query_params.get(
                "travelDate_after", date.today()
            ),
            "travel_date_before": request.query_params.get(
                "travelDate_before", date.today()
            ),
        }

        return DispatchRangeCountFilterSet(
            query_params, queryset=self.get_queryset(), request=request
        ).qs.count()

    def get_object(self):
        """
        Returns the object the view is displaying.

        Override because performing filter_queryset in this function
        results in None for the date range, which now returns a null
        queryset (and thus a 404 error) as well as to prefetch
        related models required for the detail view

        (Mostly) Copied from rest_framework/generics.py
        """
        queryset = self.get_queryset().dispatch_select_related()

        # Perform the lookup filtering.
        lookup_url_kwarg = self.lookup_url_kwarg or self.lookup_field

        assert lookup_url_kwarg in self.kwargs, (
            "Expected view %s to be called with a URL keyword argument "
            'named "%s". Fix your URL conf, or set the `.lookup_field` '
            "attribute on the view correctly."
            % (self.__class__.__name__, lookup_url_kwarg)
        )

        filter_kwargs = {self.lookup_field: self.kwargs[lookup_url_kwarg]}
        obj = get_object_or_404(queryset, **filter_kwargs)

        # May raise a permission denied
        self.check_object_permissions(self.request, obj)

        return obj

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        serializer = self.get_serializer(queryset, many=True)

        return DjradEntityResponse(
            serializer,
            data={
                "range_booking_count": self.count_for_travel_date(),
                "filtered_booking_count": queryset.count(),
            },
        )

    @action(methods=["post"], detail=True)
    def send_to_driver(self, request, pk):
        booking = self.get_object()
        serializer = SendToDriverSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        booking.booking_status = BookingStatus.OFFERED
        booking.save()
        booking_serializer = DispatchBookingSerializer(booking)
        return DjradEntityResponse(booking_serializer)

    @action(methods=["POST"], detail=True, url_path="decline-booking")
    def decline_booking(self, request, pk):
        booking = self.get_object()
        booking.decline(request.user)
        return DjradEntityResponse(deleted_entities={self.get_serializer_class(): [pk]})

    @action(methods=["POST"], detail=True, url_path="complete-booking")
    def complete_booking(self, request, pk):
        booking = self.get_object()
        booking.booking_status = BookingStatus.COMPLETED
        booking.save()
        booking_serializer = DispatchBookingSerializer(booking)
        return DjradEntityResponse(booking_serializer)

    @action(methods=["POST"], detail=True, url_path="cancel-booking")
    def cancel_booking(self, request, pk):
        booking = self.get_object()
        booking.cancel(request.user, request.data.get("notes", None))
        return DjradEntityResponse(deleted_entities={self.get_serializer_class(): [pk]})

    @action(methods=["get"], detail=True)
    def get_driver(self, request, pk):
        booking = self.get_object()
        driver = booking.driver
        if driver:
            url_token = generate_url_token(booking, driver)
        else:
            url_token = ""
        return DjradEntityResponse(
            DriverUserSerializer(driver), data={"url_token": url_token}
        )

    @action(methods=["GET"], detail=True, url_path="associated-email-addresses")
    def associated_email_addresses(self, request, pk):
        """Get email addresses associated with invoice

        This is used to allow email address to be selected when sending an invoice email.

        Lists account email, client user email from booking & any other client users
        associated with the account.
        """
        booking = self.get_object()
        account = booking.account
        account_members = []
        for atoc in account.account_to_client.all():
            account_members.append(
                (atoc.client_user.get_full_name(), atoc.client_user.email)
            )
        emails = [
            (
                f"Account Contact for {account.account_nickname}",
                [
                    (
                        " ".join(
                            [account.contact_first_name, account.contact_last_name]
                        ),
                        account.account_email,
                    )
                ],
            ),
            (
                "Client from Booking",
                [(booking.client_user.get_full_name(), booking.client_user.email)],
            ),
            ("Other Account Members", account_members),
        ]
        return Response(emails)

    @action(methods=["POST"], detail=True, url_path="send-confirmation-email")
    def send_confirmation_email(self, request, pk):
        email = request.data.get("email")
        send_booking_confirmation_email(self.get_object(), email)
        return Response()


class DispatchRegistration(ScbpAdminModelRegistration):
    viewset_class = DispatchViewSet
    registration_id = "scbp_core.dispatch"
    url_base = "scbp_core.dispatch"
    api_route_prefix = "scbp_core.dispatch"
    label = "Dispatch"
    label_plural = "Dispatch"

    action_permissions = {
        **ScbpAdminModelRegistration.action_permissions,
        "send_to_driver": ScbpAdminModelRegistration.action_permissions["update"],
        "get_driver": ScbpAdminModelRegistration.action_permissions["update"],
    }

    def get_object_actions(self):
        return super().get_object_actions() + ["send_to_driver", "get_driver"]


admin_booking_registration = admin_site.register(Booking, DispatchRegistration)
