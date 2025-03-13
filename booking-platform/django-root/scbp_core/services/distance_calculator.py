from decimal import Decimal
from functools import lru_cache
import logging
from typing import Optional

from django.conf import settings
import googlemaps

from scbp_core.services.places import AIRPORT_SOURCE_ID

logger = logging.getLogger("google_maps")


def _get_place_id_from_address(address_string):
    key = settings.GOOGLE_API_SERVER_KEY
    gmaps = googlemaps.Client(key=key)
    result = gmaps.find_place(
        address_string, input_type="textquery", fields=["place_id"]
    )
    if result["status"] == "ZERO_RESULTS":
        return None
    return result["candidates"][0]["place_id"]


def _location_to_api_param(place):
    """
    If place is an address, Google's Directions API can use it directly.
    For place IDs, the API requires it to be prepended with 'place_id:'
    :param place: The place (either an address or a Google Maps place ID)
    :return: place formatted for submission to Directions API
    """
    if place.find(" ") == -1:
        return f"place_id:{place}"
    return place


def _api_param_to_placeid(api_param: str):
    if api_param.startswith("place_id:"):
        return api_param.split(":")[1]
    return None


def _refresh_place_id(place_id: Optional[str], address_string: Optional[str] = None):
    if place_id is None:
        if address_string is None:
            return None
        return _get_place_id_from_address(address_string)
    key = settings.GOOGLE_API_SERVER_KEY
    gmaps = googlemaps.Client(key=key)
    try:
        r = gmaps.place(place_id, fields=["place_id"])
        return r["result"]["place_id"]
    except (googlemaps.exceptions.ApiError, KeyError):
        if address_string:
            return _get_place_id_from_address(address_string)
    return None


@lru_cache()
def distance_between(
    raw_place1,
    raw_place2,
    place1_address=None,
    place2_address=None,
    on_place_update=None,
):
    """
    Calls Directions API to get directions between raw_place1 and raw_place2 twice with alternatives,
    once including highways and once excluding highways. Takes the shortest of the returned travel
    distances (which are in metres) and rounds it to the nearest 0.1km
    :param raw_place1: The start of the journey
    :param raw_place2: The end of the journey
    :param place1_address: The full address of raw_place1. If provided this is used to resolve the place_id
    if the provided place_id is no longer valid
    :param place2_address: The full address of raw_place2. If provided this is used to resolve the place_id
    if the provided place_id is no longer valid
    :param on_place_update: A callback that will be passed a dictionary mapping old to new place ids. This is called
    when raw_place1 and/or raw_place2 is no longer valid and has a new place_id. This can be used to write changes
    to the database.
    :return: The shortest distance found by Directions API rounded to the nearest 0.1km
    """
    if not raw_place1 or not raw_place2:
        raise ValueError("distance_between requires two Google Maps place IDs")
    key = settings.GOOGLE_API_SERVER_KEY
    gmaps = googlemaps.Client(key=key)
    place1 = _location_to_api_param(raw_place1)
    place2 = _location_to_api_param(raw_place2)
    airport_route = AIRPORT_SOURCE_ID in [raw_place1, raw_place2]
    try:
        if airport_route:
            directions = gmaps.directions(
                place1, place2, mode="driving", units="metric", language="en-AU"
            )
        else:
            kwargs = {
                "alternatives": True,
                "mode": "driving",
                "units": "metric",
                "language": "en-AU",
            }
            directions = [
                *gmaps.directions(place1, place2, **kwargs),
                *gmaps.directions(place1, place2, avoid="highways", **kwargs),
            ]
    except googlemaps.exceptions.ApiError as e:
        # If we get a not found on place then it may just need a refresh.
        # See https://developers.google.com/places/place-id#save-id
        # We attempt to refresh just the ID (free) and failing that refresh from the
        # address if avaiable (charged)
        if e.status == "NOT_FOUND":
            placeid_1 = _api_param_to_placeid(place1)
            placeid_2 = _api_param_to_placeid(place2)
            new_place1 = _refresh_place_id(placeid_1, place1_address)
            new_place2 = _refresh_place_id(placeid_2, place2_address)
            place_updates = {}
            if new_place1 and placeid_1 and new_place1 != placeid_1:
                place_updates[placeid_1] = new_place1
            if new_place2 and placeid_2 and new_place2 != placeid_2:
                place_updates[placeid_2] = new_place2
            if place_updates and on_place_update:
                on_place_update(place_updates)
            if new_place1 and new_place2:
                for from_place, to_place in place_updates.items():
                    logger.info(f"Updated place ID from {from_place} to {to_place}")
                return distance_between(new_place1, new_place2)
        logger.exception(
            f"Failed to get directions between places {place1} and {place2}"
        )
        raise
    option_distances = [
        (Decimal(leg["distance"]["value"]) / 1000).quantize(Decimal("0.1"))
        for route in directions
        for leg in route["legs"]
    ]
    return min(option_distances)
