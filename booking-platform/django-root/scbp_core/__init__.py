from django.conf import settings
from firebase_admin import credentials
from firebase_admin import initialize_app

default_app_config = "scbp_core.apps.ScbpAppConfig"

if hasattr(settings, "FIREBASE_PRIVATE_KEY_ID"):
    # Note keys used here is SHARED between dev/prod mode of firebase.
    cred = credentials.Certificate(
        {
            "type": "service_account",
            "project_id": "limomate-9e7da",
            "private_key_id": settings.FIREBASE_PRIVATE_KEY_ID,
            "private_key": settings.FIREBASE_PRIVATE_KEY.replace("\\n", "\n"),
            "client_email": "firebase-adminsdk-d9twj@limomate-9e7da.iam.gserviceaccount.com",
            "client_id": "100083217416086322399",
            "auth_uri": "https://accounts.google.com/o/oauth2/auth",
            "token_uri": "https://oauth2.googleapis.com/token",
            "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
            "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-d9twj%40limomate-9e7da.iam.gserviceaccount.com",
        }
    )
    initialize_app(cred)
