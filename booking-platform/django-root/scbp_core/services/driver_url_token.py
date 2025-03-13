from typing import Dict

from django.core.signing import TimestampSigner

from scbp_core.models.booking import Booking
from scbp_core.models.user import DriverUser

signer = TimestampSigner(salt="DispatchSalt")


def generate_url_token(booking: Booking, driver: DriverUser) -> str:
    raw_text = f"{booking.booking_number}:{driver.driver_no}"
    return signer.sign(raw_text)


def parse_url_token(token: str) -> Dict:
    # Tokens expire after 14 days
    expiry = 14 * 24 * 60 * 60
    raw_token = signer.unsign(token, max_age=expiry).split(":")
    booking = Booking.objects.filter(booking_number=raw_token[0]).first()
    driver = DriverUser.objects.filter(driver_no=raw_token[1]).first()
    if booking and driver and booking.driver_id == driver.id:
        return {"booking": booking, "driver": driver}
    raise ValueError("Booking not assigned to this driver")
