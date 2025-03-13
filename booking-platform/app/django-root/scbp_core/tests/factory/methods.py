import random
import string

import factory

from scbp_core.services.places import MELBOURNE_GPO_PLACE_ID

factory.Faker._DEFAULT_LOCALE = "en_AU"


valid_addresses = {
    # Melbourne GPO, Melbourne CBD
    "melbourne_cbd": {
        "source_id": MELBOURNE_GPO_PLACE_ID,
        "formatted_address": "350 Bourke St, Melbourne VIC 3000",
        "postal_code": "3000",
    },
    # Camberwell Place, Camberwell
    "camberwell": {
        "source_id": "ChIJL_MrvoNB1moRNem-PT2uQJQ",
        "formatted_address": "793 Burke Road, Camberwell VIC 3124",
        "postal_code": "3124",
    },
    # Box Hill Central, Box Hill
    "box_hill": {
        "source_id": "ChIJ34_ST7dA1moRb4taFWxfD5c",
        "formatted_address": "1 Main Street, Box Hill VIC 3128",
        "postal_code": "3128",
    },
    # Alliance Software, Nunawading
    "alliance": {
        "source_id": "ChIJi7iHMsk41moR_7dXVxseiZ4",
        "formatted_address": "234 Whitehorse Road, Nunawading VIC 3131",
        "postal_code": "3131",
    },
    # Eastland Shopping Centre, Ringwood
    "ringwood": {
        "source_id": "ChIJ06ObLtQ71moR0NAyBXZWBA8",
        "formatted_address": "175 Maroondah Highway, Ringwood VIC 3134",
        "postal_code": "3134",
    },
}


def serial(m, n=0):
    n = n or m
    s = ""
    for i in range(m):
        s += random.choice(string.ascii_uppercase)
    for i in range(n):
        s += random.choice(string.digits)
    return s


def _build_phone_number(*args, **kwargs):
    return factory.LazyFunction(lambda: "04" + serial(0, 8))


def _ignore(*args, **kwargs):
    return None
