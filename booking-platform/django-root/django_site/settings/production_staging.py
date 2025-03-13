"""
Staging settings and globals
"""

from .production_base import *

# ----------------------------------------------------------------------------------------------------------------------
# Core Site configuration

ALLOWED_HOSTS = ["booking-platform-staging.herokuapp.com"]

BODY_ENV_CLASS = "env-staging"

ADMINS = (("Alliance Devs", "client-southerncross+staging@alliancesoftware.com.au"),)

SITE_URL = "https://booking-platform-staging.herokuapp.com"

# ----------------------------------------------------------------------------------------------------------------------
# Sentry logging
setup_sentry("staging")

# Google ID for the RGI spreadsheet
GOOGLE_SHEETS_RGI_ID = "1CW5-PuR5Q8GMvVSLEbXQshdMGovrrROP5n7rDfCUHUM"

FIREBASE_PRIVATE_KEY_ID = get_env_setting("FIREBASE_PRIVATE_KEY_ID")
FIREBASE_PRIVATE_KEY = get_env_setting("FIREBASE_PRIVATE_KEY")

EWAY_API_SANDBOX_ENABLED = True
