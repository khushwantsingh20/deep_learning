"""
Django settings common to all environments

For the full list of settings and their values, see
https://docs.djangoproject.com/en/dev/topics/settings/
"""

from distutils.util import strtobool as _strtobool
import json
import os as _os
from pathlib import Path
import sys as _sys
from typing import Optional

from django.conf.global_settings import (
    DATETIME_INPUT_FORMATS as DEFAULT_DATETIME_INPUT_FORMATS,
)
from dotenv import load_dotenv
import pytz
import sentry_sdk
from sentry_sdk.integrations.celery import CeleryIntegration
from sentry_sdk.integrations.django import DjangoIntegration
from sentry_sdk.integrations.redis import RedisIntegration

load_dotenv()


class _NOT_PROVIDED:
    pass


def get_env_setting(env_var, default: Optional[str] = _NOT_PROVIDED):
    """
    Get an environment setting or raise an exception if no default was specified
    :param env_var: enviroment variable or list of environment variables; will return the value of the first found (even if value is empty)
    :param default:
    """
    if (
        default is not _NOT_PROVIDED
        and default is not None
        and not isinstance(default, str)
    ):
        # we enforce this to avoid unexpected type errors when env vars are actually set;
        # an env var value will always be a string
        # we allow None to indicate that something wasn't present
        import django.core.exceptions

        raise django.core.exceptions.ImproperlyConfigured(
            "get_env_setting default values must be strings"
        )

    env_vars = [env_var] if isinstance(env_var, str) else env_var

    x = default
    for env_var in env_vars:
        if env_var in _os.environ:
            x = _os.environ[env_var]
            break
    if x is _NOT_PROVIDED:
        error_msg = "Environment variable(s) %s not set" % (", ".join(env_vars))
        import django.core.exceptions

        raise django.core.exceptions.ImproperlyConfigured(error_msg)
    return x


# ----------------------------------------------------------------------------------------------------------------------
# Core Site configuration


# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = False

# Use debug webpack server? (if not, will assume prod webpack build)
DEBUG_WEBPACK = False

# Are we currently running in an environment where automated tests may be run? (this includes dev)
AUTOMATED_TESTS = False

# Allowed hosts when DEBUG is on
ALLOWED_HOSTS = []

# wsgi application (only applies to django runserver)
WSGI_APPLICATION = "wsgi.application"

# Add this to your base template to alter styling based on the environment
# (eg change background colour depending on whether prod/stage/dev)
BODY_ENV_CLASS = "env-unknown"


# ----------------------------------------------------------------------------------------------------------------------
# Basic path configuration

# Absolute filesystem path to the Django project root directory (the directory that contains the site module)
BASE_DIR = Path(__file__).resolve().parents[2]

# Absolute filesystem path to the top-level project folder (usually the root of the git repo)
PROJECT_DIR = BASE_DIR.parent

# Site name
SITE_NAME = BASE_DIR.name

# Add our project to our pythonpath, this way we don't need to type our project
# name in our dotted import paths:
_sys.path.insert(0, str(BASE_DIR))

SITE_URL = ""


# ----------------------------------------------------------------------------------------------------------------------
# Manager configuration
# See: https://docs.djangoproject.com/en/dev/ref/settings/#admins
# These people will get error emails
ADMINS = (
    # ('Receipient', 'address@alliancesoftware.com.au'),
)

# See: https://docs.djangoproject.com/en/dev/ref/settings/#managers
# Will get broken link notifications if BrokenLinkEmailsMiddleware is enabled
MANAGERS = ADMINS


# ----------------------------------------------------------------------------------------------------------------------
# Application definition

INSTALLED_APPS = (
    # order matters!
    # static files/templates/commands all go to the first app listed that matches
    # however model dependencies need to be constructed in order
    # project specific
    "django_site",
    "scbp_core",
    # 3rd party
    "allianceutils",
    "corsheaders",
    "django_extensions",
    "django_filters",
    "django_inlinecss",
    "djrad",
    "djrad_rest",
    "escapejson",
    "hijack",
    "rest_framework",
    "rules.apps.AutodiscoverRulesConfig",
    "webpack_loader",
    # core django
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.humanize",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
)

