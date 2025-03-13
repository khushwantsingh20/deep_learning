import os
import pathlib
import threading
from typing import Callable

from django.conf import settings

from . import connection

__all__ = ["wrap_wsgi_application"]

assert settings.DEBUG or getattr(
    settings, "AUTOMATED_TESTS", False
), "django_cypress IS VERY DANGEROUS! It should not be enabled in production"


def wrap_wsgi_application(application: Callable) -> Callable:
    """
    Wrap a django WSGI application so that django DB connection are always in a transaction that persists between requests
    """

    intial_pid = os.getpid()
    intial_tid = threading.get_ident()

    cypress_pid_file = pathlib.Path(settings.BASE_DIR, "django.pid")
    with open(cypress_pid_file, "w") as f:
        f.write(str(intial_pid))

    connection.patch_all_connections()

    def handle(environ, start_response):
        assert (
            not environ["wsgi.multithread"] and threading.get_ident() == intial_tid
        ), "django_cypress cross-request transactions cannot run in a multithreaded environment"
        assert (
            not environ["wsgi.multiprocess"] and os.getpid() == intial_pid
        ), "django_cypress cross-request transactions cannot run in a multiprocess environment"
        connection.verify_patched_connections()
        return application(environ, start_response)

    return handle
