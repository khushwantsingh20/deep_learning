from functools import wraps
import json

from allianceutils.util.camel_case import underscoreize
from django.contrib.auth import REDIRECT_FIELD_NAME
from django.contrib.auth.decorators import user_passes_test


def hijack_staff_member_required(
    view_func=None, redirect_field_name=REDIRECT_FIELD_NAME, login_url=None
):
    actual_decorator = user_passes_test(
        lambda u: True, login_url=login_url, redirect_field_name=redirect_field_name
    )
    if view_func:
        return actual_decorator(view_func)
    return actual_decorator


def parse_json_request(view_func):
    @wraps(view_func)
    def wrapper_view(request, *args, **kwargs):
        request.POST = underscoreize(json.loads(request.body))
        return view_func(request, *args, **kwargs)

    return wrapper_view
