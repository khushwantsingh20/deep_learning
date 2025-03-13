from typing import Union

import rules

from scbp_core.models import Account
from scbp_core.models import AccountToClient
from scbp_core.models import Booking
from scbp_core.models import ClientUser
from scbp_core.models import StaffUser
from scbp_core.models import User


def is_admin(user, obj=None):
    return not user.is_anonymous and isinstance(user.get_profile(), StaffUser)


def is_superuser(user, obj=None):
    return not user.is_anonymous and user.is_superuser


def can_hijack(hijacker, hijacked):
    if hijacker.is_superuser:
        return True
    if is_admin(hijacker) and not is_admin(hijacked):
        return True
    return False


def is_self(user, other_user):
    return user == other_user


def is_address_manager(user, address):
    """Check if address is owned by specified client or user is manager for account linked to address owner"""
    return user.get_profile() == address.client or can_manage_user(user, address.client)


def has_account_access(user, account):
    return AccountToClient.objects.filter(
        client_user=user.get_profile(), account=account
    ).exists()


def has_client_user_link(user, record):
    """Checks record has link on client user field to current user profile"""
    return user.get_profile() == record.client_user


def can_manage_user(user: User, obj: ClientUser):
    """Can user manage eg. addresses for another ClientUser 'obj'"""

    # Find Accounts common between user and other_user for which user has is_account_admin
    if user.is_anonymous:
        return False
    client_user: ClientUser = user.get_profile()

    if client_user == obj:
        return True
    if not client_user or not isinstance(client_user, ClientUser):
        return False
    admin_for = client_user.account_to_client.filter(is_account_admin=True).values_list(
        "account_id"
    )
    return AccountToClient.objects.filter(
        account_id__in=admin_for, client_user=obj
    ).exists()


def is_account_admin(user, account: Union[AccountToClient, Account]) -> bool:
    """Is user an administrator for specified account?

    Works with either an Account instance or AccountToClient instance
    """
    client_user = user.get_profile()
    if not client_user or not isinstance(client_user, ClientUser):
        return False
    if isinstance(account, AccountToClient):
        account_to_client = account
        return AccountToClient.objects.filter(
            account=account_to_client.account,
            account__account_to_client__client_user=client_user,
            account__account_to_client__is_account_admin=True,
        )
    return account.account_to_client.filter(
        client_user=client_user, is_account_admin=True
    ).exists()


def can_update_booking(user, booking: Booking):
    """Can a client user update the specified booking?"""
    client_user = user.get_profile()
    if not client_user or not isinstance(client_user, ClientUser):
        return False
    return (
        Booking.objects.filter(id=booking.id)
        .filter_by_client_access(client_user.id)
        .exists()
    )


rules.add_perm("is_admin", is_admin)
rules.add_perm("is_superuser", is_superuser)
rules.add_perm("can_hijack", can_hijack)
rules.add_perm("is_self", is_self)
rules.add_perm("has_account_access", has_account_access)
rules.add_perm("has_client_user_link", has_client_user_link)
rules.add_perm("is_account_admin", is_account_admin)
rules.add_perm("is_address_manager", is_address_manager)
rules.add_perm("can_manage_user", can_manage_user)
