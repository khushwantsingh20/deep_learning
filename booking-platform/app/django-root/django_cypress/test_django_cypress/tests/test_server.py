from contextlib import contextmanager
import datetime
import os
from pathlib import Path
import socket
import subprocess
import time
from unittest import skipIf

from django.conf import settings
from django.db import connection
from django.db import DEFAULT_DB_ALIAS
from django.test import SimpleTestCase
from django.test import tag
from django.urls import reverse
import requests

from ..models import TestModel

MANAGE_PY = str(Path(settings.BASE_DIR, "manage.py"))
LISTEN_ADDR = "127.0.0.1"
LISTEN_PORT = 8200


@contextmanager
def persistent_server():
    # use DEVNULL to suppress runserver output
    if settings.DEBUG or False:
        stdin = None
        stdout = None
        stderr = None
    else:
        stdin = subprocess.DEVNULL
        stdout = subprocess.DEVNULL
        stderr = subprocess.DEVNULL

    cmd_args = [
        MANAGE_PY,
        "runserver_cypress",
        f"{LISTEN_ADDR}:{LISTEN_PORT}",
        "--persistent-transactions",
        "--skip-checks",
        "--nothreading",
        "--noreload",
    ]

    # We want the test harness and the server to use the same DB
    # Alternately, we might scrap this and do absolutely everything through the test server
    env = os.environ.copy()
    env["DB_NAME"] = connection.settings_dict["NAME"]

    # DB_NAME

    # nothing should be listening on that port yet
    try:
        s = socket.create_connection((LISTEN_ADDR, LISTEN_PORT), timeout=0.1)
    except (socket.timeout, ConnectionRefusedError):
        pass
    else:
        s.close()
        raise RuntimeError(
            f"Something is already listening on {LISTEN_ADDR}:{LISTEN_PORT}"
        )

    # spawn the server process
    # unfortunately this is pretty slow, I can't find a way to speed it up
    proc = None
    STARTUP_WAIT_SECONDS = 15  # time to wait before assuming server start failed
    try:
        proc = subprocess.Popen(
            cmd_args, stdin=stdin, stdout=stdout, stderr=stderr, env=env
        )

        # wait until server is listening
        start_time = datetime.datetime.now()
        timeout = 0.1
        while True:
            try:
                s = socket.create_connection(
                    (LISTEN_ADDR, LISTEN_PORT), timeout=timeout
                )
            except socket.timeout:
                pass
            except ConnectionRefusedError:
                time.sleep(timeout)
            else:
                s.close()
                break
            timeout *= 1 + 1.0 / 16
            if proc.poll() is not None:
                raise RuntimeError("Django server process quit during startup")
            elapsed = datetime.datetime.now() - start_time
            if elapsed > datetime.timedelta(seconds=STARTUP_WAIT_SECONDS):
                raise RuntimeError(
                    f"Django server process is not listening on {LISTEN_ADDR}:{LISTEN_PORT} (waited {elapsed}s)"
                )

        # print(f'Server started after {elapsed} sec')

        # and return the address/port
        yield (LISTEN_ADDR, LISTEN_PORT, proc)

    finally:
        # shut down server process
        if proc:
            if proc.poll() is None:
                proc.terminate()

            try:
                proc.wait(5)
            except subprocess.TimeoutExpired:
                proc.kill()
                proc.wait(5)


@tag("slow")
class PersistentTransactionServerTestCase(SimpleTestCase):
    # We want the test harness to run with no transactions: we want DB changes to be immediately visible inside the
    # runserver_cypress process
    databases = [DEFAULT_DB_ALIAS]

    @skipIf(
        "django_cypress.test_django_cypress" not in settings.INSTALLED_APPS,
        "Only test if explicitly included",
    )
    def test_server_persistent(self):
        """
        Test that persistent transaction server can be stopped through a web request
        """
        # noqa: E731
        TestModel.objects.all().delete()
        self.assertEqual(TestModel.objects.all().count(), 0)

        with persistent_server() as (server_addr, server_port, proc):
            url_root = f"http://{server_addr}:{server_port}"
            url_home = url_root + "/"
            url_test_list = url_root + reverse("django_cypress:test:list")
            url_rollback = url_root + reverse("django_cypress:rollback")
            url_kill = url_root + reverse("django_cypress:kill")

            def url_call(func):
                return url_root + reverse("django_cypress:call", kwargs={"func": func})

            def url_test_add(data):
                return url_root + reverse(
                    "django_cypress:test:add", kwargs={"data": data}
                )

            def url_test_add_transaction(data):
                return url_root + reverse(
                    "django_cypress:test:add_transaction", kwargs={"data": data}
                )

            def url_test_sql_error(data):
                return url_root + reverse(
                    "django_cypress:test:sql_error", kwargs={"data": data}
                )

            def do_rollback():
                response = requests.get(url_rollback)
                self.assertEqual(response.status_code, 200)

            def get_list_data():
                response = requests.get(url_test_list)
                self.assertEqual(response.status_code, 200)
                data = response.json()["data"]
                return [obj["data"] for obj in data]

            # These should really be in separate tests but the server startup is quite slow so we
            # do them as subtests; if rollback is not working then they will all be broken
            with self.subTest("Server runs"):
                r = requests.get(url_home)
                self.assertEqual(r.status_code, 200)

            with self.subTest("Call Python"):
                do_rollback()
                self.assertEqual(get_list_data(), [])

                # regular view
                r = requests.get(url_test_add("aaaa"))
                self.assertEqual(r.status_code, 200)

                # python function call
                r = requests.get(
                    url_call("django_cypress.test_django_cypress.businesslogic.add")
                )
                self.assertEqual(r.status_code, 200)

                self.assertEqual(get_list_data(), ["aaaa", "auto0"])
                self.assertEqual(TestModel.objects.all().count(), 0)

                # rollback
                do_rollback()
                self.assertEqual(get_list_data(), [])

            with self.subTest("Nested Transactions"):
                do_rollback()
                self.assertEqual(get_list_data(), [])

                # requests that have their own transactions that both commit and rollback
                r = requests.get(url_test_add_transaction("nestedXX"))
                self.assertEqual(r.status_code, 200)
                r = requests.get(url_test_add_transaction("nestedYY"))
                self.assertEqual(r.status_code, 200)
                self.assertEqual(get_list_data(), ["nestedXX", "nestedYY"])

                # rollback
                do_rollback()
                self.assertEqual(get_list_data(), [])

            with self.subTest("SQL Exception"):
                # If an SQL error occurs then it shouldn't break the connection (looking at you, postgres!)
                do_rollback()
                self.assertEqual(get_list_data(), [])

                r = requests.get(url_test_add("good-data"))
                self.assertEqual(r.status_code, 200)
                self.assertEqual(get_list_data(), ["good-data"])

                r = requests.get(url_test_sql_error("sql_error"))
                self.assertEqual(r.status_code, 200)
                self.assertEqual(r.json()["data"]["state"], "DB_Error_Caught")

                # in the event of an SQL error, the whole thing is rolled back
                self.assertEqual(get_list_data(), [])

                do_rollback()
                self.assertEqual(get_list_data(), [])

            with self.subTest("Shutdown"):
                try:
                    requests.get(url_kill)
                except requests.exceptions.ConnectionError as ce:
                    # request will abort immediately (without sending a http response)
                    pass
                    self.assertIn("Connection aborted.", str(ce))

                # server should shut down
                proc.wait(5)