# These apps are purely for test purposes; apps containing *only* Models purely for testing should be added here
# see https://code.djangoproject.com/ticket/7835
# (@isolate_apps doesn't help because it won't run migrations)
# These will NOT be activated on live so be careful about side effects or live may fail even if CI passes
TEST_MODEL_APPS = ("csv_permissions.test_csv_permissions",)

# Order matters!
# See https://docs.djangoproject.com/en/1.11/ref/middleware/#middleware-ordering
MIDDLEWARE = (
    "django.middleware.security.SecurityMiddleware",  # various security, ssl settings (django >=1.9)
    "corsheaders.middleware.CorsMiddleware",
    # 'whitenoise.middleware.WhiteNoiseMiddleware',           # static file serving (only if necessary & using a CDN; using nginx is better)
    "allianceutils.middleware.QueryCountMiddleware",
    # 'django.middleware.gzip.GZipMiddleware',                # compress responses. Consider @gzip_page() instead
    # 'django.middleware.http.ConditionalGetMiddleware',      # conditional etag caching
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    # 'django.middleware.common.BrokenLinkEmailsMiddleware',
    # 'allianceutils.middleware.CurrentUserMiddleware',
    "hijack.middleware.HijackUserMiddleware",
    "django_site.middleware.CurrentUserMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
    # 'django.contrib.flatpages.middleware.FlatpageFallbackMiddleware', # fall back to static html on 404
    # 'django.contrib.redirects.middleware.RedirectFallbackMiddleware', # fall back to redirect on 404
)

DEFAULT_AUTO_FIELD = "django.db.models.AutoField"

# ----------------------------------------------------------------------------------------------------------------------
# URL configuration

# Append missing / to requests and redirect?
APPEND_SLASH = True
# Prepend missing www. to requests and redirect?
PREPEND_WWW = False

# Site root urls
ROOT_URLCONF = "django_site.urls"


# ----------------------------------------------------------------------------------------------------------------------
# Template configuration
TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [
            # global template dirs
        ],
        # 'APP_DIRS': True,
        "OPTIONS": {
            "context_processors": [
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                # project-specific custom global context processors
            ],
            "debug": DEBUG,
            # Only one of APP_DIRS and loaders should be set
            "loaders": [
                # 'apptemplates.Loader',
                "django.template.loaders.filesystem.Loader",
                "django.template.loaders.app_directories.Loader",
            ],
        },
    }
]


# ----------------------------------------------------------------------------------------------------------------------
# Database Configuration
# https://docs.djangoproject.com/en/dev/ref/settings/#databases

DATABASES = {
    "default": {
        # postgres
        "ENGINE": "django.db.backends.postgresql",
        "TEST": {
            # Test case serializion is only used for emulating rollbacks in test cases if the DB doesn't support it.
            # Both postgres & mysql+innodb support real transactions so this does nothing except slow things down.
            # Additionally, if you override _default_manager to have extra restrictions then this can cause issues
            #   since BaseDatabaseCreation.serialize_db_to_string() uses _default_manager and not _base_manager
            "SERIALIZE": False
        },
        # mysql
        # 'ENGINE': 'django.db.backends.mysql',
        # 'OPTIONS': {
        #     'init_command': 'SET default_storage_engine=INNODB',
        #     'read_default_file': '~/.my.cnf',
        #     'charset': 'utf8mb4',
        # },
    }
}

