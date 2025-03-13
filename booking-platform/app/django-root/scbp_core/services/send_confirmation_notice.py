from django.db import transaction
from django.utils import timezone

from scbp_core.tasks.send_booking_confirmation_sms import send_booking_confirmation_sms


def get_schedule_message_delay(booking):  # we split this to make it unittestfriendly
    SECONDS_PER_MINUTE = 60  # right, because this's not universally true /s

    now = timezone.localtime(timezone.now())
    travel_hour = timezone.localtime(booking.travel_on).hour
    delta = (booking.travel_on - now).total_seconds() / SECONDS_PER_MINUTE

    def get_seconds_until_travel_on(minutes):
        return (
            booking.travel_on - now - timezone.timedelta(minutes=minutes)
        ).total_seconds()

    if booking.is_interstate():
        if travel_hour >= 8 and travel_hour < 22:
            if delta > 120:
                return get_seconds_until_travel_on(120)
            else:
                return 0
        else:
            # before 8pm and within 12hrs of travel time; send msg at 8pm today
            if travel_hour >= 22:
                eight_before_travel = timezone.localtime(booking.travel_on).replace(
                    hour=20, minute=0, second=0, microsecond=0
                )
            else:
                eight_before_travel = timezone.localtime(booking.travel_on).replace(
                    hour=20, minute=0, second=0, microsecond=0
                ) + timezone.timedelta(days=-1)
            if now < eight_before_travel:
                return (eight_before_travel - now).total_seconds()
            elif delta > 120:
                return get_seconds_until_travel_on(120)
            else:
                return 0
    else:
        if travel_hour >= 8 and travel_hour < 22:
            if delta > 45:
                return get_seconds_until_travel_on(45)
            else:
                return 0
        else:
            if travel_hour >= 22:
                eight_before_travel = timezone.localtime(booking.travel_on).replace(
                    hour=20, minute=0, second=0, microsecond=0
                )
            else:
                eight_before_travel = timezone.localtime(booking.travel_on).replace(
                    hour=20, minute=0, second=0, microsecond=0
                ) + timezone.timedelta(days=-1)
            if now < eight_before_travel:
                return (eight_before_travel - now).total_seconds()
            elif delta > 60:
                return get_seconds_until_travel_on(60)
            else:
                return 0


def schedule_driver_confirmation_notice(booking):
    """
    Triggers when a booking had its status changed into CONFIRMED.
    Depending on status of this booking, schedule an async task to send sms out to clients of the booking either immediately or with a short delay.
    """
    from django_site.celery import app
    from scbp_core.models import Booking

    with transaction.atomic():
        booking = Booking.objects.select_for_update().get(pk=booking.pk)
        if booking.sms_confirmation_task_id:
            app.control.revoke(booking.sms_confirmation_task_id)
        task_id = send_booking_confirmation_sms.apply_async(
            # always have minimum of delay of 1 so that the saved change on the booking
            # has been written by the time the task executes
            args=[booking.id],
            countdown=max(1, get_schedule_message_delay(booking)),
        )
        booking.sms_confirmation_task_id = task_id
        booking.save()
