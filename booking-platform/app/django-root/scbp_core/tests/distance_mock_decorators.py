from decimal import Decimal
import inspect
from typing import Dict
from typing import Tuple
from unittest.mock import Mock
from unittest.mock import patch


def mock_raw_distance(raw_expected_results: Dict[Tuple[str, str], Decimal]):
    """
    Mock distance_between to return the given expected results on the given inputs
    :param raw_expected_results: A dict where each key is the pair of place IDs as input
        and the value is the resulting distance
    """

    def wrap_distance(test):

        expected_results = {}
        for (places, distance) in raw_expected_results.items():
            expected_results[places] = distance
            # Use the same result for the reversed inputs unless the reversed inputs are expressly included
            # This reduces duplication of distance definitions in users
            reversed_places = places[::-1]
            if reversed_places not in raw_expected_results:
                expected_results[reversed_places] = distance

        def side_effect(raw_place1, raw_place2, *args, **kwargs):
            if raw_place1 == raw_place2:
                return Decimal(0)
            return expected_results[(raw_place1, raw_place2)]

        mock = Mock(side_effect=side_effect)
        wrapped_test = test
        modules = ["scbp_core.models.booking", "scbp_core.services.pricing"]
        if hasattr(inspect.getmodule(test), "distance_between"):
            modules.append(inspect.getmodule(test).__name__)
        for module in modules:
            wrapped_test = patch(module + ".distance_between", new=mock)(wrapped_test)
        return wrapped_test

    return wrap_distance


def test_mock_distance_to_gpo(test):
    """
    Mock out the distance_between function as called from PriceCalculator for a given test,
    returning 0 for any  input (this ensures the out-of-area code is never called)
    :param test: The test being decorated with this decorator
    :return:
    """
    return patch(
        "scbp_core.services.pricing.distance_between", new=Mock(return_value=Decimal(0))
    )(test)


def test_case_mock_distance_to_gpo(cls):
    """
    Mock out the distance_between function as called from PriceCalculator for all tests in a test case,
    returning 0 for any input (this ensures the out-of-area code is never called)
    :param cls: The test case being decorated with this decorator
    """
    return patch(
        "scbp_core.services.pricing.distance_between", new=Mock(return_value=Decimal(0))
    )(cls)