if _strtobool(get_env_setting("LEGACY_APP_ACTIVATE", "False")):
    # Requires brew install freetds on osx
    DATABASES["legacy"] = {
        "ENGINE": "sql_server.pyodbc",
        "NAME": get_env_setting("LEGACY_DB_NAME"),
        "USER": get_env_setting("LEGACY_DB_USER", "master"),
        "PASSWORD": get_env_setting("LEGACY_DB_PASSWORD"),
        "HOST": get_env_setting("LEGACY_DB_HOST"),
        "PORT": "1433",
        "OPTIONS": {"driver": "ODBC Driver 17 for SQL Server", "host_is_server": True},
    }

    DATABASES["legacy_orchard"] = {
        "ENGINE": "sql_server.pyodbc",
        "NAME": "orchard-prod",
        "USER": get_env_setting("LEGACY_DB_USER", "master"),
        "PASSWORD": get_env_setting("LEGACY_DB_PASSWORD"),
        "HOST": get_env_setting("LEGACY_DB_HOST"),
        "PORT": "1433",
        "OPTIONS": {"driver": "ODBC Driver 17 for SQL Server", "host_is_server": True},
    }

    # This database is used by current website
    DATABASES["legacy_services"] = {
        "ENGINE": "sql_server.pyodbc",
        "NAME": "services-beta",
        "USER": get_env_setting("LEGACY_DB_USER", "master"),
        "PASSWORD": get_env_setting("LEGACY_DB_PASSWORD"),
        "HOST": get_env_setting("LEGACY_DB_HOST"),
        "PORT": "1433",
        "OPTIONS": {"driver": "ODBC Driver 17 for SQL Server", "host_is_server": True},
    }

    DATABASE_ROUTERS = ["django_site.db_router.ScLegacyDbRouter"]

    INSTALLED_APPS += ("scbp_legacy",)


# How many DB queries before QueryCountMiddleware raises a warning?
QUERY_COUNT_WARNING_THRESHOLD = 40

# ----------------------------------------------------------------------------------------------------------------------
# Internationalization
# https://docs.djangoproject.com/en/1.11/topics/i18n/


# Guess timezone info dir and burst pytz cache so that it'll re-read all tz info from desired location
def guess_tz_dir():
    if get_env_setting("PYTZ_TZDATADIR", None):
        return get_env_setting("PYTZ_TZDATADIR")

    MODERN_LINUX_BSD_OSX_TZ_DIR = "/usr/share/zoneinfo/"
    MODERN_AIX_SOLARIS_HPUX_DIR = "/usr/share/lib/zoneinfo/"
    LIBC4_COMPAT = "/usr/lib/zoneinfo/"
    GLIBC2_COMPAT = get_env_setting("TZDIR", None)

    for tzdir in [
        MODERN_LINUX_BSD_OSX_TZ_DIR,
        MODERN_AIX_SOLARIS_HPUX_DIR,
        LIBC4_COMPAT,
        GLIBC2_COMPAT,
    ]:
        if _os.path.exists(tzdir) and _os.path.isdir(tzdir):
            return tzdir
    else:
        import django

        raise django.core.exceptions.ImproperlyConfigured(
            "Unable to guess OS timezone data folder. Please specify PYTZ_TZDATADIR."
        )


_os.environ.setdefault("PYTZ_TZDATADIR", guess_tz_dir())
pytz._tzinfo_cache = {}

LANGUAGE_CODE = "en-au"

TIME_ZONE = "Australia/Melbourne"

USE_TZ = True

# Enable translations?
USE_I18N = False

# Enable locale-aware date/time/currency/number formatting
USE_L10N = False

# only applies if USE_L10N is on (and humanize template tags are used)
# USE_THOUSAND_SEPARATOR = True


# ----------------------------------------------------------------------------------------------------------------------
# Date formats

# Application-specific date formats
# If USE_L10N is on you may want to consider using django.util.formats.date_format(..)
# For adding custom formats: https://docs.djangoproject.com/en/dev/topics/i18n/formatting/#creating-custom-format-files

# http://strftime.org/
FORMAT_DATE = "%-d %b %Y"  # 5 Oct 2017
FORMAT_DATE_SHORT = "%-d/%m/%Y"  # 5/10/2006

FORMAT_DATE_WEEKDAY = "%a %-d %b %Y"  # Thu 5 Oct 2017
FORMAT_DATE_YEAR_MONTH = "%b %Y"  # Oct 2017
FORMAT_DATE_MONTH_DAY = "%-d %b"  # 5 Oct

FORMAT_DATETIME = "%Y-%m-%d %H:%M:%S"  # 2017-10-05 01:23:45
FORMAT_DATETIME_SHORT = "%-d/%m/%Y %-I:%M:%S %p"  # 5/10/2006 1:23:45 am

