from datetime import timedelta
from decimal import Decimal

from freezegun import freeze_time

from scbp_core.models import PriceVariationType
from scbp_core.models import RateScheduleType
from scbp_core.models.booking import BookingAddressType
from scbp_core.services.places import MELBOURNE_GPO_PLACE_ID
from scbp_core.tests.distance_mock_decorators import mock_raw_distance
from scbp_core.tests.factory.account import AccountFactory
from scbp_core.tests.factory.booking import AddressFactory
from scbp_core.tests.factory.booking import HourlyBookingFactory
from scbp_core.tests.factory.booking import OneWayBookingFactory
from scbp_core.tests.factory.pricing import BookingPriceVariationFactory
from scbp_core.tests.factory.user import ClientUserFactory
from scbp_core.tests.pricing.pricing_test_case import PricingTestCase

distances = {(MELBOURNE_GPO_PLACE_ID, "ChIJi7iHMsk41moR_7dXVxseiZ4"): Decimal("19.0")}


@freeze_time("2019-7-2")
@mock_raw_distance(distances)
class PriceVariationTestCase(PricingTestCase):
    def setUp(self):
        super().setUp()
        self.from_address = AddressFactory.create(
            source_id=MELBOURNE_GPO_PLACE_ID,
            formatted_address="350 Bourke St, Melbourne VIC 3000",
            postal_code="3000",
        )
        self.to_address = AddressFactory.create(
            source_id="ChIJi7iHMsk41moR_7dXVxseiZ4",
            formatted_address="234 Whitehorse Road, Nunawading VIC 3131",
            postal_code="3131",
        )
        creator = ClientUserFactory()
        account = AccountFactory()
        self.one_way_booking = OneWayBookingFactory(
            vehicle_class=self.vehicle_classes["Any Class"],
            account=account,
            created_by=creator,
            client_user=creator,
            from_address=self.from_address,
            from_address_type=BookingAddressType.CUSTOM,
            destination_address=self.to_address,
            destination_address_type=BookingAddressType.OFFICE,
        )
        self.hourly_booking = HourlyBookingFactory(
            vehicle_class=self.vehicle_classes["Any Class"],
            account=account,
            created_by=creator,
            client_user=creator,
            from_address=self.from_address,
            from_address_type=BookingAddressType.CUSTOM,
            hourly_booking_duration=timedelta(hours=1),
        )

    @staticmethod
    def price_variation_display(price_variations):
        return list(
            (
                PriceVariationType.choices[price_variation.variation_type],
                price_variation.amount,
            )
            for price_variation in price_variations
        )

    def test_hourly_without_PriceVariation(self):
        """
        Test here that the addition of PriceVariation doesn't break the rest of the algorithm
        First, that the calculation of pricing for partial bookings still works
        Second, that the calculation of pricing doesn't include PriceVariation unless they are actually present
        Expect $89.10
        """
        self.assert_price_breakdown_equals(
            self.hourly_booking,
            {
                "total": "89.10",
                "base": {
                    "time": "1:00",
                    "car_class": "0.00",
                    "first_hour": "88.00",
                    "subtotal": "88.00",
                },
                "fees": {"government": "1.10", "subtotal": "1.10"},
            },
        )
        self.hourly_booking.save()
        self.assert_price_breakdown_equals(
            self.hourly_booking,
            {
                "total": "89.10",
                "base": {
                    "time": "1:00",
                    "car_class": "0.00",
                    "first_hour": "88.00",
                    "subtotal": "88.00",
                },
                "fees": {"government": "1.10", "subtotal": "1.10"},
            },
        )

    def test_hourly_one_price_variation(self):
        """
        Test the addition of one price_variation to hourly bookings
        Expect $93.10
        """
        self.hourly_booking.save()

        price_variation = BookingPriceVariationFactory(
            amount=Decimal(10 * 0 + 4).quantize(Decimal("0.01")),
            booking=self.hourly_booking,
        )

        self.assert_price_breakdown_equals(
            self.hourly_booking,
            {
                "total": "93.10",
                "base": {
                    "time": "1:00",
                    "car_class": "0.00",
                    "first_hour": "88.00",
                    "subtotal": "88.00",
                },
                "fees": {"government": "1.10", "subtotal": "1.10"},
                "price_variations": {
                    "items": self.price_variation_display([price_variation]),
                    "subtotal": "4.00",
                },
            },
        )

    def test_hourly_multiple_PriceVariation(self):
        """
        Test the addition of multiple PriceVariation to hourly bookings
        Expect 209.10
        """
        self.hourly_booking.save()

        price_variations = [
            BookingPriceVariationFactory(
                amount=Decimal(10 * i + 4).quantize(Decimal("0.01")),
                booking=self.hourly_booking,
                variation_type=(i % 4) + 1,
            )
            for i in range(5)
        ]

        self.assert_price_breakdown_equals(
            self.hourly_booking,
            {
                "total": "209.10",
                "base": {
                    "time": "1:00",
                    "car_class": "0.00",
                    "first_hour": "88.00",
                    "subtotal": "88.00",
                },
                "fees": {"government": "1.10", "subtotal": "1.10"},
                "price_variations": {
                    "items": self.price_variation_display(price_variations),
                    "subtotal": "120.00",
                },
            },
        )

    def test_one_way_one_price_variation(self):
        """
        Test the addition of one price_variation to one-way bookings
        Expect $81.10
        """
        self.one_way_booking.save()

        price_variation = BookingPriceVariationFactory(
            amount=Decimal(10 * 0 + 4).quantize(Decimal("0.01")),
            booking=self.one_way_booking,
        )

        self.assert_price_breakdown_equals(
            self.one_way_booking,
            {
                "total": "81.10",
                "base": {
                    "distance": "19.0",
                    "car_class": "33.00",
                    "tier1": "15.00",
                    "tier2": "28.00",
                    "subtotal": "76.00",
                },
                "fees": {"government": "1.10", "subtotal": "1.10"},
                "price_variations": {
                    "items": self.price_variation_display([price_variation]),
                    "subtotal": "4.00",
                },
            },
        )

    def test_one_way_multiple_PriceVariation(self):
        """
        Test the addition of multiple PriceVariation to one-way bookings
        Expect $197.10
        """
        self.one_way_booking.save()

        price_variations = [
            BookingPriceVariationFactory(
                amount=Decimal(10 * i + 4).quantize(Decimal("0.01")),
                booking=self.one_way_booking,
                variation_type=(i % 4) + 1,
            )
            for i in range(5)
        ]

        self.assert_price_breakdown_equals(
            self.one_way_booking,
            {
                "total": "197.10",
                "base": {
                    "distance": "19.0",
                    "car_class": "33.00",
                    "tier1": "15.00",
                    "tier2": "28.00",
                    "subtotal": "76.00",
                },
                "fees": {"government": "1.10", "subtotal": "1.10"},
                "price_variations": {
                    "items": self.price_variation_display(price_variations),
                    "subtotal": "120.00",
                },
            },
        )

    def test_add_variations(self):
        """
        Test the addition of a price variation after initial save
        Expect $77.10, then $87.10, then $67.10
        """
        self.one_way_booking.save()
        self.assert_price_breakdown_equals(
            self.one_way_booking,
            {
                "total": "77.10",
                "base": {
                    "distance": "19.0",
                    "car_class": "33.00",
                    "tier1": "15.00",
                    "tier2": "28.00",
                    "subtotal": "76.00",
                },
                "fees": {"government": "1.10", "subtotal": "1.10"},
            },
        )
        self.one_way_booking.total_price = Decimal("77.10")
        self.one_way_booking.price_breakdown = {
            "total": "77.10",
            "base": {
                "distance": "19.0",
                "car_class": "33.00",
                "tier1": "15.00",
                "tier2": "28.00",
                "subtotal": "76.00",
            },
            "fees": {"government": "1.10", "subtotal": "1.10"},
        }
        self.one_way_booking.save()
        BookingPriceVariationFactory(
            amount=Decimal("10.00"),
            booking=self.one_way_booking,
            variation_type=PriceVariationType.OTHER,
        )
        second_breakdown = {
            "total": "87.10",
            "base": {
                "distance": "19.0",
                "car_class": "33.00",
                "tier1": "15.00",
                "tier2": "28.00",
                "subtotal": "76.00",
            },
            "fees": {"government": "1.10", "subtotal": "1.10"},
            "price_variations": {"items": [("Other", "10.00")], "subtotal": "10.00"},
        }
        self.assert_price_breakdown_equals(
            self.one_way_booking, second_breakdown, use_previous=True
        )
        self.one_way_booking.total_price = Decimal("87.10")
        self.one_way_booking.price_breakdown = second_breakdown
        self.one_way_booking.save()
        BookingPriceVariationFactory(
            amount=Decimal("-20.00"),
            booking=self.one_way_booking,
            variation_type=PriceVariationType.DISCOUNT,
        )
        self.assert_price_calculator_method_result(
            self.one_way_booking,
            method_name="_price_variations_breakdown",
            expected={
                "items": [("Other", Decimal("10.00")), ("Discount", Decimal("-20.00"))],
                "subtotal": Decimal("-10.00"),
            },
            calculator_kwargs={"use_previous": True},
        )
        self.assert_price_breakdown_equals(
            self.one_way_booking,
            {
                "total": "67.10",
                "base": {
                    "distance": "19.0",
                    "car_class": "33.00",
                    "tier1": "15.00",
                    "tier2": "28.00",
                    "subtotal": "76.00",
                },
                "fees": {"government": "1.10", "subtotal": "1.10"},
                "price_variations": {
                    "items": [("Other", "10.00"), ("Discount", "-20.00")],
                    "subtotal": "-10.00",
                },
            },
            use_previous=True,
        )

    def test_adjust_variations(self):
        """
        Test an example I found in testing the dispatch screen
        Expect $197.10, then $217.10, then $197.10
        """
        self.one_way_booking.total_price = Decimal("196.10")
        self.one_way_booking.price_breakdown = {
            "total": "197.1",
            "base": {
                "tier1": "40.00",
                "tier2": "150.00",
                "distance": "19.9",
                "subtotal": "196.00",
                "car_class": "6.00",
            },
            "fees": {"subtotal": "1.10", "government": "1.10"},
        }
        self.one_way_booking.save()
        BookingPriceVariationFactory(
            amount=Decimal("20.00"),
            booking=self.one_way_booking,
            variation_type=PriceVariationType.WAITING,
        )
        self.assert_price_calculator_method_result(
            self.one_way_booking,
            method_name="_price_variations_breakdown",
            expected={
                "items": [("Waiting", Decimal("20.00"))],
                "subtotal": Decimal("20.00"),
            },
            calculator_kwargs={"use_previous": True},
        )
        self.assert_price_breakdown_equals(
            self.one_way_booking,
            {
                "total": "217.10",
                "base": {
                    "tier1": "40.00",
                    "tier2": "150.00",
                    "distance": "19.9",
                    "subtotal": "196.00",
                    "car_class": "6.00",
                },
                "fees": {"subtotal": "1.10", "government": "1.10"},
                "price_variations": {
                    "items": [("Waiting", Decimal("20.00"))],
                    "subtotal": Decimal("20.00"),
                },
            },
            use_previous=True,
        )
        BookingPriceVariationFactory(
            amount=Decimal("-20.00"),
            booking=self.one_way_booking,
            variation_type=PriceVariationType.DISCOUNT,
        )
        self.assert_price_calculator_method_result(
            self.one_way_booking,
            method_name="_price_variations_breakdown",
            expected={
                "items": [
                    ("Waiting", Decimal("20.00")),
                    ("Discount", Decimal("-20.00")),
                ],
                "subtotal": Decimal("0.00"),
            },
            calculator_kwargs={"use_previous": True},
        )
        self.assert_price_breakdown_equals(
            self.one_way_booking,
            {
                "total": "197.10",
                "base": {
                    "tier1": "40.00",
                    "tier2": "150.00",
                    "distance": "19.9",
                    "subtotal": "196.00",
                    "car_class": "6.00",
                },
                "fees": {"subtotal": "1.10", "government": "1.10"},
                "price_variations": {
                    "items": [
                        ("Waiting", Decimal("20.00")),
                        ("Discount", Decimal("-20.00")),
                    ],
                    "subtotal": Decimal("0.00"),
                },
            },
            use_previous=True,
        )

    def test_adjust_variations_with_rate_schedule(self):
        """
        Test an example I found in testing the dispatch screen
        Note the use of rate schedule adjustment - that seems to be the key to the bug
        Expect $197.10, then $217.10, then $197.10
        """
        account = self.one_way_booking.account
        account.rate_schedule = RateScheduleType.RETAIL
        self.one_way_booking.total_price = Decimal("196.10")
        self.one_way_booking.price_breakdown = {
            "total": "197.1",
            "base": {
                "tier1": "40.00",
                "tier2": "150.00",
                "distance": "19.9",
                "subtotal": "196.00",
                "car_class": "6.00",
            },
            "fees": {"subtotal": "1.10", "government": "1.10"},
        }
        self.one_way_booking.save()
        BookingPriceVariationFactory(
            amount=Decimal("20.00"),
            booking=self.one_way_booking,
            variation_type=PriceVariationType.WAITING,
        )
        self.assert_price_calculator_method_result(
            self.one_way_booking,
            method_name="_price_variations_breakdown",
            expected={
                "items": [("Waiting", Decimal("20.00"))],
                "subtotal": Decimal("20.00"),
            },
            calculator_kwargs={"use_previous": True},
        )
        self.assert_price_breakdown_equals(
            self.one_way_booking,
            {
                "total": "217.10",
                "base": {
                    "tier1": "40.00",
                    "tier2": "150.00",
                    "distance": "19.9",
                    "subtotal": "196.00",
                    "car_class": "6.00",
                },
                "fees": {"subtotal": "1.10", "government": "1.10"},
                "price_variations": {
                    "items": [("Waiting", Decimal("20.00"))],
                    "subtotal": Decimal("20.00"),
                },
            },
            use_previous=True,
        )
        BookingPriceVariationFactory(
            amount=Decimal("-20.00"),
            booking=self.one_way_booking,
            variation_type=PriceVariationType.DISCOUNT,
        )
        self.assert_price_calculator_method_result(
            self.one_way_booking,
            method_name="_price_variations_breakdown",
            expected={
                "items": [
                    ("Waiting", Decimal("20.00")),
                    ("Discount", Decimal("-20.00")),
                ],
                "subtotal": Decimal("0.00"),
            },
            calculator_kwargs={"use_previous": True},
        )
        self.assert_price_breakdown_equals(
            self.one_way_booking,
            {
                "total": "197.10",
                "base": {
                    "tier1": "40.00",
                    "tier2": "150.00",
                    "distance": "19.9",
                    "subtotal": "196.00",
                    "car_class": "6.00",
                },
                "fees": {"subtotal": "1.10", "government": "1.10"},
                "price_variations": {
                    "items": [
                        ("Waiting", Decimal("20.00")),
                        ("Discount", Decimal("-20.00")),
                    ],
                    "subtotal": Decimal("0.00"),
                },
            },
            use_previous=True,
        )
