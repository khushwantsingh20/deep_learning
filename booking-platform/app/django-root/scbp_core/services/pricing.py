from datetime import timedelta
from decimal import Decimal
from decimal import ROUND_UP
from functools import lru_cache
import math
from typing import List
from typing import Optional

from django.db.models import Q
from django.db.models import Sum

from scbp_core.models import Booking
from scbp_core.models import BookingOutOfPocket
from scbp_core.models import BookingPriceVariation
from scbp_core.models import HourRateDayType
from scbp_core.models import on_place_update
from scbp_core.models import PriceList
from scbp_core.models import PriceVariationType
from scbp_core.models import RateScheduleType
from scbp_core.models import VehicleClassPriceList
from scbp_core.models.booking import BookingAddress
from scbp_core.models.booking import BookingAddressType
from scbp_core.models.booking import BookingType
from scbp_core.models.pricing import HourRateHourType
from scbp_core.models.pricing import HourRateType
from scbp_core.models.pricing import PriceAdjustment
from scbp_core.models.pricing import PriceOverride
from scbp_core.models.pricing import SpecialEvent
from scbp_core.services.distance_calculator import distance_between
from scbp_core.services.get_day_type import get_day_type
from scbp_core.services.places import MELBOURNE_GPO_ADDRESS
from scbp_core.services.places import MELBOURNE_GPO_PLACE_ID


