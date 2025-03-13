from collections import OrderedDict


class HourRateDayType:
    WEEKDAY = 1
    SATURDAY = 2
    SUNDAY = 3
    HOLIDAY = 4

    choices = OrderedDict(
        (
            (WEEKDAY, "Weekday"),
            (SATURDAY, "Saturday"),
            (SUNDAY, "Sunday"),
            (HOLIDAY, "Public Holiday"),
        )
    )


class HourRateHourType:
    OFF_PEAK = 1
    STANDARD = 2
    PEAK = 3
    OUT_OF_HOURS = 4
    HOLIDAY_OUT_OF_HOURS = 5
    SATURDAY_NIGHT = 6

    choices = OrderedDict(
        (
            (OFF_PEAK, "Off-peak"),
            (STANDARD, "Standard"),
            (PEAK, "Peak"),
            (OUT_OF_HOURS, "Out of hours"),
            (HOLIDAY_OUT_OF_HOURS, "Holiday - Out of hours"),
            (SATURDAY_NIGHT, "Saturday Night"),
        )
    )
