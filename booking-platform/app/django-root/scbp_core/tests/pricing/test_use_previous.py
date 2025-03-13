from decimal import Decimal
from unittest.mock import Mock

from scbp_core.services.pricing import PriceCalculator
from scbp_core.tests.distance_mock_decorators import test_case_mock_distance_to_gpo
from scbp_core.tests.factory.account import AccountFactory
from scbp_core.tests.factory.booking import AddressFactory
from scbp_core.tests.factory.booking import OneWayBookingFactory
from scbp_core.tests.factory.pricing import BookingOutOfPocketFactory
from scbp_core.tests.factory.pricing import BookingPriceVariationFactory
from scbp_core.tests.factory.user import ClientUserFactory
from scbp_core.tests.pricing.pricing_test_case import PricingTestCase


@test_case_mock_distance_to_gpo
class UsePreviousTestCase(PricingTestCase):
    def setUp(self):
        super().setUp()
        client = ClientUserFactory()
        account = AccountFactory()
        self.from_address = AddressFactory.create(
            source_id="ChIJi7iHMsk41moR_7dXVxseiZ4",
            formatted_address="234 Whitehorse Rd, Nunawading VIC 3131",
            postal_code="3131",
        )
        self.to_address = AddressFactory.create(
            source_id="ChIJlVWPC7VC1moRwANVqtx_3eQ",
            formatted_address="350 Bourke St, Melbourne VIC 3000",
            postal_code="3000",
        )
        self.booking = OneWayBookingFactory.create(
            vehicle_class=self.vehicle_classes["Any Class"],
            from_address=self.from_address,
            destination_address=self.to_address,
            created_by=client,
            client_user=client,
            passenger=client,
            account=account,
            price_list=self.price_list,
        )
        self.mock_distance(self.booking, "19.0")
        calculator = PriceCalculator(self.booking)
        calculator._closest_destination_distance = Mock(
            name="_closest_destination_distance"
        )
        calculator._closest_destination_distance.return_value = Decimal(0)
        self.booking.update_from_calculator(calculator)
        self.booking.save()

    def test_minor_distance_adjustment(self):
        """
        Test a medium length trip between
        234 Whitehorse Rd, Nunawading VIC 3131 (place ID ChIJi7iHMsk41moR_7dXVxseiZ4) and
        Melbourne's GPO, 350 Bourke St, Melbourne VIC 3000 (place ID ChIJlVWPC7VC1moRwANVqtx_3eQ)
        Distance 19.0km
        Expect $77.10
        """
        self.assert_price_equals(self.booking, "77.10")
        self.mock_distance(self.booking, "24.0")
        self.assert_price_equals(self.booking, "77.1", use_previous=True)
        # Using the splat notation for self.booking.price_breakdown creates a deep copy
        # preventing assert_price_breakdown_equals from affecting the operation of PriceCalculator.price_breakdown
        self.assert_price_breakdown_equals(
            self.booking, {**self.booking.price_breakdown}, use_previous=True
        )

    def test_variation_adjustment(self):
        self.assert_price_equals(self.booking, "77.10")
        BookingPriceVariationFactory.create(amount=Decimal(20), booking=self.booking)
        self.assert_price_equals(self.booking, "97.10", use_previous=True)
        self.assert_price_breakdown_equals(
            self.booking,
            {
                **self.booking.price_breakdown,
                "price_variations": {
                    "subtotal": "20.00",
                    "items": [["Ad Hoc Additional Stop", "20.00"]],
                },
                "total": "97.10",
            },
            use_previous=True,
        )

    def test_out_of_pocket_adjustment(self):
        self.assert_price_equals(self.booking, "77.10")
        BookingOutOfPocketFactory.create(
            amount=Decimal(20), booking=self.booking, description="Test Out of Pocket"
        )
        self.assert_price_equals(self.booking, "97.10", use_previous=True)
        self.assert_price_breakdown_equals(
            self.booking,
            {
                **self.booking.price_breakdown,
                "out_of_pockets": {
                    "subtotal": "20.00",
                    "items": [["Test Out of Pocket", "20.00"]],
                },
                "total": "97.10",
            },
            use_previous=True,
        )
