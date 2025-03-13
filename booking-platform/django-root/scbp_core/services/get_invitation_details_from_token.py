from django.core import signing

from scbp_core.services.generate_invite_token import INVITATION_TOKEN_SALT


def get_invitation_details_from_token(
    token: str,
):
    try:
        max_age = 5 * 24 * 3600
        data = signing.loads(token, salt=INVITATION_TOKEN_SALT, max_age=max_age)
        return data
    except signing.BadSignature:
        raise
