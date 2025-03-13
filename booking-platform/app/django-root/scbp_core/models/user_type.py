from collections import OrderedDict


class UserType:
    STAFF_MANAGER = 1
    STAFF_SUPERVISOR = 2
    STAFF_TELEPHONIST = 3
    CLIENT = 11
    DRIVER = 12

    choices = OrderedDict(
        (
            (STAFF_MANAGER, "Manager"),
            (STAFF_SUPERVISOR, "Supervisor"),
            (STAFF_TELEPHONIST, "Telephonist"),
            (CLIENT, "Client"),
            (DRIVER, "Driver"),
        )
    )

    @classmethod
    def get_staff_choices(cls):
        for value, name in cls.choices.items():
            if value < 10:
                yield (value, name)

    @classmethod
    def get_name(cls, value):
        return dict(cls.choices)[value]