FORMAT_DATE_ISO = "%Y-%m-%d"  # 2017-10-05
FORMAT_DATETIME_ISO = "%Y-%m-%d %H:%M:%S"  # 2017-10-05 01:23:45

FORMAT_DATE_COMPACT = "%Y%m%d"  # 20171005
FORMAT_DATETIME_COMPACT = "%Y%m%.d%H%M%S"  # 20171005.012345

if not USE_L10N:
    # Django date formats (used in templates only)
    # These only apply if USE_L10N is off
    from allianceutils.util import (
        python_to_django_date_format as _python_to_django_date_format,
    )

    # See https://docs.djangoproject.com/en/dev/ref/templates/builtins/#std:templatefilter-date for format
    DATE_FORMAT = _python_to_django_date_format(FORMAT_DATE)
    DATETIME_FORMAT = _python_to_django_date_format(FORMAT_DATETIME)
    YEAR_MONTH_FORMAT = _python_to_django_date_format(FORMAT_DATE_YEAR_MONTH)
    MONTH_DAY_FORMAT = _python_to_django_date_format(FORMAT_DATE_MONTH_DAY)
    SHORT_DATE_FORMAT = _python_to_django_date_format(FORMAT_DATE_SHORT)
    SHORT_DATETIME_FORMAT = _python_to_django_date_format(FORMAT_DATETIME_SHORT)


# ----------------------------------------------------------------------------------------------------------------------
# Upload dirs

# Use S3 for file storage
# https://django-storages.readthedocs.io/en/latest/backends/amazon-S3.html
# TODO: allianceutils.storage.MediaStorage is wrapper to django-storages; need test cases for this
DEFAULT_FILE_STORAGE = "django_site.storage.MediaStorage"
# This is used as a prefix for media files in the S3 bucket
MEDIAFILES_LOCATION = "media"
AWS_DEFAULT_REGION = "ap-southeast-2"
AWS_HEADERS = {"Cache-Control": "max-age=86400"}
# This disables query string auth which we don't need for media files as they
# are publicly accessible. If we need private files later we may need to revisit
# this
AWS_QUERYSTRING_AUTH = False
AWS_ACCESS_KEY_ID = get_env_setting("AWS_ACCESS_KEY")
AWS_SECRET_ACCESS_KEY = get_env_setting("AWS_SECRET_ACCESS_KEY")
AWS_STORAGE_BUCKET_NAME = get_env_setting("AWS_BUCKET")
AWS_DEFAULT_ACL = None
MEDIA_URL = f"https://{AWS_STORAGE_BUCKET_NAME}.s3.amazonaws.com/{MEDIAFILES_LOCATION}/"

# ----------------------------------------------------------------------------------------------------------------------
# Static files (CSS, JavaScript, Images)
# https://docs.djangoproject.com/en/1.11/howto/static-files/

STATIC_ROOT = (PROJECT_DIR / "assets").resolve()

STATIC_URL = "/assets/"

# non-app static file locations
FRONTEND_PRODUCTION_DIR = PROJECT_DIR / "frontend/dist"
# Create production dir if it doesn't exist otherwise static files finder will complain
if not FRONTEND_PRODUCTION_DIR.exists():
    FRONTEND_PRODUCTION_DIR.mkdir(parents=True)

STATICFILES_DIRS = (
    ("dist", FRONTEND_PRODUCTION_DIR),
    # Path(PROJECT_DIR, 'node_modules/bootstrap-sass/assets/stylesheets'),
)

STATICFILES_FINDERS = (
    "django.contrib.staticfiles.finders.FileSystemFinder",
    "django.contrib.staticfiles.finders.AppDirectoriesFinder",
    "djrad.finders.DjradStaticMetaDataFinder",
    # 'compressor.finders.CompressorFinder',
)
INLINECSS_CSS_LOADER = "django_inlinecss.css_loaders.StaticfilesFinderCSSLoader"

# Uncomment this to store static files on S3.
# Note that this causes problems with heroku pipelines as the promotion doesn't take care of static files.
# STATICFILES_STORAGE = 'allianceutils.storage.StaticStorage'
# This is used as a prefix for static files in the S3 bucket
# STATICFILES_LOCATION = 'static'

