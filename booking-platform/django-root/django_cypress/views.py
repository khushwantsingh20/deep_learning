import traceback
from typing import Callable

from django.contrib.auth import get_user_model
from django.contrib.auth import login as auth_login
from django.http import HttpRequest
from django.http import HttpResponse
from django.http import JsonResponse
from django.utils.module_loading import import_string

import _thread

from .connection import rollback_connections


def _import_function(func_str: str) -> Callable:
    """
    Attempts to import a dotted path function. If this fails because the path is to
    a class-method, it trims off the last part of the path and attempts to import again.
    It continues until it finds a path that it can import and then attempts to resolve the
    trimmed parts as attributes.

    :param func_str:
    :return: Callable
    """
    func = None
    mod_func_str = func_str
    attrs = []

    while func is None:
        try:
            func = import_string(mod_func_str)
        except ImportError:
            split_func = mod_func_str.rsplit(".", 1)
            if len(split_func) == 1:
                raise ImportError(f"Unable to find import for any part of {func_str}")
            mod_func_str = split_func[0]
            attrs.append(split_func[1])

    # We have imported something so let's check we can
    # access the remainder as attributes
    if attrs:
        attr_path = ".".join(attrs)
        try:
            func = getattr(func, attr_path)
        except AttributeError:
            raise ImportError(
                f"Unable to find attributes {attr_path} for {mod_func_str}"
            )

    return func


def call_python(request: HttpRequest, func: str) -> HttpResponse:
    """
    Call a python function
    """
    try:
        func = _import_function(func)
    except ImportError:
        return HttpResponse(f"Can't import {func}", status=500)

    try:
        assert callable(func), f"{func} is not callable"
        result = func()
    except Exception:
        return HttpResponse(traceback.format_exc(limit=10), status=500)

    try:
        return JsonResponse({"result": result})
    except TypeError as ex:
        return JsonResponse(
            {
                "result": f"Cannot serialize data: {ex}. https://docs.djangoproject.com/en/dev/topics/serialization/ might help"
            }
        )


def login(request: HttpRequest, username: str) -> HttpResponse:
    UserModel = get_user_model()
    user = UserModel._meta.default_manager.get(**{UserModel.USERNAME_FIELD: username})
    auth_login(request, user, backend="allianceutils.auth.backends.ProfileModelBackend")
    response = JsonResponse({"status": "Done"})
    return response


def rollback(request: HttpRequest) -> HttpResponse:
    """
    Roll back existing cross-request transaction and start a new one
    """
    try:
        rollback_connections()
    except Exception as ex:
        print(f"Fatal exception trying to roll back: {ex}")  # noqa: T001 T002
        return end_server(request)
    return HttpResponse("Done")


def end_server(request: HttpRequest) -> HttpResponse:
    """
    Shut down the server
    """
    _thread.interrupt_main()
    return HttpResponse("Stopping server")
