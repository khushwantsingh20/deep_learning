from django.conf import settings
from django.core.mail import EmailMessage
from django.template.loader import render_to_string
from django.utils.timezone import localtime

from scbp_core.services.generate_invoice_pdf import generate_invoice_pdf


def invoice_email_content(invoice):
    account = invoice.booking.account
    name_with_title = f"{account.contact_title or account.contact_first_name} {account.contact_last_name}"
    return render_to_string(
        "email/invoice_email.html",
        context={
            "name_with_title": name_with_title,
            "travel_time": localtime(invoice.booking.travel_on).strftime(
                "%d %B %Y at %-I:%M %p"
            ),
            "domain": settings.SITE_URL,
        },
    )


def send_invoice_email(invoice, to_email=None):
    if to_email is None:
        to_email = (invoice.booking.account.account_email,)
    if not isinstance(to_email, (list, tuple)):
        to_email = [to_email]
    params = {
        "subject": f"Limomate Account Statement {invoice.invoice_number}",
        "body": invoice_email_content(invoice),
        "to": to_email,
        "attachments": (
            (
                f"Limomate Statement {invoice.invoice_number}.pdf",
                generate_invoice_pdf(invoice),
                "application/pdf",
            ),
        ),
    }
    message = EmailMessage(**params)
    message.content_subtype = "html"
    message.send()