# Add hashes to static assets. This is particularly important with djrad to ensure the
# metadata files get cache busting.
# We only set this in production as it can't be used when running unittests. When DEBUG=False
# it doesn't do anything so it's fine for dev but unittests run with DEBUG=True.
# STATICFILES_STORAGE = 'django.contrib.staticfiles.storage.ManifestStaticFilesStorage'

# generated by webpack automatically (see: webpack.generic.config.js)
VERSION_JSON_FILE = Path(PROJECT_DIR, "frontend/dist/version.json")

# Used by https://gitlab.internal.alliancesoftware.com.au/alliance/alliance-django-utils/#render_entry_point
WEBPACK_LOADER = {
    "DEFAULT": {"STATS_FILE": PROJECT_DIR / "frontend/dist/webpack-stats.json"}
}

# - We don't use django-compress' minifier since webpack production build has already done that for us
# - django module JS files are small enough to not worry about minification
# => Concatenating & gzipping the output is the only thing django-compress needs to do
# COMPRESS_JS_FILTERS = []
# COMPRESS_STORAGE = 'compressor.storage.GzipCompressorFileStorage'


# ----------------------------------------------------------------------------------------------------------------------
# SECRET_KEY

# (entirely in dev/prod)


# ----------------------------------------------------------------------------------------------------------------------
# User auth/permissions configuration
AUTH_USER_MODEL = "scbp_core.User"

AUTHENTICATION_BACKENDS = (
    "csv_permissions.permissions.CSVPermissionsBackend",
    "django_site.backends.ProfileModelBackend",
    "rules.permissions.ObjectPermissionBackend",
)

