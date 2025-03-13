class DefaultPermissionsMeta:
    """
    Set empty default permissions so django does not create any. They will be generated dynamically from a CSV.

    See https://docs.djangoproject.com/en/2.1/ref/models/options/#default-permissions
    """

    default_permissions = ()


def superusers_and_staff(*, hijacker, hijacked):
    """
    Superusers and staff members may hijack other users.

    A superuser may hijack any other user.
    A staff member may hijack any user, except another staff member or superuser.

    Borrowed from the hijack library, `hijack.permissions.superusers_and_staff`, modified to match the user-model
    employed by SCBP.
    """
    if not hijacked or not hijacked.is_active:
        return False

    if hijacker.is_superuser:
        return True

    hijacker_is_staff = hasattr(hijacker, "staff_user")
    hijacked_is_staff = hasattr(hijacked, "staff_user")

    return hijacker_is_staff and not (hijacked_is_staff or hijacked.is_superuser)
