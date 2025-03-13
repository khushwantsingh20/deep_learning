from celery import shared_task
from django.db import transaction
from django.utils import timezone

from scbp_core.services.send_sms import send_sms


@shared_task
def send_booking_confirmation_sms(booking_id):
    from scbp_core.models import Booking
    from scbp_core.models import BookingStatus
    from scbp_core.models import BookingLog

    with transaction.atomic():
        booking = Booking.objects.select_for_update().get(pk=booking_id)

        # If task ID no longer matches don't continue. It means a new task has been queued
        # and it supersedes us. This shouldn't ideally happen as we revoke tasks when a new
        # one is scheduled but in practice it seems to be necessary...
        if send_booking_confirmation_sms.request.id != booking.sms_confirmation_task_id:
            return
        booking.sms_confirmation_task_id = ""
        booking.save()
        # If booking has been cancelled or no driver assigned we shouldn't send an SMS
        if booking.booking_status == BookingStatus.CANCELLED or not booking.driver:
            return
        mobile = (
            booking.passenger.contact_phone
            if booking.passenger
            else booking.passenger_phone
        )
        if not mobile:
            return

        name = (
            booking.passenger.get_full_name_with_title()
            if booking.passenger
            else booking.passenger_name
        )

        message = f"Hello {name}, your driver for {booking.from_address.suburb} on {timezone.localtime(booking.travel_on).strftime('%d %b')} at {timezone.localtime(booking.travel_on).strftime('%I:%M %p')} is {booking.driver.first_name} - {booking.driver.mobile}. Kind Regards, Limomate 1300125466"
        send_sms(mobile=mobile, message=message)
    BookingLog.objects.create(
        # Not accurate but currently user is required
        user=booking.created_by,
        booking=booking,
        description=f"SMS confirmation sent to {mobile}: {message}",
        source="System",
    )