# See: https://docs.djangoproject.com/en/2.2/topics/auth/passwords/#password-validation
AUTH_PASSWORD_VALIDATORS = [
    {
        "NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"
    },
    {
        "NAME": "django.contrib.auth.password_validation.MinimumLengthValidator",
        "OPTIONS": {"min_length": 8},
    },
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

# Contains all permissions for this site.
# NOTE: Content is cached and may require server reload if changed. This should happen
# automatically when the CSVf ile is written to. See DjangoSiteAppConfig for where this
# is setup.
CSV_PERMISSIONS_PATH = BASE_DIR / "django_site/resources/PermissionMatrix.csv"

LOGIN_URL = "/login/"
LOGIN_REDIRECT_URL = "/"
# LOGOUT_REDIRECT_URL = '...'

# Hijack
HIJACK_ALLOW_GET_REQUESTS = False
HIJACK_AUTHORIZE_STAFF = False
HIJACK_USE_BOOTSTRAP = True
# Determines who can access the hijack URL
HIJACK_PERMISSION_CHECK = "scbp_core.permissions.superusers_and_staff"
# Determines function to call to determine whether or not user will get a 403 when attempting to hijack
HIJACK_AUTHORIZATION_CHECK = "scbp_core.rules.can_hijack"
# We don't use this explicitly as we call the API from the frontend then redirect
# in javascript (see UserImpersonateView) - but we do check this in test cases
HIJACK_LOGIN_REDIRECT_URL = "/"

# CORS Handling
# Django-cors-headers is installed by default but not accepting any CORS requests
# If you need to grant CORS to cross origins, config it as described in https://github.com/ottoyiu/django-cors-headers
CORS_ORIGIN_WHITELIST = ()


# ----------------------------------------------------------------------------------------------------------------------
# Logging

LOG_DIR = PROJECT_DIR / "log"
assert LOG_DIR.exists(), "%s does not exist" % LOG_DIR

# to debug this use 'manage.py print_logging' provided by allianceutils
LOGGING = {
    "version": 1,
    "disable_existing_loggers": True,
    "formatters": {
        "simple": {
            "format": "[%(asctime)s] %(levelname)s %(message)s",
            "datefmt": FORMAT_DATETIME,
        },
        "simple_request": {
            "format": "[%(asctime)s] %(levelname)s %(status_code)s %(message)s",
            "datefmt": FORMAT_DATETIME,
        },
        "verbose": {
            "format": "[%(asctime)s] %(levelname)s %(module)s %(process)d %(thread)d [%(name)s:%(lineno)s] %(message)s",
            "datefmt": FORMAT_DATETIME,
        },
    },
    "filters": {
        "require_debug_false": {"()": "django.utils.log.RequireDebugFalse"},
        "require_debug_true": {"()": "django.utils.log.RequireDebugTrue"},
    },
    "handlers": {
        "null": {"class": "logging.NullHandler"},
        "console": {
            "level": "INFO",
            "class": "logging.StreamHandler",
            "formatter": "simple",
        },
        "celery_debug": {
            "level": "DEBUG",
            "class": "logging.handlers.RotatingFileHandler",
            "filename": LOG_DIR / "celery.log",
            "maxBytes": 10 * 1000 * 1000,
            "backupCount": 1,
            "formatter": "verbose",
        },
        "file_debug": {
            "level": "DEBUG",
            "class": "logging.handlers.RotatingFileHandler",
            "filename": LOG_DIR / "debug.log",
            "maxBytes": 10 * 1000 * 1000,
            "backupCount": 1,
            "formatter": "verbose",
        },
        "file_error": {
            "level": "WARNING",
            "class": "logging.handlers.RotatingFileHandler",
            "filename": LOG_DIR / "error.log",
            "maxBytes": 10 * 1000 * 1000,
            "backupCount": 10,
            "formatter": "verbose",
        },
        "file_request": {
            "level": "DEBUG",
            "class": "logging.handlers.RotatingFileHandler",
            "filename": LOG_DIR / "request.log",
            "maxBytes": 100 * 1000 * 1000,
            "backupCount": 4,
            "formatter": "simple_request",
        },
        "mail_admins": {
            "level": "ERROR",
            "filters": ["require_debug_false"],
            "class": "django.utils.log.AdminEmailHandler",
        },
        "legacy_migration_file": {
            "level": "DEBUG",
            "class": "logging.handlers.RotatingFileHandler",
            "filename": LOG_DIR / "legacy_migration.log",
            "maxBytes": 10 * 1000 * 1000,
            "backupCount": 10000,
            "formatter": "verbose",
        },
    },
    "loggers": {
        # user debugging logs
        "debug": {"handlers": ["console"], "level": "DEBUG", "propagate": False},
        # django catch-all
        "django": {
            "handlers": ["console", "mail_admins"],
            "level": "WARNING",
            "propagate": False,
        },
        # web requests (5xx=error, 4xx=warning, 3xx/2xx=info)
        "django.request": {"handlers": ["console"], "level": "INFO", "propagate": True},
        "django.utils.autoreload": {
            "handlers": ["console"],
            "level": "INFO",
            "propagate": True,
        },
        # todo: what is this used for?
        "net": {
            "handlers": ["mail_admins", "file_request"],
            "level": "INFO",
            "propagate": True,
        },
        "payment": {
            "handlers": ["console", "file_error"],
            "level": "WARNING",
            "propagate": True,
        },
        "google_maps": {
            "handlers": ["console", "file_error"],
            "level": "WARNING",
            "propagate": True,
        },
        "py.warnings": {
            "handlers": ["console", "file_error"],
            "level": "DEBUG",
            "propagate": True,
        },
        # Sometimes monitoring triggers this and you will want to disable it
        # (although really you should configure the web server to deal with such requests)
        # 'django.security.DisallowedHost': {
        #     'handlers': ['file_request'],
        #     'propagate': False,
        # },
        # dev server request handling (runserver / runserver_plus)
        "django.server": {  # for runserver; only works from 1.10+ (was hardcoded to stderr before that)
            "handlers": ["console"],
            "level": "DEBUG",
            "propagate": False,
        },
        # Errors from user signup
        "registration": {
            "handlers": ["mail_admins"],
            "level": "ERROR",
            "propagate": True,
        },
        "werkzeug": {  # for runserver_plus
            "handlers": ["console"],
            "level": "DEBUG",
            "propagate": False,
        },
        "celery": {
            "handlers": ["mail_admins", "console", "file_error", "celery_debug"],
            "level": "DEBUG",
            "propagate": False,
        },
        "legacy_migration": {
            "handlers": ["legacy_migration_file", "console"],
            "level": "DEBUG",
            "propagate": False,
        },
    },
}

# ----------------------------------------------------------------------------------------------------------------------
# Sentry logging

SENTRY_DSN_PYTHON = get_env_setting("SENTRY_DSN_PYTHON", None)


def setup_sentry(environment, version_file=VERSION_JSON_FILE):
    if SENTRY_DSN_PYTHON:
        try:
            with open(version_file) as f:
                data = json.loads(f.read())
                release = data.get("version")
        except FileNotFoundError:
            release = None
        if not release:
            print(
                f"Release could not be determined from {version_file}. Sentry errors will not be tagged with a release"
            )
        sentry_sdk.init(
            dsn=SENTRY_DSN_PYTHON,
            integrations=[DjangoIntegration(), CeleryIntegration(), RedisIntegration()],
            # This sends user data - specifically email and id
            send_default_pii=True,
            environment=environment,
            release=release,
        )


# ----------------------------------------------------------------------------------------------------------------------
# Email

# (entirely configured in prod/dev)


# ----------------------------------------------------------------------------------------------------------------------
# APIs
REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": (
        # we prioritise BasicAuthentication so that we can distinguish logged out (401) vs permission denied (403)
        # http response codes; our code doesn't actually use http basic authentication
        "djrad_rest.authentication.BasicAuthentication",
        "rest_framework.authentication.SessionAuthentication",
    ),
    "DEFAULT_PERMISSION_CLASSES": (
        # default to requiring authentication & a role
        # you can override this by setting the permission_classes to AllowAny in the view
        "rest_framework.permissions.IsAuthenticated",
        "allianceutils.api.permissions.SimpleDjangoObjectPermissions",
    ),
    "DEFAULT_RENDERER_CLASSES": (
        "djrad_rest.renderers.EntitiesCamelCaseJSONRenderer",
        "rest_framework.renderers.BrowsableAPIRenderer",
        # Any other renders
    ),
}


