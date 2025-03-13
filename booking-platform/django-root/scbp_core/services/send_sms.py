import logging

from django.conf import settings
import requests
from rest_framework.exceptions import APIException
from rest_framework.status import HTTP_500_INTERNAL_SERVER_ERROR


class SmsServerException(APIException):
    status_code = HTTP_500_INTERNAL_SERVER_ERROR
    default_detail = "Server not configured to send SMS messages"
    default_code = "internal_server_error"


def send_sms(*, mobile, message):
    # Avoid sending spurious messages in dev environments
    # without affecting staging/production
    if hasattr(settings, "REDIRECT_SMS_TO"):
        message = f"[Recipient: {mobile}] {message}"
        mobile = settings.REDIRECT_SMS_TO
    if not settings.DEBUG:
        url = "https://api.esendex.com/v1.0/messagedispatcher"
        data = {
            "accountreference": settings.ESENDEX_ACCOUNT_REFERENCE,
            "messages": [{"to": mobile, "body": message}],
        }
        response = requests.post(
            url, json=data, auth=(settings.ESENDEX_USER, settings.ESENDEX_PASSWORD)
        )
        if response.status_code != requests.codes.ok:
            raise SmsServerException(code=response.status_code)
    else:
        logging.getLogger("debug").info(f"Sending mobile msg: {mobile} {message}")
