from datetime import datetime
from decimal import Decimal

from scbp_core.models.pricing import PriceList
from scbp_core.services.places import MELBOURNE_GPO_PLACE_ID
from scbp_core.tests.distance_mock_decorators import test_case_mock_distance_to_gpo
from scbp_core.tests.factory.account import AccountFactory
from scbp_core.tests.factory.booking import AddressFactory
from scbp_core.tests.factory.booking import OneWayBookingFactory
from scbp_core.tests.factory.pricing import PriceListFactory
from scbp_core.tests.factory.pricing import PriceOverrideFactory
from scbp_core.tests.pricing.pricing_test_case import PricingTestCase


@test_case_mock_distance_to_gpo
class PriceOverrideTestCase(PricingTestCase):
    def setUp(self):
        super().setUp()
        self.from_address = AddressFactory(
            formatted_address="234 Whitehorse Rd, Nunawading VIC 3131",
            source_id="ChIJi7iHMsk41moR_7dXVxseiZ4",
            postal_code="3131",
        )
        self.to_address = AddressFactory(
            formatted_address="Melbourne's GPO, 350 Bourke St, Melbourne VIC 3000",
            source_id=MELBOURNE_GPO_PLACE_ID,
            postal_code="3000",
        )
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
        self.override_booking = OneWayBookingFactory(
            account=self.booking_account,
            vehicle_class=self.vehicle_classes["Any Class"],
            from_address=self.from_address,
            destination_address=self.to_address,
            travel_on=datetime(year=2019, month=7, day=17, hour=11),
        )
        self.mock_distance(self.override_booking, "19.0")
        self.price_breakdown_without_override = {
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
        }
        self.price_breakdown_with_override = {
            "total": "61.10",
            "base": {
                "distance": "19.0",
                "car_class": "0.00",
                "special": "60.00",
                "subtotal": "60.00",
            },
            "fees": {"government": "1.10", "subtotal": "1.10"},
        }

    def test_override_accounts_for_vehicle_class(self):
        """
        Test that vehicle class difference is included in the price
        :return:
        """
        PriceOverrideFactory.create(from_postcode="3131", to_postcode="3000")
        self.override_booking.vehicle_class = self.vehicle_classes["FPM"]
        self.assert_price_breakdown_equals(
            self.override_booking,
            {
                "total": "83.10",
                "base": {
                    "distance": "19.0",
                    "car_class": "22.00",
                    "special": "60.00",
                    "subtotal": "82.00",
                },
                "fees": {"government": "1.10", "subtotal": "1.10"},
            },
        )
        self.override_booking.vehicle_class = self.vehicle_classes["LPM"]
        self.assert_price_breakdown_equals(
            self.override_booking,
            {
                "total": "105.10",
                "base": {
                    "distance": "19.0",
                    "car_class": "44.00",
                    "special": "60.00",
                    "subtotal": "104.00",
                },
                "fees": {"government": "1.10", "subtotal": "1.10"},
            },
        )

    def test_timed_override_overrules_minimum_fee(self):
        PriceOverrideFactory.create(
            from_postcode="3131", to_postcode="3000", fixed_cost=Decimal("2.00")
        )
        self.assert_price_breakdown_equals(
            self.override_booking,
            {
                "total": "3.10",
                "base": {
                    "distance": "19.0",
                    "special": "2.00",
                    "car_class": "0.00",
                    "subtotal": "2.00",
                },
                "fees": {"government": "1.10", "subtotal": "1.10"},
            },
        )

    def test_all_day_override_overrules_minimum_fee(self):
        PriceOverrideFactory.create(
            from_postcode="3131",
            to_postcode="3000",
            fixed_cost=Decimal("2.00"),
            is_all_day=True,
        )
        self.assert_price_breakdown_equals(
            self.override_booking,
            {
                "total": "3.10",
                "base": {
                    "distance": "19.0",
                    "special": "2.00",
                    "car_class": "0.00",
                    "subtotal": "2.00",
                },
                "fees": {"government": "1.10", "subtotal": "1.10"},
            },
        )

    def test_all_day_override_overrules_sc_fee_for_client(self):
        PriceOverrideFactory.create(
            from_postcode="3131", to_postcode="3000", is_all_day=True
        )
        PriceList.objects.filter(is_current=True).update(is_current=False)
        price_list = PriceListFactory.create(company_booking_fee=Decimal("4.00"))
        self.assert_price_breakdown_equals(
            self.override_booking,
            self.price_breakdown_with_override,
            price_list=price_list,
        )

    def test_all_day_override_overrides_timing(self):
        """
        Test timing on all day override
        Expect $61.10
        """
        price_override = PriceOverrideFactory.create(
            from_postcode="3131", to_postcode="3000", is_all_day=True
        )
        self.override_booking.travel_on = self.override_booking.travel_on.replace(
            hour=17
        )
        self.assert_price_calculator_method_result(
            self.override_booking,
            expected=price_override,
            method_name="_booking_price_override",
        )
        self.assert_price_breakdown_equals(
            self.override_booking,
            {
                "total": "61.10",
                "base": {
                    "distance": "19.0",
                    "special": "60.00",
                    "car_class": "0.00",
                    "subtotal": "60.00",
                },
                "fees": {"government": "1.10", "subtotal": "1.10"},
            },
        )