# ----------------------------------------------------------------------------------------------------------------------
# Form Rendering
# DAB_FIELD_RENDERER = 'django_admin_bootstrapped.renderers.BootstrapFieldRenderer'

# django-filter
# Disable all help text unless explicitly include
# FILTERS_HELP_TEXT_EXCLUDE = False
# FILTERS_HELP_TEXT_FILTER = False


# ----------------------------------------------------------------------------------------------------------------------
# CKEditor
# CKEDITOR_IMAGE_BACKEND = 'pillow'
# CKEDITOR_UPLOAD_PATH = 'ckeditor/uploads/'
# CKEDITOR_BROWSE_SHOW_DIRS = True
# CKEDITOR_ALLOW_NONIMAGE_FILES = False
# CKEDITOR_CONFIGS = {
#     'default': {
#         'toolbar': [
#             ["Format", "Bold", "Italic", "Underline", "Strike", "SpellChecker"],
#             ['NumberedList', 'BulletedList', "Indent", "Outdent", 'JustifyLeft', 'JustifyCenter', 'JustifyRight',
#              'JustifyBlock'],
#             ["Image", "Table", "Link", "Unlink", "Anchor", "SectionLink", "Subscript", "Superscript"],
#             ['Undo', 'Redo'], ["Source"],
#             ["Maximize"]
#         ],
#     },
# }

# ----------------------------------------------------------------------------------------------------------------------
# django-permanent field
# PERMANENT_FIELD = 'deleted_at'


# ----------------------------------------------------------------------------------------------------------------------
# Project level settings

# These should not be used to determine field lengths, use field.max_length
# These are intended for use by models to declare their max_length
MAX_LENGTH_NAME = 100
MAX_LENGTH_SHORT_DESCRIPTION = 300
MAX_LENGTH_POSTCODE = 20


# ----------------------------------------------------------------------------------------------------------------------
# Frontend Testing Settings

