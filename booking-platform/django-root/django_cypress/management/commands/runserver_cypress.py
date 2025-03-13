"""
heavily modified from django_extensions.management.commands.runserver_plus

Differences:
 - if DEBUG is turned off then serve collected static files instead of source static files
 - ability to turn off system checks
 - added --persistenttransactions support to allow cross-request transactions
   (use /django_cypress/rollback to rest current transaction)
 - werkzeug debugger is disabled unless settings.DEBUG
"""

import os
import sys

import django
from django.conf import settings
from django.core.exceptions import ImproperlyConfigured
from django.core.management.base import CommandError
from django.core.servers.basehttp import get_internal_wsgi_application
from django_extensions.management.commands.runserver_plus import (
    Command as RunserverPlusCommand,
)
from django_extensions.management.commands.runserver_plus import set_werkzeug_log_color

from django_cypress import wrap_wsgi_application

try:
    from django.utils.autoreload import gen_filenames
except ImportError:  # Django >=2.2
    from django.utils.autoreload import get_reloader

    def gen_filenames():
        return get_reloader().watched_files()


# If in production then we don't wrap the wsgi handler to serve static files,
# instead we use werkzeug's built-in one
if not settings.DEBUG:
    USE_STATICFILES = True

    def StaticFilesHandler(application):
        from werkzeug.middleware.shared_data import SharedDataMiddleware

        return SharedDataMiddleware(
            application, {settings.STATIC_URL: str(settings.STATIC_ROOT)}
        )

else:
    from django_extensions.management.commands.runserver_plus import StaticFilesHandler
    from django_extensions.management.commands.runserver_plus import USE_STATICFILES


