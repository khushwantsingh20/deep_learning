from decimal import Decimal
import json
from typing import Type

from rest_framework.request import Request

from scbp_core.models import User


class DecimalJSONEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, Decimal):
            return str(obj)
        return json.JSONEncoder.default(self, obj)


def is_current_user_of_type(request: Request, profile_type: Type[User]) -> bool:
    """Check if current user is of specified profile type.

    Returns False is user is not logged in at all
    """
    if not request.user or request.user.is_anonymous:
        return False
    profile = request.user.get_profile()
    if not profile:
        return False
    return isinstance(profile, profile_type)
