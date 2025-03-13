from datetime import date

from scbp_core.models.pricing import Holiday
from scbp_core.models.pricing_type import HourRateDayType


def get_day_type(day: date):
    base_weekdays = {
        0: HourRateDayType.WEEKDAY,
        1: HourRateDayType.WEEKDAY,
        2: HourRateDayType.WEEKDAY,
        3: HourRateDayType.WEEKDAY,
        4: HourRateDayType.WEEKDAY,
        5: HourRateDayType.SATURDAY,
        6: HourRateDayType.SUNDAY,
    }
    if Holiday.is_holiday(day):
        return HourRateDayType.HOLIDAY
    return base_weekdays[day.weekday()]