class Command(RunserverPlusCommand):
    help = "Starts a Web server for CI tests."

    # Validation is called explicitly each time the server is reloaded.
    requires_system_checks = []

    def add_arguments(self, parser):
        super().add_arguments(parser)
        parser.add_argument(
            "--skip-checks",
            dest="skip_checks",
            action="store_true",
            default=False,
            help="Skip system checks on startup.",
        )
        parser.add_argument(
            "--persistent-transactions",
            dest="persistent_transactions",
            action="store_true",
            default=False,
            help="Activate cross-request transactions for E2E testing.",
        )

    def get_wsgi_application(self):
        return get_internal_wsgi_application()

    def inner_run(self, options):  # noqa: C901
        try:
            from werkzeug import run_simple
            from werkzeug.debug import DebuggedApplication
            from werkzeug.serving import WSGIRequestHandler as _WSGIRequestHandler

            # Set colored output
            if settings.DEBUG:
                try:
                    set_werkzeug_log_color()
                except (
                    Exception
                ):  # We are dealing with some internals, anything could go wrong
                    if self.show_startup_messages:
                        print(
                            "Wrapping internal werkzeug logger for color highlighting has failed!"
                        )
                    pass

        except ImportError:
            raise CommandError(
                "Werkzeug is required to use runserver_plus.  Please visit http://werkzeug.pocoo.org/ or install via pip. (pip install Werkzeug)"
            )

        class WSGIRequestHandler(_WSGIRequestHandler):
            def make_environ(self):
                environ = super(WSGIRequestHandler, self).make_environ()
                if not options["keep_meta_shutdown_func"]:
                    del environ["werkzeug.server.shutdown"]
                return environ

        threaded = options["threaded"]
        use_reloader = options["use_reloader"]
        open_browser = options["open_browser"]
        quit_command = (sys.platform == "win32") and "CTRL-BREAK" or "CONTROL-C"
        extra_files = options["extra_files"]
        reloader_interval = options["reloader_interval"]
        reloader_type = options["reloader_type"]
        persistent_transactions = options["persistent_transactions"]

        self.nopin = options["nopin"]

        self.skip_checks = options["skip_checks"]
        if persistent_transactions:
            assert not threaded, "persistent transactions does not work with threads"
            assert (
                not use_reloader
            ), "persistent transactions does not work with code reloading"
            assert (
                not extra_files
            ), "persistent transactions does not work with code reloading"
        assert not options["pdb"], "Debugging with pdb is disabled"
        assert not options["ipdb"], "Debugging with ipdb is disabled"
        assert not options["pm"], "Debugging with pm is disabled"

        if self.show_startup_messages:
            print("Performing system checks...\n")
        if hasattr(self, "check"):
            self.check(display_num_errors=self.show_startup_messages)
        else:
            self.validate(display_num_errors=self.show_startup_messages)
        try:
            self.check_migrations()
        except ImproperlyConfigured:
            pass
        handler = self.get_wsgi_application()
        if persistent_transactions:
            handler = wrap_wsgi_application(handler)
        if USE_STATICFILES:
            use_static_handler = options["use_static_handler"]
            insecure_serving = options["insecure_serving"]
            if use_static_handler and (settings.DEBUG or insecure_serving):
                handler = StaticFilesHandler(handler)
        if options["cert_path"] or options["key_file_path"]:
            """
            OpenSSL is needed for SSL support.

            This will make flakes8 throw warning since OpenSSL is not used
            directly, alas, this is the only way to show meaningful error
            messages. See:
            http://lucumr.pocoo.org/2011/9/21/python-import-blackbox/
            for more information on python imports.
            """
            try:
                import OpenSSL  # NOQA
            except ImportError:
                raise CommandError(
                    "Python OpenSSL Library is "
                    "required to use runserver_plus with ssl support. "
                    "Install via pip (pip install pyOpenSSL)."
                )

            certfile, keyfile = self.determine_ssl_files_paths(options)
            dir_path, root = os.path.split(certfile)
            root, _ = os.path.splitext(root)
            try:
                from werkzeug.serving import make_ssl_devcert

                if os.path.exists(certfile) and os.path.exists(keyfile):
                    ssl_context = (certfile, keyfile)
                else:  # Create cert, key files ourselves.
                    ssl_context = make_ssl_devcert(
                        os.path.join(dir_path, root), host="localhost"
                    )
            except ImportError:
                if self.show_startup_messages:
                    print(
                        "Werkzeug version is less than 0.9, trying adhoc certificate."
                    )
                ssl_context = "adhoc"

        else:
            ssl_context = None

        bind_url = "%s://%s:%s/" % (
            "https" if ssl_context else "http",
            self.addr if not self._raw_ipv6 else "[%s]" % self.addr,
            self.port,
        )

        if self.show_startup_messages:
            print(
                "\nDjango version %s, using settings %r"
                % (django.get_version(), settings.SETTINGS_MODULE)
            )
            print("Development server is running at %s" % (bind_url,))
            print("Using the Werkzeug debugger (http://werkzeug.pocoo.org/)")
            print("Quit the server with %s." % quit_command)

        if open_browser:
            import webbrowser

            webbrowser.open(bind_url)

        if use_reloader and settings.USE_I18N:
            extra_files.extend(
                filter(lambda filename: filename.endswith(".mo"), gen_filenames())
            )

        if settings.DEBUG:
            # Werkzeug needs to be clued in its the main instance if running
            # without reloader or else it won't show key.
            # https://git.io/vVIgo
            if not use_reloader:
                os.environ["WERKZEUG_RUN_MAIN"] = "true"

            # Don't run a second instance of the debugger / reloader
            # See also: https://github.com/django-extensions/django-extensions/issues/832
            if os.environ.get("WERKZEUG_RUN_MAIN") != "true":
                if self.nopin:
                    os.environ["WERKZEUG_DEBUG_PIN"] = "off"
                handler = DebuggedApplication(handler, True)

        run_simple(
            self.addr,
            int(self.port),
            handler,
            use_reloader=use_reloader,
            use_debugger=settings.DEBUG,
            extra_files=extra_files,
            reloader_interval=reloader_interval,
            reloader_type=reloader_type,
            threaded=threaded,
            request_handler=WSGIRequestHandler,
            ssl_context=ssl_context,
        )

    def check(self, *args, **kwargs):
        if not self.skip_checks:
            return super().check(*args, **kwargs)

    def check_migrations(self, *args, **kwargs):
        if not self.skip_checks:
            return super().check_migrations(*args, **kwargs)
