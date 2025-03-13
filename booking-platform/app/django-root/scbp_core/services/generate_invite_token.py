from django.core import signing

INVITATION_TOKEN_SALT = "scbp_core:invitation-salt"


def generate_invite_token(data):
    return signing.dumps(data, salt=INVITATION_TOKEN_SALT)
