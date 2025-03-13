"""
Production settings and globals
"""

from .production_base import *

# ----------------------------------------------------------------------------------------------------------------------
# Core Site configuration

ALLOWED_HOSTS = [
    "mobile.mylimomate.com.au",
    "www.mylimomate.com.au",
    "booking-platform-preprod.herokuapp.com",
]

BODY_ENV_CLASS = "env-prod"

ADMINS = (("Alliance Devs", "client-southerncross+prod@alliancesoftware.com.au"),)

SITE_URL = "https://mobile.mylimomate.com.au"

# ----------------------------------------------------------------------------------------------------------------------
# Sentry logging

setup_sentry("prod")

# Google ID for the RGI spreadsheet
GOOGLE_SHEETS_RGI_ID = "14Odu6vWrbs6W8IcBuFGV-to-5fgIzjaLXCE0pncPzHQ"

FIREBASE_PRIVATE_KEY_ID = get_env_setting("FIREBASE_PRIVATE_KEY_ID")
FIREBASE_PRIVATE_KEY = get_env_setting("FIREBASE_PRIVATE_KEY")

if get_env_setting("REDIRECT_EMAILS_TO", ""):
    REDIRECT_EMAILS_TO = get_env_setting("REDIRECT_EMAILS_TO")
    EMAIL_BACKEND = "django_site.backends.RedirectEmailBackend"

if get_env_setting("REDIRECT_SMS_TO", ""):
    REDIRECT_SMS_TO = get_env_setting("REDIRECT_SMS_TO")
