from datetime import datetime
from decimal import Decimal

from django.utils.timezone import make_aware

from scbp_core.models import PriceVariationType
from scbp_core.models import RateScheduleType
from scbp_core.services.places import MELBOURNE_GPO_PLACE_ID
from scbp_core.tests.distance_mock_decorators import test_case_mock_distance_to_gpo
from scbp_core.tests.factory.account import AccountFactory
from scbp_core.tests.factory.booking import AddressFactory
from scbp_core.tests.factory.booking import OneWayBookingFactory
from scbp_core.tests.factory.pricing import BookingPriceVariationFactory
from scbp_core.tests.factory.user import ClientUserFactory
from scbp_core.tests.pricing.pricing_test_case import PricingTestCase


@test_case_mock_distance_to_gpo
class RateScheduleTestCase(PricingTestCase):
    def setUp(self):
        super().setUp()
        self.from_address = AddressFactory.create(
            formatted_address="234 Whitehorse Rd, Nunawading VIC 3131",
            source_id="ChIJi7iHMsk41moR_7dXVxseiZ4",
            postal_code="3131",
        )
        self.to_address = AddressFactory.create(
            formatted_address="Melbourne's GPO, 350 Bourke St, Melbourne VIC 3000",
            source_id=MELBOURNE_GPO_PLACE_ID,
            postal_code="3000",
        )
        creator = ClientUserFactory()
        self.booking_account = AccountFactory()
        self.other_account = AccountFactory()
        """
        Standard booking for one-way tests
        From 234 Whiteforce Rd, Nunawading VIC 3131
        To Melbourne GPO, 350 Bourke St, Melbourne VIC 3000
        At 11:00 AM on Wednesday, 17 July 2019 (Off-peak)
        Distance mocked to 19.0 km
        Any Class
        """
        self.booking = OneWayBookingFactory(
            account=self.booking_account,
            created_by=creator,
            client_user=creator,
            vehicle_class=self.vehicle_classes["Any Class"],
            from_address=self.from_address,
            destination_address=self.to_address,
            travel_on=make_aware(datetime(year=2019, month=7, day=17, hour=11)),
        )
        self.mock_distance(self.booking, "19.0")

    def test_account_rate_schedule_standard_no_adjustment(self):
        self.assert_price_breakdown_equals(
            self.booking,
            {
                "total": "56.40",
                "base": {
                    "distance": "19.0",
                    "tier1": "11.00",
                    "tier2": "25.20",
                    "car_class": "22.00",
                    "peak": "-2.91",
                    "subtotal": "55.29",
                },
                "fees": {"government": "1.10", "subtotal": "1.10"},
                "rounding": {"rounding": "0.01", "subtotal": "0.01"},
            },
        )

    def test_account_rate_schedule_applied_to_base_and_not_fees(self):
        self.booking_account.rate_schedule = RateScheduleType.RETAIL
        self.booking_account.save()

        self.assert_price_breakdown_equals(
            self.booking,
            {
                "total": "62.00",
                "base": {
                    "distance": "19.0",
                    "tier1": "12.10",
                    "tier2": "27.72",
                    "car_class": "24.20",
                    "peak": "-3.20",
                    "subtotal": "60.82",
                },
                "fees": {"government": "1.10", "subtotal": "1.10"},
                "rounding": {"rounding": "0.08", "subtotal": "0.08"},
            },
        )

    def test_account_rate_schedule_not_applied_to_variations(self):
        self.booking_account.rate_schedule = RateScheduleType.RETAIL
        self.booking_account.save()

        self.booking.save()
        BookingPriceVariationFactory.create(
            amount=Decimal(20),
            booking=self.booking,
            variation_type=PriceVariationType.WAITING,
        )

        self.assert_price_breakdown_equals(
            self.booking,
            {
                "total": "82.0",
                "base": {
                    "distance": "19.0",
                    "tier1": "12.10",
                    "tier2": "27.72",
                    "car_class": "24.20",
                    "peak": "-3.20",
                    "subtotal": "60.82",
                },
                "fees": {"government": "1.10", "subtotal": "1.10"},
                "price_variations": {
                    "items": [("Waiting", "20.00")],
                    "subtotal": "20.00",
                },
                "rounding": {"rounding": "0.08", "subtotal": "0.08"},
            },
        )
