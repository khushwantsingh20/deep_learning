from datetime import datetime
from decimal import Decimal

from django.utils.timezone import make_aware

from scbp_core.models import RateScheduleType
from scbp_core.tests.distance_mock_decorators import test_case_mock_distance_to_gpo
from scbp_core.tests.factory.account import AccountFactory
from scbp_core.tests.factory.booking import AddressFactory
from scbp_core.tests.factory.booking import OneWayBookingFactory
from scbp_core.tests.factory.user import ClientUserFactory
from scbp_core.tests.pricing.pricing_test_case import PricingTestCase


@test_case_mock_distance_to_gpo
class CompanyBookingFeeTestCase(PricingTestCase):
    def test_default_fee(self):
        """
        - One way
            - From 234 Whitehorse Rd, Nunawading VIC 3131 (place ID ChIJi7iHMsk41moR_7dXVxseiZ4)
            - To Melbourne's GPO, 350 Bourke St, Melbourne VIC 3000 (place ID ChIJlVWPC7VC1moRwANVqtx_3eQ)
            - 19.0km
        - Standard hours
        - Luxury Sedan
        Expect $104.70
        """
        booking = OneWayBookingFactory(
            vehicle_class=self.vehicle_classes["Luxury Sedan"],
            from_address=AddressFactory(source_id="ChIJi7iHMsk41moR_7dXVxseiZ4"),
            destination_address=AddressFactory(source_id="ChIJlVWPC7VC1moRwANVqtx_3eQ"),
        )
        self.mock_distance(booking, "19.0")
        self.assert_price_breakdown_equals(
            booking,
            {
                "total": "104.70",
                "base": {
                    "distance": "19.0",
                    "tier1": "15.00",
                    "tier2": "33.60",
                    "car_class": "55.00",
                    "subtotal": "103.60",
                },
                "fees": {"government": "1.10", "subtotal": "1.10"},
            },
        )

    def test_added_fee(self):
        """
        - One way
            - From 234 Whitehorse Rd, Nunawading VIC 3131 (place ID ChIJi7iHMsk41moR_7dXVxseiZ4)
            - To Melbourne's GPO, 350 Bourke St, Melbourne VIC 3000 (place ID ChIJlVWPC7VC1moRwANVqtx_3eQ)
            - 19.0km
        - Standard hours
        - Luxury Sedan
        - Company fee set at $10.00
        Expect $114.70
        """
        booking = OneWayBookingFactory(
            vehicle_class=self.vehicle_classes["Luxury Sedan"],
            from_address=AddressFactory(source_id="ChIJi7iHMsk41moR_7dXVxseiZ4"),
            destination_address=AddressFactory(source_id="ChIJlVWPC7VC1moRwANVqtx_3eQ"),
        )
        with self.update_price_list() as price_list:
            price_list.company_booking_fee = Decimal("10.00")
        self.mock_distance(booking, "19.0")
        self.assert_price_breakdown_equals(
            booking,
            {
                "total": "114.70",
                "base": {
                    "distance": "19.0",
                    "tier1": "25.00",
                    "tier2": "33.60",
                    "car_class": "55.00",
                    "subtotal": "113.60",
                },
                "fees": {"government": "1.10", "subtotal": "1.10"},
            },
        )

    def test_added_fee_atop_rate_schedule(self):
        creator = ClientUserFactory()
        booking_account = AccountFactory()
        booking_account.rate_schedule = RateScheduleType.RETAIL
        booking_account.save()
        booking = OneWayBookingFactory(
            account=booking_account,
            created_by=creator,
            client_user=creator,
            vehicle_class=self.vehicle_classes["Any Class"],
            from_address=AddressFactory(source_id="ChIJi7iHMsk41moR_7dXVxseiZ4"),
            destination_address=AddressFactory(source_id="ChIJlVWPC7VC1moRwANVqtx_3eQ"),
            travel_on=make_aware(datetime(year=2019, month=7, day=17, hour=11)),
        )
        self.mock_distance(booking, "19.0")

        with self.update_price_list() as price_list:
            price_list.company_booking_fee = Decimal("10.00")

        self.assert_price_breakdown_equals(
            booking,
            {
                "total": "72.00",
                "base": {
                    "distance": "19.0",
                    "tier1": "22.10",
                    "tier2": "27.72",
                    "car_class": "24.20",
                    "peak": "-3.20",
                    "subtotal": "70.82",
                },
                "fees": {"government": "1.10", "subtotal": "1.10"},
                "rounding": {"rounding": "0.08", "subtotal": "0.08"},
            },
        )
