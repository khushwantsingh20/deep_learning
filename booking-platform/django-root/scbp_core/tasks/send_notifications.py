from celery import shared_task
from django.conf import settings
from firebase_admin import messaging
from firebase_admin.exceptions import InvalidArgumentError
from firebase_admin.messaging import UnregisteredError

from scbp_core.models import ClientUser


@shared_task
def send_message_to_user(user, title, message, in_app_message="", link=""):
    """
    sends a FCM based notification to all devices attached to given user.
    title and message are self-explanatory, in_app_message is the message would be shown if user's currently within app,
    and link is a relative link based on the CORE URL of user's app (ie, send "accounts/1" instead of "https://blahblah.com/accounts/1")
    """
    if not hasattr(settings, "FIREBASE_PRIVATE_KEY_ID"):
        return  # if firebase's off for some reason, eg CI, dont do anything

    if not in_app_message:
        in_app_message = message

    try:
        user = ClientUser.objects.get(id=user)
    except ClientUser.DoesNotExist:
        return

    for token in user.mobile_tokens.all():
        message = messaging.Message(
            notification=messaging.Notification(title=title, body=message),
            data={"payload": link, "message": in_app_message},
            token=token.token,
        )
        try:
            messaging.send(message)
        except InvalidArgumentError:
            token.delete()
        except UnregisteredError:
            token.delete()
