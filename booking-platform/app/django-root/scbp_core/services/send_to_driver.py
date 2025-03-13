from django.conf import settings
from django.core.mail import send_mail
from django.utils.html import urlize


def send_email(*, email, subject, message):
    send_mail(subject, "", settings.SERVER_EMAIL, [email], html_message=urlize(message))
