from typing import Optional

from rest_framework.request import Request

from scbp_core.models import Account
from scbp_core.models import ClientUser


def get_account_for_session(request: Request) -> Optional[Account]:
    """Get the Account to use for this session

    Validates user has access to otherwise falls back to default (if any)

    If user has no account this will return None
    """
    if not request.user or request.user.is_anonymous:
        return None

    client_user = request.user.get_profile()
    if not client_user or not isinstance(client_user, ClientUser):
        raise ValueError("get_account_for_session only applicable for ClientUser")
    try:
        account_id = request.session["active_account_id"]
        return Account.objects.get(
            pk=account_id, account_to_client__client_user=client_user
        )
    except (KeyError, Account.DoesNotExist):
        return Account.objects.filter(
            account_to_client__client_user=client_user,
            account_to_client__is_default_account=True,
        ).first()


def set_account_for_session(request: Request, account: Account):
    """Set the Account to use for the current session"""
    client_user = request.user.get_profile()
    if not client_user or not isinstance(client_user, ClientUser):
        raise ValueError("set_account_for_session only applicable for ClientUser")
    request.session["active_account_id"] = account.pk
