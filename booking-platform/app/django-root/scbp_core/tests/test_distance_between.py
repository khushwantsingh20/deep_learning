from decimal import Decimal
import json
from timeit import timeit
from unittest import skipIf
from unittest.mock import Mock
from urllib.parse import parse_qsl
from urllib.parse import urlparse
import warnings

from django.conf import settings
from django.test import TestCase
import responses

from scbp_core.services.distance_calculator import distance_between
from scbp_core.services.places import AIRPORT_SOURCE_ID


class TestDistanceBetween(TestCase):
    def setUp(self):
        warnings.simplefilter("ignore", ResourceWarning)

    def tearDown(self):
        warnings.resetwarnings()

    @skipIf(settings.SKIP_GOOGLE_API_TESTS, "Skipping Google Maps unit-tests")
    def test_address_richmond_to_nunawading(self):
        """
        Expected distance is 24.0km
        :return:
        """
        self.assertAlmostEqual(
            distance_between(
                "239 Lennox St, Richmond VIC 3121",
                "234 Whitehorse Rd, Nunawading VIC 3130",
            ),
            Decimal("17.2"),
            delta=Decimal("0.1"),
        )

    @skipIf(settings.SKIP_GOOGLE_API_TESTS, "Skipping Google Maps unit-tests")
    def test_placeid_richmond_to_nunawading(self):
        """
        ChIJywNwgvJC1moRwHI8kRoH2Vk is 239 Lennox St in Richmond
        ChIJi7iHMsk41moR_7dXVxseiZ4 is 234 Whitehorse Rd in Nunawading
        Expected distance is 24.0km
        """
        self.assertAlmostEqual(
            distance_between(
                "ChIJywNwgvJC1moRwHI8kRoH2Vk", "ChIJi7iHMsk41moR_7dXVxseiZ4"
            ),
            Decimal("17.2"),
            delta=Decimal("0.1"),
        )

    @skipIf(settings.SKIP_GOOGLE_API_TESTS, "Skipping Google Maps unit-tests")
    def test_cache(self):
        """
        ChIJywNwgvJC1moRwHI8kRoH2Vk is 239 Lennox St in Richmond
        ChIJxYbXFyM51moRTw7Cpmd4AdY is Mitcham Station in Mitcham
        Runs twice to verify caching
        """

        def on_update(r):
            pass

        time_first_run = timeit(
            lambda: distance_between(
                "ChIJywNwgvJC1moRwHI8kRoH2Vk",
                "ChIJxYbXFyM51moRTw7Cpmd4AdY",
                on_place_update=on_update,
            ),
            number=1,
        )
        time_second_run = timeit(
            lambda: distance_between(
                "ChIJywNwgvJC1moRwHI8kRoH2Vk",
                "ChIJxYbXFyM51moRTw7Cpmd4AdY",
                on_place_update=on_update,
            ),
            number=1,
        )
        # Assert that the second run time (which should have hit the cache)
        # is much less than the first run time (which should not have hit the cache)
        self.assertLess(time_second_run, time_first_run / 10000)

    @skipIf(settings.SKIP_GOOGLE_API_TESTS, "Skipping Google Maps unit-tests")
    def test_distance_between_airport(self):
        """
        This test validates that distance_between correctly handles airport endpoints
        ChIJi7iHMsk41moR_7dXVxseiZ4 is 234 Whitehorse Rd in Nunawading
        and 41.5km from Nunawading (43.7 to Nunawading)
        """
        nunawading = "ChIJi7iHMsk41moR_7dXVxseiZ4"
        self.assertAlmostEqual(
            distance_between(nunawading, AIRPORT_SOURCE_ID),
            Decimal("41.5"),
            delta=Decimal("0.1"),
        )
        self.assertAlmostEqual(
            distance_between(AIRPORT_SOURCE_ID, nunawading),
            Decimal("43.5"),
            delta=Decimal("0.1"),
        )

    @responses.activate
    def test_refresh_place_id(self):
        """
        Test that if place id isn't found we can refresh place_id or requery
        it using full address
        """
        place1 = "place1"
        place2 = "place2"
        new_place1 = "abc123"
        new_place2 = "def456"
        distance = 666

        def place_details_callback(request):
            query = dict(parse_qsl(urlparse(request.url).query))
            place_id = query["placeid"]
            resp_body = None
            if place_id == place1:
                resp_body = {"status": "OK", "result": {"place_id": new_place1}}
            if place_id == place2:
                resp_body = {"status": "NOT_FOUND"}
            assert resp_body, "Expected calls with only place1 or place2"
            return (200, {}, json.dumps(resp_body))

        def directions_callback(request):
            query = dict(parse_qsl(urlparse(request.url).query))
            # converts place_id:abc to abc
            place_id = query["destination"].split(":")[1]

            resp_body = None
            if place_id == place2:
                resp_body = {"status": "NOT_FOUND"}
            if place_id == new_place2:
                resp_body = {
                    "status": "OK",
                    "routes": [{"legs": [{"distance": {"value": distance * 1000}}]}],
                }
            assert resp_body, "Expected calls with only place2 or new_place2"
            return (200, {}, json.dumps(resp_body))

        # Mock out directions. First call will return not found then second one will
        # return distance
        responses.add_callback(
            responses.GET,
            "https://maps.googleapis.com/maps/api/directions/json",
            callback=directions_callback,
            content_type="application/json",
        )

        # Mock out calls that resolve place ids. place2 resolves to not found (so it
        # falls back to a full address lookup) and place1 resolves directly to new_place1
        responses.add_callback(
            responses.GET,
            "https://maps.googleapis.com/maps/api/place/details/json",
            callback=place_details_callback,
            content_type="application/json",
        )
        # Because the above returns NOT_FOUND for place2 it will fall back to full address
        # lookup. Here we return a match and return new_place2 as the new id.
        responses.add(
            responses.GET,
            "https://maps.googleapis.com/maps/api/place/findplacefromtext/json",
            body=json.dumps({"status": "OK", "candidates": [{"place_id": new_place2}]}),
            status=200,
            content_type="application/json",
        )
        self.assertEqual(
            distance_between(place1, place2, "Place 1", "Place 2"), distance
        )

        on_place_update = Mock()

        self.assertEqual(
            distance_between(place1, place2, "Place 1", "Place 2", on_place_update),
            distance,
        )

        on_place_update.assert_called_with({place1: new_place1, place2: new_place2})
