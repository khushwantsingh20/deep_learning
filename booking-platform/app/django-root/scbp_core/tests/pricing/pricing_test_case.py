import contextlib
import datetime
from decimal import Decimal
from unittest.mock import Mock
import warnings

from django.test import TestCase

from scbp_core.models.vehicle import VehicleClass
from scbp_core.services.distance_calculator import distance_between
from scbp_core.services.pricing import PriceCalculator
from scbp_core.tests.distance_mock_decorators import mock_raw_distance
from scbp_core.tests.factory.booking import AddressFactory
from scbp_core.tests.factory.booking import OneWayBookingFactory
from scbp_core.tests.factory.pricing import PriceListFactory


class PricingTestCase(TestCase):
    maxDiff = None
    fixtures = ["vehicle_class.json", "hour_rate_type.json"]

    def setUp(self):
        self.price_list = PriceListFactory()
        self.vehicle_classes = {
            vehicle_class.title: vehicle_class
            for vehicle_class in VehicleClass.objects.all()
        }

    def assert_price_calculator_method_result(
        self,
        booking,
        *,
        method_name,
        expected,
        price_list=None,
        args=None,
        calculator_kwargs=None,
        **kwargs,
    ):
        def default_method():
            raise TypeError(f"PriceCalculator has no method {method_name}")

        if not args:
            args = []
        if not calculator_kwargs:
            calculator_kwargs = {}
        calculator = PriceCalculator(
            booking, price_list or self.price_list, **calculator_kwargs
        )
        actual = getattr(calculator, method_name, default_method)(*args, **kwargs)
        self.assertEqual(actual, expected)

    def assert_price_equals(self, booking, price_str, *, price_list=None, **kwargs):
        """
        Wrapper method that asserts that the total price for the booking is equal to price_str (converted to Decimal)
        :param booking: The booking for which to calculate pricing
        :param price_str: string representing the expected total price for the booking (this can be any type that is
            accepted by the Decimal constructor, but due to precision concerns, ordinarily a string should be used)
        :param price_list: (optional) The price list to use - if missing, the default price list will be used
        :param kwargs: Any additional keyword arguments to pass into PriceCalculator.__init__
        """
        self.assertEqual(
            PriceCalculator(booking, price_list or self.price_list, **kwargs).total(),
            Decimal(price_str),
        )

    def assert_price_breakdown_equals(
        self, booking, raw_price_breakdown, *, price_list=None, **kwargs
    ):
        """
        Wrapper method that asserts that the breakdown for the booking is equal to the given price_breakdown
        :param booking: The booking for which to calculate pricing
        :param raw_price_breakdown: The expected price breakdown as a dictionary
        :param price_list: (optional) The price list to use - if missing, the default price list will be used
        :param kwargs: Any additional keyword arguments to pass into PriceCalculator.__init__
        """
        price_breakdown = raw_price_breakdown.copy()
        expected_time = None
        if "base" in price_breakdown and "time" in price_breakdown["base"]:
            expected_time = price_breakdown["base"].pop("time")
        expected_breakdown = {"total": Decimal(price_breakdown.pop("total"))}
        if "event_name" in price_breakdown:
            expected_breakdown["event_name"] = price_breakdown.pop("event_name")
        for key in price_breakdown:
            if key in ("price_variations", "out_of_pockets"):
                expected_breakdown[key] = {}

                expected_breakdown[key]["items"] = [
                    (subkey, Decimal(value))
                    for subkey, value in price_breakdown[key]["items"]
                ]
                expected_breakdown[key]["subtotal"] = Decimal(
                    price_breakdown[key]["subtotal"]
                )

            else:
                expected_breakdown[key] = {
                    subkey: Decimal(value)
                    for subkey, value in price_breakdown[key].items()
                }
        if expected_time:
            expected_breakdown["base"]["time"] = expected_time
        actual_breakdown = PriceCalculator(
            booking, price_list or self.price_list, **kwargs
        ).price_breakdown()

        for section in actual_breakdown:
            if section not in ["total", "event_name"]:
                # For each category in the actual breakdown, assert that the sum
                # of the money components is equal to the subtotal
                category_breakdown = actual_breakdown[section]

                items = []
                for item in category_breakdown:
                    if item == "subtotal":
                        continue
                    if "distance" in item:
                        continue
                    if "time" in item:
                        continue

                    if type(category_breakdown[item]) is list:
                        items += [sub[1] for sub in category_breakdown[item]]
                    else:
                        items.append(category_breakdown[item])

                total = sum(items)

                self.assertEqual(
                    category_breakdown["subtotal"],
                    total,
                    f"Subtotal mismatch in {section} ({category_breakdown}), getting {total}, expecting {category_breakdown['subtotal']}",
                )
        # Assert that the total in the actual breakdown is the sum of the subtotals
        self.assertEqual(
            actual_breakdown["total"],
            sum(
                [
                    actual_breakdown[section]["subtotal"]
                    for section in actual_breakdown
                    if section not in ["total", "event_name"]
                ]
            ),
            f"Total mismatch in {actual_breakdown}",
        )
        # Finally, assert that the breakdown we got is what we expected to get
        self.assertEqual(actual_breakdown, expected_breakdown)

    @staticmethod
    def component_sum(breakdown, components):
        return sum([breakdown[component] for component in components])

    def assert_invoice_breakdown_equals(
        self, booking, invoice_breakdown, price_list=None, **kwargs
    ):
        """
        Wrapper method that asserts that the invoice breakdown for the booking is equal to the given invoice_breakdown
        :param booking: The booking for which to calculate pricing
        :param invoice_breakdown: The expected price breakdown as a dictionary
        :param price_list: (optional) The price list to use - if missing, the default price list will be used
        :param kwargs: Any additional keyword arguments to pass into PriceCalculator.__init__
        """
        # Get the actual breakdown
        actual_breakdown = PriceCalculator(
            booking, price_list or self.price_list, **kwargs
        ).invoice_breakdown()
        # Convert expected breakdown
        expected_breakdown = {
            key: Decimal(value) for key, value in invoice_breakdown.items()
        }

        # Validate totals within breakdown
        # Validate that driver_value = travel_charge + time_surcharge +
        # waiting_charge + variations_charge + requests_charge
        actual_driver_value_sum = self.component_sum(
            actual_breakdown,
            [
                "travel_charge",
                "time_surcharge",
                "waiting_charge",
                "variations_charge",
                "requests",
            ],
        )
        self.assertEqual(
            actual_breakdown["driver_value"],
            actual_driver_value_sum,
            f"Driver value mismatch - given is {actual_breakdown['driver_value']}, "
            f"component sum is {actual_driver_value_sum}",
        )
        # Validate that booking_value = driver_value + booking_fees + out_of_pocket
        actual_total_sum = self.component_sum(
            actual_breakdown,
            ["driver_value", "booking_fees", "company_fee", "out_of_pocket"],
        )
        self.assertEqual(
            actual_breakdown["booking_value"],
            actual_total_sum,
            f"Total mismatch - given is {actual_breakdown['booking_value']}, "
            f"component sum is {actual_total_sum}",
        )

        # Perform the final comparison
        self.assertEqual(actual_breakdown, expected_breakdown)

    @staticmethod
    def set_hour(hour):
        return datetime.datetime(year=2019, month=7, day=2, hour=hour, minute=30)

    def mock_distance(self, booking, distance):
        booking.get_distance = Mock(name="get_distance")
        booking.get_distance.return_value = Decimal(distance)

    @contextlib.contextmanager
    def update_price_list(self):
        yield self.price_list
        self.price_list.save(save_existing=True)


class DistanceDecoratorMockTestCase(PricingTestCase):
    @mock_raw_distance({("abcd", "efgh"): Decimal("2.5")})
    def test_mock_raw_distance(self):
        """
        Use 'abcd' and 'efgh', neither of which is a valid Google place ID to the best of my knowledge,
        to test whether mock_raw_distance works as expected
        """
        with warnings.catch_warnings(record=True) as w:
            result = distance_between("abcd", "efgh")
            # result = Decimal(0.0)
            self.assertEqual(len(w), 0)
            self.assertEqual(result, Decimal("2.5"))

    @mock_raw_distance({("abcd", "efgh"): Decimal("2.5")})
    def test_mock_distance_in_booking(self):
        """
        Same as the above, only this time the call is in Booking.get_distance
        """
        booking = OneWayBookingFactory(
            from_address=AddressFactory(source_id="abcd"),
            destination_address=AddressFactory(source_id="efgh"),
        )
        self.assertEqual(booking.get_distance(), Decimal("2.5"))