class PriceCalculator:
    """
    Class for calculating the price given a booking and a price list.
    The Booking does not need to be complete, but must indicate whether the booking is hourly or one-way and
    the vehicle class for the booking. For hourly bookings, the duration is required.
    """

    # One way distance cutoffs in kilometres
    ONE_WAY_TIER1_START = Decimal(5)
    ONE_WAY_TIER2_START = Decimal(40)

    # -------------------------
    # Calculator initialization
    # -------------------------
    def __init__(
        self,
        booking: Booking,
        price_list: PriceList = None,
        *,
        additional_stops: List[BookingAddress] = None,
        price_variations: List[
            BookingPriceVariation
        ] = None,  # if passed, replaces existing price variations.
        out_of_pockets: List[
            BookingOutOfPocket
        ] = None,  # if passed, replaces existing out of pocket expenses.
        use_previous=None,
    ):
        """Booking price calculator

        :param booking: A booking instance to operate on. Can be a saved or unsaved record.
        :param price_list: The price list to use. If not specified reads price list from booking
        :param additional_stops: Additional stops to add to booking. When created a new booking
        this must be specified if any stops will be added to booking. For existing bookings if
        not provided will read currently linked stops from the booking.
        :param price_variations: Any price variations on the booking
        :param out_of_pockets: Any out of pockets on the booking
        :param use_previous: If True then no recalculations will be done on the core pricing and
        the previous values will be used. To this the current value of price variations & OOPs will
        be added. This should be set to True once the price has been locked in for a booking. If this
        value is None (the default) it will set this to the negation of `booking.should_recalculate_price`.
        """
        if use_previous is None:
            use_previous = not booking.should_recalculate_price()
        self._booking = booking
        self._price_list = price_list or booking.price_list
        self._vehicle_class_price = VehicleClassPriceList.objects.filter(
            price_list=self._price_list,
            vehicle_class=getattr(booking, "vehicle_class", None),
        ).first() or getattr(booking, "vehicle_class", None)

        self._price_variations = price_variations
        self._out_of_pockets = out_of_pockets
        if additional_stops is None and not self._booking._state.adding:
            additional_stops = self._booking.additional_stops.all()
        self._additional_stops = additional_stops or []
        self._previous_customer_breakdown = self._convert_breakdown(
            use_previous and self._booking.price_breakdown
        )
        self._previous_invoice_breakdown = self._convert_breakdown(
            use_previous and self._booking.invoice_breakdown
        )

    def _convert_breakdown(self, breakdown):
        """
        Converts string values to decimals to ensure proper return values for breakdowns
        No-op if None passed in
        :param breakdown: The raw breakdown as stored against the Booking model
        :return: The breakdown with almost all strings converted to decimals
        """
        if not breakdown:
            return None
        if isinstance(breakdown, list):
            return [(item[0], Decimal(item[1])) for item in breakdown]
        result = {}
        for key in breakdown:
            if key in ["time", "event_name"] or isinstance(breakdown[key], Decimal):
                result[key] = breakdown[key]
            elif isinstance(breakdown[key], str):
                result[key] = Decimal(breakdown[key])
            else:
                result[key] = self._convert_breakdown(breakdown[key])
        return result

    # -----------------
    # Distance/location
    # -----------------
    def _get_postcodes(self):
        start_postcode = end_postcode = None
        if getattr(self._booking, "from_address", None):
            start_postcode = self._booking.from_address.postal_code
        if getattr(self._booking, "destination_address", None):
            end_postcode = self._booking.destination_address.postal_code
        return start_postcode, end_postcode

    def _is_booking_out_of_area(self):
        """
        :return: True if the closer endpoint is more than out_of_area_boundary_km kilometres from Melbourne GPO
        """
        return (
            self._booking.from_address_type != BookingAddressType.AIRPORT
            and self._booking.destination_address_type != BookingAddressType.AIRPORT
            and self._closest_destination_distance()
            > self._price_list.out_of_area_boundary_km
        )

    def _closest_destination_distance(self):
        """
        :return: The distance from Melbourne GPO to the closer of the journey endpoints
        """
        distances = []
        if getattr(self._booking, "from_address", None):
            distances.append(
                distance_between(
                    self._booking.from_address.source_id,
                    MELBOURNE_GPO_PLACE_ID,
                    self._booking.from_address.formatted_address,
                    MELBOURNE_GPO_ADDRESS,
                    on_place_update=on_place_update,
                )
            )
        if getattr(self._booking, "destination_address", None):
            distances.append(
                distance_between(
                    self._booking.destination_address.source_id,
                    MELBOURNE_GPO_PLACE_ID,
                    self._booking.destination_address.formatted_address,
                    MELBOURNE_GPO_ADDRESS,
                    on_place_update=on_place_update,
                )
            )
        if distances:
            return min(distances)
        else:
            return Decimal(0)

    # -------------
    # Special event
    # -------------
    @lru_cache()
    def _event_for_booking(self):
        start_postcode, end_postcode = self._get_postcodes()
        location_query = SpecialEvent.objects
        if start_postcode and end_postcode:
            location_query = location_query.events_by_location(
                start=start_postcode, end=end_postcode
            )
        elif start_postcode:
            location_query = location_query.events_by_location(start=start_postcode)
        elif end_postcode:
            location_query = location_query.events_by_location(end=end_postcode)
        return (
            location_query.events_for_datetime(self._booking.travel_on)
            .order_by("-event_minimum_charge", "-event_surcharge")
            .first()
        )

    def _event_name(self):
        if self._event_for_booking():
            return self._event_for_booking().title
        return None

    def _event_minimum_base_charge(self):
        if self._event_for_booking():
            return self._event_for_booking().event_minimum_charge
        return Decimal(0)

    def _event_fee(self):
        if self._event_for_booking():
            return self._event_for_booking().event_surcharge
        return Decimal(0)

    # --------------
    # Price override
    # --------------
    @lru_cache()
    def _booking_price_override(self) -> Optional[PriceOverride]:
        account = getattr(self._booking, "account", None)
        from_postcode, to_postcode = self._get_postcodes()
        if not (from_postcode and to_postcode):
            return None
        overrides = PriceOverride.objects.overrides_for_account_and_postcodes(
            account=account, from_postcode=from_postcode, to_postcode=to_postcode
        ).filter(
            Q(
                start_time__lte=self._booking.travel_on.time(),
                end_time__gte=self._booking.travel_on.time(),
            )
            | Q(is_all_day=True)
        )
        if not overrides.exists():
            # If we have no overrides, return None (no override applies)
            return None
        elif overrides.count() == 1:
            # If we have exactly one override, return the one applicable override
            return overrides.first()
        # If we have more than one override, then we have exactly two thanks to the unique
        # constraints on PriceOverride - one with an account and one without. Favor the override
        # with a specific account
        return overrides.filter(account__isnull=False).first()

    # ----------------
    # Price adjustment
    # ----------------
    @lru_cache()
    def _booking_price_adjustment(self) -> Optional[PriceAdjustment]:
        from_postcode, to_postcode = self._get_postcodes()
        if not (from_postcode and to_postcode):
            return None
        return PriceAdjustment.objects.filter(
            from_postcode=from_postcode, to_postcode=to_postcode
        ).first()

    def _adjusted_one_way_price(self, base_price):
        if self._booking_price_override() or not self._booking_price_adjustment():
            return base_price
        percentage = self._booking_price_adjustment().percentage
        return (base_price * Decimal(100 + percentage) / Decimal(100)).quantize(
            Decimal("0.01")
        )

    # ----------------
    # Price variations
    # ----------------
    @lru_cache()
    def _price_variations_price(self):
        try:
            if self._price_variations:
                return sum(Decimal(v.amount) for v in self._price_variations)
            if not self._booking.id:
                return Decimal(0)
            return self._booking.price_variations.all().aggregate(
                total_amount=Sum("amount")
            )["total_amount"] or Decimal(0)
        except ValueError:
            # ValueError is raised if the booking is not saved
            return Decimal(0)

    def _price_variations_breakdown(self):
        if not self._price_variations and not self._booking.id:
            return None
        price_variations = (
            self._price_variations
            or self._booking.price_variations.all().order_by("pk")
        )
        if price_variations:
            return {
                "items": list(
                    (
                        PriceVariationType.choices[price_variation.variation_type],
                        price_variation.amount,
                    )
                    for price_variation in price_variations
                ),
                "subtotal": self._price_variations_price(),
            }
        else:
            return None

    # ----------------------
    # Out of pocket expenses
    # ----------------------
    @lru_cache()
    def _out_of_pockets_price(self):
        try:
            if self._out_of_pockets:
                return sum(Decimal(v.amount) for v in self._out_of_pockets)
            return self._booking.out_of_pockets.all().aggregate(
                total_amount=Sum("amount")
            )["total_amount"] or Decimal(0)
        except ValueError:
            # ValueError is raised if the booking is not saved
            return Decimal(0)

    def _out_of_pockets_breakdown(self):
        out_of_pockets = self._out_of_pockets or self._booking.out_of_pockets.all()
        if out_of_pockets:
            return {
                "items": list(
                    (out_of_pocket.description, out_of_pocket.amount)
                    for out_of_pocket in out_of_pockets
                ),
                "subtotal": self._out_of_pockets_price(),
            }
        else:
            return None

    # -----------
    # Time status
    # -----------
    def _day_type(self):
        return get_day_type(self._booking.travel_on.date())

    def _peak_status(self):
        hour = self._booking.travel_on.hour
        return HourRateType.get_hour_type_for(day_type=self._day_type(), hour=hour)

    def _with_peak_price(self, base_price):
        if (
            self._booking.booking_type == BookingType.ONE_WAY
            and not self._booking_price_override()
        ):
            if self._peak_status() == HourRateHourType.OFF_PEAK:
                return max(
                    (
                        base_price
                        * (
                            1
                            - self._price_list.off_peak_discount_percentage
                            / Decimal(100)
                        )
                    ).quantize(Decimal("0.01")),
                    self._price_list.off_peak_minimum_fee
                    + self._vehicle_class_price.min_hourly_surcharge_fixed,
                )
            elif self._peak_status() == HourRateHourType.PEAK:
                peak_surcharge = (
                    base_price * self._price_list.peak_percent / Decimal(100)
                ).quantize(Decimal("0.01"))
                return base_price + min(
                    peak_surcharge, self._price_list.peak_max_amount
                )
        return base_price

    def _out_of_hours_fee(self):
        if (
            self._booking.booking_type == BookingType.ONE_WAY
            and not self._booking_price_override()
        ):
            if self._peak_status() == HourRateHourType.OUT_OF_HOURS:
                return self._price_list.out_of_hours_fee
            elif self._peak_status() == HourRateHourType.HOLIDAY_OUT_OF_HOURS:
                return self._price_list.public_holiday_out_of_hours_fee
        return Decimal(0)

    def _holiday_fee(self):
        if (
            self._booking.booking_type == BookingType.ONE_WAY
            and not self._booking_price_override()
        ):
            if self._day_type() == HourRateDayType.HOLIDAY:
                return self._price_list.public_holiday_fee
        return Decimal(0)

    # ----
    # Fees
    # ----
    def _government_booking_fee(self):
        return self._price_list.government_booking_fee

    def _company_fee(self):
        if self._booking_price_override():
            return Decimal(0)
        return self._price_list.company_booking_fee

    def _airport_surcharge(self):
        if self._booking_price_override():
            return Decimal(0)
        if (
            self._booking.from_address_type == BookingAddressType.AIRPORT
            or self._booking.destination_address_type == BookingAddressType.AIRPORT
        ):
            return self._price_list.airport_surcharge
        return Decimal(0)

    def _airport_pickup_surcharge(self):
        if self._booking.from_address_type == BookingAddressType.AIRPORT:
            return self._price_list.airport_parking_fee
        return Decimal(0)

    def _out_of_area_surcharge(self):
        if self._is_booking_out_of_area():
            if self._booking.booking_type == BookingType.HOURLY:
                return self._one_way_base_price(
                    self._closest_destination_distance()
                    - self._price_list.out_of_area_boundary_km
                )
            else:
                return (
                    self._one_way_base_price(
                        self._closest_destination_distance()
                        + self._booking.get_distance(
                            additional_stops=self._additional_stops
                        )
                        - self._price_list.out_of_area_boundary_km
                    )
                    - self._one_way_base_price()
                )
        else:
            return Decimal(0)

    def _additional_stop_fee(self):
        if self._booking.booking_type == BookingType.ONE_WAY:
            return len(self._additional_stops) * self._price_list.additional_stop_fee
        return Decimal(0)

    def _fee_total(self):
        return (
            self._government_booking_fee()
            + self._airport_pickup_surcharge()
            + self._out_of_area_surcharge()
            + self._event_fee()
        )

    def _fee_breakdown(self):
        result = {"government": self._government_booking_fee()}
        if self._out_of_area_surcharge() > 0:
            result["out_of_area"] = self._out_of_area_surcharge()
        if self._airport_pickup_surcharge() > 0:
            result["airport_parking"] = self._airport_pickup_surcharge()
        if self._event_fee() > 0:
            result["event"] = self._event_fee()
        result["subtotal"] = self._fee_total()
        return result

    # -------
    # Options
    # -------
    def _options_price_data(self):
        wedding_ribbon_fee = Decimal(0)
        if self._booking.requires_wedding_ribbons:
            wedding_ribbon_fee = self._price_list.wedding_ribbon_fee
        car_seat_count = (
            self._booking.booster_seat_count
            + self._booking.forward_facing_baby_seat_count
            + self._booking.rear_facing_baby_seat_count
        )
        car_seat_fee = Decimal(0)
        if car_seat_count > 0:
            if self._vehicle_class_price.is_first_child_seat_free:
                car_seat_fee = (car_seat_count - 1) * self._price_list.child_seat_fee
            else:
                car_seat_fee = car_seat_count * self._price_list.child_seat_fee
        car_color_fee = Decimal(0)
        if getattr(self._booking, "vehicle_color", None):
            car_color_fee = self._price_list.color_selection_fee

        if self._booking.is_with_pass():
            car_park_pass_fee = self._price_list.car_park_pass_fee
        else:
            car_park_pass_fee = Decimal(0)

        result_dict = {
            "ribbon": wedding_ribbon_fee,
            "child_seats": car_seat_fee,
            "color": car_color_fee,
            "car_park_pass": car_park_pass_fee,
            "additional_stops": self._additional_stop_fee(),
        }

        for k in result_dict:
            result_dict[k] = self._apply_rate_schedule_adjustment(result_dict[k])

        return result_dict, car_seat_count

    def _options_price(self):
        result_dict, _ = self._options_price_data()
        return sum([value for _, value in result_dict.items()])

    def _options_breakdown(self):
        result_dict, car_seat_count = self._options_price_data()
        zero_options = [
            key
            for key in result_dict
            if result_dict[key] == 0
            and not (key == "child_seats" and car_seat_count > 0)
        ]
        for key in zero_options:
            result_dict.pop(key)
        if result_dict:
            result_dict["subtotal"] = self._options_price()
        return result_dict

    # -----------------
    # Hourly base price
    # -----------------
    def _block_size(self):
        return timedelta(minutes=self._price_list.block_size_minutes)

    def _hourly_tier1_start(self):
        return timedelta(hours=self._price_list.hourly_tier1_start_at)

    def _hourly_tier2_start(self):
        return timedelta(hours=self._price_list.hourly_tier2_start_at)

    def _hourly_periods_per_tier(self, duration):
        """
        Returns a list representing how many time blocks are spent in tiers 1 and 2
        :param duration: A timedelta object representing the length of the trip
        :return: [number of blocks spent in tier 1, number of blocks spent in tier 2]

        The calculation for tier 2 blocks is simple - take the duration, subtract
        the start of tier 2 to get the time spent in tier 2, divide by the block size
        to get a fractional number of blocks in tier 2, and round the number of blocks
        up to get a whole number of blocks in tier 2. Return this number if positive,
        zero otherwise.

        For tier 1, the calculation is similar, except that to account for tier 2, we
        take the lesser of the trip duration and the start of tier 2 as the initial duration.
        """
        return [
            max(
                math.ceil(
                    (
                        min(duration, self._hourly_tier2_start())
                        - self._hourly_tier1_start()
                    )
                    / self._block_size()
                ),
                0,
            ),
            max(
                math.ceil((duration - self._hourly_tier2_start()) / self._block_size()),
                0,
            ),
        ]

    def _hourly_first_hour_price(self):
        return self._price_list.hourly_initial_fee

    def _hourly_tier1_price(self, tier1_periods):
        return tier1_periods * self._price_list.hourly_tier1_rate_per_block

    def _hourly_tier2_price(self, tier2_periods):
        return tier2_periods * self._price_list.hourly_tier2_rate_per_block

    def _hourly_base_price(self):
        duration = self._booking.hourly_booking_duration
        periods_per_tier = self._hourly_periods_per_tier(duration)
        return (
            self._hourly_first_hour_price()
            + self._hourly_tier1_price(periods_per_tier[0])
            + self._hourly_tier2_price(periods_per_tier[1])
        )

    @staticmethod
    def _duration_to_str(duration: timedelta):
        raw_seconds = duration.total_seconds()
        hours, hour_seconds = divmod(raw_seconds, 3600)
        minutes, _ = divmod(hour_seconds, 60)
        return "%d:%02d" % (hours, minutes)

    def _hourly_base_breakdown(self):
        duration = self._booking.hourly_booking_duration
        periods_per_tier = self._hourly_periods_per_tier(duration)
        result = {
            "time": self._duration_to_str(duration),
            "first_hour": self._hourly_first_hour_price(),
            "subtotal": self._hourly_base_price(),
        }
        if self._hourly_tier1_price(periods_per_tier[0]) > 0:
            result["tier1"] = self._hourly_tier1_price(periods_per_tier[0])
        if self._hourly_tier2_price(periods_per_tier[1]) > 0:
            result["tier2"] = self._hourly_tier2_price(periods_per_tier[1])
        return result

    # ------------------
    # One-way base price
    # ------------------
    def _one_way_tier_price(self, *, tier):
        if self._peak_status() == HourRateHourType.OFF_PEAK:
            return getattr(
                self._vehicle_class_price, f"one_way_off_peak_rate_tier{tier}"
            )
        return getattr(self._vehicle_class_price, f"one_way_rate_tier{tier}")

    def _one_way_tier_prices(self, arg_distance=None):
        # Get the distance we're calculating the price for
        if arg_distance:
            raw_distance = arg_distance
        else:
            raw_distance = max(
                self._booking.get_distance(
                    additional_stops=self._additional_stops
                ).quantize(Decimal("0.1")),
                Decimal(1),
            )
        distance = max(raw_distance.quantize(Decimal(1)), Decimal(1))

        # Get the tier prices
        tier1_price = min(
            distance, self.ONE_WAY_TIER1_START
        ) * self._one_way_tier_price(tier=1)
        tier2_price = max(
            min(distance, self.ONE_WAY_TIER2_START) - self.ONE_WAY_TIER1_START,
            Decimal(0),
        ) * self._one_way_tier_price(tier=2)
        tier3_price = max(
            distance - self.ONE_WAY_TIER2_START, Decimal(0)
        ) * self._one_way_tier_price(tier=3)

        return raw_distance, tier1_price, tier2_price, tier3_price

    def _one_way_base_price(self, arg_distance=None):
        if self._booking_price_override():
            return self._booking_price_override().fixed_cost
        _, tier1_price, tier2_price, tier3_price = self._one_way_tier_prices(
            arg_distance
        )
        return tier1_price + tier2_price + tier3_price

    def _one_way_base_breakdown(self):
        distance, tier1_price, tier2_price, tier3_price = self._one_way_tier_prices()
        if self._booking_price_override():
            return {
                "distance": distance,
                "special": self._booking_price_override().fixed_cost,
                "subtotal": self._booking_price_override().fixed_cost,
            }
        result = {"distance": distance, "tier1": tier1_price}
        if tier2_price:
            result["tier2"] = tier2_price
        if tier3_price:
            result["tier3"] = tier3_price
        return result

    # ----------
    # Base price
    # ----------
    def _base_price(self):
        if self._booking.booking_type == BookingType.HOURLY:
            return self._hourly_base_price()
        else:
            return self._one_way_base_price()

    def _base_breakdown(self):
        if self._booking.booking_type == BookingType.HOURLY:
            result = self._hourly_base_breakdown()
        else:
            result = self._one_way_base_breakdown()
        base_price = self._base_price()
        vehicle_class_price = self._with_vehicle_class_price(base_price)
        timing_price = self._with_peak_price(vehicle_class_price)
        minimum_price = self._with_minimum_charge(timing_price)
        adjusted_price = self._adjusted_one_way_price(minimum_price)
        result["car_class"] = vehicle_class_price - base_price
        if timing_price - vehicle_class_price != 0:
            result["peak"] = timing_price - vehicle_class_price
        if adjusted_price - timing_price != 0:
            result["adjustment"] = adjusted_price - timing_price
        result["subtotal"] = adjusted_price
        if (
            not self._booking_price_override()
            and timing_price < self._event_minimum_base_charge()
        ):
            result = {
                key: value
                for key, value in result.items()
                if key in ["distance", "time"]
            }
            result["event_minimum"] = self._event_minimum_base_charge()
            result["subtotal"] = self._event_minimum_base_charge()

        for k in result:
            if k not in ["distance", "time"]:
                result[k] = self._apply_rate_schedule_adjustment(result[k])

        # Add the SC booking fee last - ensures rate schedule adjustments don't apply to it
        # but it gets folded into the basest of base price components
        if self._booking.booking_type == BookingType.HOURLY:
            result["first_hour"] += self._price_list.company_booking_fee
            result["subtotal"] += self._price_list.company_booking_fee
        elif "tier1" in result:
            result["tier1"] += self._price_list.company_booking_fee
            result["subtotal"] += self._price_list.company_booking_fee
        elif "event_minimum" in result:
            result["event_minimum"] += self._price_list.company_booking_fee
            result["subtotal"] += self._price_list.company_booking_fee

        # Airport surcharge
        if self._airport_surcharge() > 0:
            result["airport"] = self._airport_surcharge()
            result["subtotal"] += self._airport_surcharge()

        # Out of hours fee - handled here to avoid rate schedule adjustment
        if self._out_of_hours_fee():
            result["out_of_hours"] = self._out_of_hours_fee()
            result["subtotal"] += self._out_of_hours_fee()

        # Holiday fee - handled here to avoid rate schedule adjustment
        if self._holiday_fee():
            result["holiday_fee"] = self._holiday_fee()
            result["subtotal"] += self._holiday_fee()

        return result

    # -------------
    # Vehicle class
    # -------------
    def _with_vehicle_class_price(self, base_price):
        if self._booking.booking_type == BookingType.HOURLY:
            return self._with_vehicle_class_hourly_price(base_price)
        else:
            return self._with_vehicle_class_one_way_price(base_price)

    def _with_vehicle_class_hourly_price(self, base_price):
        return max(
            (1 + self._vehicle_class_price.min_hourly_surcharge_perc / 100)
            * base_price,
            base_price + self._vehicle_class_price.min_hourly_surcharge_fixed,
        ).quantize(Decimal("0.01"))

    def _with_vehicle_class_one_way_price(self, base_price):
        if self._booking_price_override():
            any_class_price = (
                VehicleClassPriceList.objects.filter(
                    price_list=self._price_list, vehicle_class__is_any_class=True
                )
                .first()
                .one_way_pickup_rate
            )
            return (
                base_price
                + self._vehicle_class_price.one_way_pickup_rate
                - any_class_price
            )
        elif self._peak_status() == HourRateHourType.OFF_PEAK:
            return base_price + self._vehicle_class_price.one_way_off_peak_pickup_rate
        return base_price + self._vehicle_class_price.one_way_pickup_rate

    # ----------------------
    # Minimum travel expense
    # ----------------------
    def _with_minimum_charge(self, vehicle_class_price):
        if self._booking.booking_type == BookingType.HOURLY:
            return vehicle_class_price
        else:
            return self._with_minimum_charge_one_way(vehicle_class_price)

    def _with_minimum_charge_one_way(self, vehicle_class_price):
        if self._booking_price_override():
            return vehicle_class_price
        elif self._peak_status() == HourRateHourType.OFF_PEAK:
            return max(
                vehicle_class_price,
                self._price_list.off_peak_minimum_fee
                + self._vehicle_class_price.min_hourly_surcharge_fixed,
            )
        elif self._peak_status() == HourRateHourType.SATURDAY_NIGHT:
            return max(
                vehicle_class_price,
                self._price_list.saturday_night_minimum_fee
                + self._vehicle_class_price.min_hourly_surcharge_fixed,
            )
        return max(
            vehicle_class_price,
            self._price_list.standard_minimum_fee
            + self._vehicle_class_price.min_hourly_surcharge_fixed,
        )

    # ------------------------
    # Rate schedule adjustment
    # ------------------------
    def _get_rate_schedule_adjustment(self):
        account = getattr(self._booking, "account", None)
        if not account:
            return Decimal(100)
        return Decimal(
            100
            + getattr(
                self._price_list, RateScheduleType.pricing_map[account.rate_schedule], 0
            )
        )

    def _apply_rate_schedule_adjustment(self, v):
        if not v:
            return Decimal(0)
        return (v * self._get_rate_schedule_adjustment() / Decimal(100)).quantize(
            Decimal("0.01")
        )

    # --------
    # Subtotal
    # --------
    def _total(self):
        if self._previous_customer_breakdown:
            return (
                self._previous_customer_breakdown.get("total", 0)
                - self._previous_customer_breakdown.get("price_variations", {}).get(
                    "subtotal", 0
                )
                - self._previous_customer_breakdown.get("out_of_pockets", {}).get(
                    "subtotal", 0
                )
                + self._price_variations_price()
                + self._out_of_pockets_price()
            )
        if self._booking.is_interstate():
            # Interstate bookings are charged a fixed handling fee to book via this platform.
            # Invoice from out-of-state provider is charged separately
            return (
                self._price_list.interstate_fee
                + self._price_variations_price()
                + self._out_of_pockets_price()
            )
        base_price = self._apply_rate_schedule_adjustment(
            self._adjusted_one_way_price(
                self._with_minimum_charge(
                    self._with_peak_price(
                        self._with_vehicle_class_price(self._base_price())
                    )
                )
            )
        )
        return (
            max([base_price, self._event_minimum_base_charge()])
            + self._out_of_hours_fee()
            + self._holiday_fee()
            + self._airport_surcharge()
            + self._company_fee()
            + self._options_price()
            + self._price_variations_price()
            + self._out_of_pockets_price()
            + self._fee_total()
        )

    # --------
    # Rounding
    # --------
    @staticmethod
    def _rounded_total(total):
        return total.quantize(Decimal("0.1"), ROUND_UP)

    def _rounding_amount(self):
        subtotal = self._total()
        return self._rounded_total(subtotal) - subtotal

    # --------------
    # Output methods
    # --------------
    def total(self):
        return self._rounded_total(self._total())

    def price_breakdown(self):
        """
        :return: The price breakdown for the booking and price list in the following tree
        structure (with unnecessary elements removed):
        - total
        - base (all except interstate bookings)
            - subtotal
            [CONDITIONAL FEES]
            - airport
            - peak (difference between normal and peak/off-peak cost)
            - out_of_hours (out of hours/holiday surcharge)
            [ONE WAY BOOKINGS]
            - distance (numeric - distance covered by booking)
            - car_class (difference between any class and given class cost)
            - tier1 (first 5km + any necessary amount to make up minimum price)
            - tier2 (5 through 40 km)
            - tier3 (beyond 40km)
            [ONE WAY BOOKINGS - PRICE OVERRIDE]
            - distance (numeric - distance covered by booking)
            - car_class (difference between any class and given class cost)
            - special (override price)
            [HOURLY BOOKINGS]
            - time (timedelta - hold duration)
            - car_class (difference between any class and given class cost)
            - first_hour
            - tier1 (Second through sixth hours)
            - tier2 (seventh hour plus)
            [ONE WAY EVENT BOOKINGS]
            - distance
            - event_minimum
            [HOURLY EVENT BOOKINGS]
            - time
            - event_minimum
        - options
            - subtotal
            - ribbon
            - child_seats
            - color
            - car_park_pass
            - additional_stops
        - price_variations
            - subtotal
            - items (List(variationType, amount))
        - out_of_pockets
            - subtotal
            - items (List(description, amount))
        - rounding
            - subtotal
            - rounding
        - fees
            - subtotal
            [INTERSTATE BOOKINGS]
            - interstate
            [ALL OTHER BOOKINGS]
            - government
            - out_of_area
            - airport_parking
            - event
        - event_name (string, name of applicable special event)

        """
        if self._previous_customer_breakdown:
            result = {**self._previous_customer_breakdown, "total": self.total()}
            if self._price_variations_breakdown():
                result["price_variations"] = self._price_variations_breakdown()
            elif "price_variations" in result:
                result.pop("price_variations")
            if self._out_of_pockets_breakdown():
                result["out_of_pockets"] = self._out_of_pockets_breakdown()
            elif "out_of_pockets" in result:
                result.pop("out_of_pockets")
            return result
        if self._booking.is_interstate():
            result = {
                "total": self.total(),
                "fees": {
                    "interstate": self._price_list.interstate_fee,
                    "subtotal": self._price_list.interstate_fee,
                },
            }
            if self._price_variations_breakdown():
                result["price_variations"] = self._price_variations_breakdown()
            if self._out_of_pockets_price():
                result["out_of_pockets"] = self._out_of_pockets_breakdown()
            return result
        result = {
            "total": self.total(),
            "base": self._base_breakdown(),
            "fees": self._fee_breakdown(),
        }
        rounding_amount = self._rounding_amount()
        if self._options_breakdown():
            result["options"] = self._options_breakdown()
        if self._price_variations_breakdown():
            result["price_variations"] = self._price_variations_breakdown()
        if self._out_of_pockets_price():
            result["out_of_pockets"] = self._out_of_pockets_breakdown()
        if rounding_amount:
            result["rounding"] = {
                "rounding": rounding_amount,
                "subtotal": rounding_amount,
            }
        if self._event_name():
            result["event_name"] = self._event_name()
        return result

    def invoice_breakdown(self):
        """
        :return: The driver breakdown sorted as follows:
        - booking_value
        - booking_fees (excluding company booking fee)
        - company_fee
        - out_of_pockets
        - driver_value (booking_value - (booking_fees + out_of_pockets))
        - time_surcharge (out of hours + special event)
        - waiting_charge (variations with type waiting)
        - variations_charge (variations not type waiting)
        - requests (options)
        - travel_charge (whatever's left after removing all of the above)
        """
        total = self.total()
        out_of_pocket = self._out_of_pockets_price()
        waiting_charge = sum(
            [
                variation.amount
                for variation in self._price_variations or []
                if variation.variation_type == PriceVariationType.WAITING
            ]
        ) or Decimal(0)
        variations_charge = sum(
            [
                variation.amount
                for variation in self._price_variations or []
                if variation.variation_type != PriceVariationType.WAITING
            ]
        ) or Decimal(0)

        if self._previous_invoice_breakdown:
            booking_fees = Decimal(self._previous_invoice_breakdown["booking_fees"])
            company_fee = Decimal(self._previous_invoice_breakdown["company_fee"])
            time_surcharge = Decimal(self._previous_invoice_breakdown["time_surcharge"])
            requests_charge = Decimal(self._previous_invoice_breakdown["requests"])
        else:
            if self._booking.is_interstate():
                booking_fees = self._price_list.interstate_fee
                company_fee = Decimal(0)
                time_surcharge = Decimal(0)
                requests_charge = Decimal(0)
            else:
                booking_fees = self._price_list.government_booking_fee
                company_fee = self._price_list.company_booking_fee
                time_surcharge = (
                    self._out_of_hours_fee() + self._holiday_fee() + self._event_fee()
                )
                requests_charge = self._options_price()

        return {
            "booking_value": total,
            "booking_fees": booking_fees,
            "company_fee": company_fee,
            "out_of_pocket": out_of_pocket,
            "driver_value": total - booking_fees - company_fee - out_of_pocket,
            "time_surcharge": time_surcharge,
            "waiting_charge": waiting_charge,
            "variations_charge": variations_charge,
            "requests": requests_charge,
            "travel_charge": total
            - sum(
                [
                    booking_fees,
                    company_fee,
                    out_of_pocket,
                    time_surcharge,
                    waiting_charge,
                    variations_charge,
                    requests_charge,
                ]
            ),
        }