# "MOCK_DATE_START="2017-01-01T10:00:00Z" ./manage.py runserver" to run server with system clock mocked out for testing
_start_time = get_env_setting("MOCK_DATE_START", "")
if _start_time:
    import freezegun as _freezegun

    _freezegun.freeze_time(_start_time, tick=True).start()
    print("Mocked out system clock to start at %s\n" % _start_time, file=_sys.stderr)


DJRAD_SITES = [
    "scbp_core.djrad.sites.app_site",
    "scbp_core.djrad.sites.admin_site",
    "scbp_core.djrad.sites.driver_site",
]

DJRAD_STATIC_FILES_TEMP_LOCATION = PROJECT_DIR / "django-root/temp/"

DISABLE_DJRAD_DEVTOOLS = _strtobool(get_env_setting("DISABLE_DJRAD_DEVTOOLS", "False"))

# ----------------------------------------------------------------------------------------------------------------------
# User Sign-up
# The number of days the activation link is valid for
USER_ACTIVATION_TOKEN_MAX_AGE_DAYS = 5

# Password Reset
# The number of days the password reset link is valid for
PASSWORD_RESET_TOKEN_MAX_AGE_DAYS = 1

# The secret key used to encrypt the password reset token
PASSWORD_RESET_TOKEN_KEY = get_env_setting("PASSWORD_RESET_TOKEN_KEY", "")

# ----------------------------------------------------------------------------------------------------------------------

GOOGLE_API_FRONTEND_KEY = get_env_setting("GOOGLE_API_KEY", "")
GOOGLE_API_SERVER_KEY = get_env_setting("GOOGLE_API_SERVER_KEY", "")
GOOGLE_SHEETS_CREDENTIALS = get_env_setting("GOOGLE_SHEETS_CREDENTIALS", "")
SKIP_GOOGLE_API_TESTS = _strtobool(get_env_setting("SKIP_GOOGLE_API_TESTS", "False"))

ESENDEX_USER = get_env_setting("ESENDEX_USER", "")
ESENDEX_PASSWORD = get_env_setting("ESENDEX_PASSWORD", "")
ESENDEX_ACCOUNT_REFERENCE = get_env_setting("ESENDEX_ACCOUNT_REFERENCE", "")


WKHTML_TO_PDF_PATH = get_env_setting("WKHTML_TO_PDF_PATH", None)

EWAY_API_KEY = get_env_setting("EWAY_API_KEY")
EWAY_API_KEY_PASSWORD = get_env_setting("EWAY_API_KEY_PASSWORD")
EWAY_CLIENT_SIDE_ENCRYPTION_KEY = get_env_setting("EWAY_CLIENT_SIDE_ENCRYPTION_KEY")
EWAY_API_SANDBOX_ENABLED = False


CAMPAIGN_MONITOR_API_KEY = get_env_setting("CAMPAIGN_MONITOR_API_KEY", None)
CAMPAIGN_MONITOR_LIST_ID = get_env_setting(
    "CAMPAIGN_MONITOR_LIST_ID", _NOT_PROVIDED if CAMPAIGN_MONITOR_API_KEY else None
)

# ----------------------------------------------------------------------------------------------------------------------
# Celery Configuration

CELERY_BROKER_URL = get_env_setting("CELERY_BROKER_URL", "NOT SET")
CELERY_TIMEZONE = TIME_ZONE
# 10 hour upper limit on task just so worker can't be permanently locked. Tasks should
# be written such that any external processes have a timeout (eg. if doing web requests).
CELERYD_TASK_TIME_LIMIT = 10 * 60 * 60

# Used as email for legacy clients that have no email address set
LEGACY_CLIENT_EMAIL_ADDRESS_TEMPLATE = "SCLegacyClient+CLIENT-{}@gmail.com"
LEGACY_CONTACT_EMAIL_ADDRESS_TEMPLATE = "SCLegacyClient+CONTACT-{}@gmail.com"
LEGACY_DRIVER_EMAIL_ADDRESS_TEMPLATE = "SCLegacyClient+DRIVER-{}@gmail.com"

DATETIME_INPUT_FORMATS = DEFAULT_DATETIME_INPUT_FORMATS + ["%Y-%m-%dT%H:%M:%S%z"]
