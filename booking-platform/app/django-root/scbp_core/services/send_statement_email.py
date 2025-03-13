from django.conf import settings
from django.core.mail import EmailMessage
from django.core.mail import get_connection
from django.template.loader import render_to_string

from scbp_core.services.generate_invoice_pdf import generate_statement_pdf


def statement_email_content(statement):
    name_with_title = f"{statement.account.contact_title or statement.account.contact_first_name} {statement.account.contact_last_name}"
    return render_to_string(
        "email/statement_email.html",
        context={
            "name_with_title": name_with_title,
            "start_date": statement.get_period_start(),
            "end_date": statement.get_period_end(),
            "domain": settings.SITE_URL,
        },
    )


def generate_statement_email(statement, to_email=None):
    if to_email is None:
        to_email = (statement.account.account_email,)
    if not isinstance(to_email, (list, tuple)):
        to_email = [to_email]
    params = {
        "subject": f"Limomate Account Statement {statement.statement_number}",
        "body": statement_email_content(statement),
        "to": to_email,
        "attachments": (
            (
                f"Limomate Statement {statement.statement_number}.pdf",
                generate_statement_pdf(statement),
                "application/pdf",
            ),
        ),
    }
    message = EmailMessage(**params)
    message.content_subtype = "html"
    return message


def send_statement_emails(statements):
    emails = [generate_statement_email(statement) for statement in statements]
    get_connection().send_messages(emails)
