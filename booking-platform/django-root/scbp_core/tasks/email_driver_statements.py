import calendar

from celery import shared_task
from django.conf import settings
from django.core.mail import EmailMessage
from django.core.mail import get_connection
from django.db.models import Q
from django.template.loader import render_to_string

from scbp_core.models import DriverUser
from scbp_core.services.generate_driver_statement_pdf import (
    generate_driver_statement_pdf,
)


def generate_driver_statement_email(driver, month, year, to_email=None):
    if to_email is None:
        to_email = (driver.email,)
    if not isinstance(to_email, (list, tuple)):
        to_email = [to_email]
    name_with_title = f"{driver.title or driver.first_name} {driver.last_name}"
    month_string = f"{calendar.month_name[month]} {year}"
    email_content = render_to_string(
        "email/driver_statement_email.html",
        context={
            "name_with_title": name_with_title,
            "month_string": month_string,
            "domain": settings.SITE_URL,
        },
    )
    email_params = {
        "subject": f"Limomate Driver Statement for {month_string}",
        "body": email_content,
        "to": to_email,
        "attachments": (
            (
                f"Limomate Driver Statement {driver.driver_no} {month_string}.pdf",
                generate_driver_statement_pdf(driver, month=month, year=year),
                "application/pdf",
            ),
        ),
    }
    message = EmailMessage(**email_params)
    message.content_subtype = "html"
    return message


@shared_task
def email_driver_statements(*, month, year):
    statement_emails = []
    for driver in (
        DriverUser.all_objects.exclude(
            Q(archived_at__year__lt=year)
            | Q(archived_at__year=year, archived_at__month__lt=month)
        )
        .filter(
            bookings__invoices__created_at__month=month,
            bookings__invoices__created_at__year=year,
        )
        .distinct()
    ):
        message = generate_driver_statement_email(driver, month, year)
        statement_emails.append(message)
    get_connection().send_messages(statement_emails)
