from django.conf import settings
from django.core.mail import send_mail
from django.template.loader import render_to_string

from scbp_core.models import Account


def send_invitation_email(token, request, is_existing_user):
    email_subject = "Invitation to billing account"
    to = request.data.get("invite_email")
    # Caller always validates presence of account
    account = Account.objects.get(pk=request.data.get("account"))
    email_body = render_to_string(
        "email/account_invitation.html",
        context={
            "invitee_name": request.data.get("invite_name", "There"),
            "invitee_email": request.data.get(
                "invite_email"
            ),  # Caller always validates presence of email
            "inviter_name": request.user.get_full_name(),
            "inviter_account": account.account_nickname,
            "additional_message": request.data.get("invite_message", None),
            "invitation_url": request.build_absolute_uri("/invitation/%s/" % token),
            "domain": settings.SITE_URL,
            "is_existing_user": is_existing_user,
        },
    )
    send_mail(email_subject, "", settings.SERVER_EMAIL, [to], html_message=email_body)
