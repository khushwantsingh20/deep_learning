from allianceutils.auth.backends import MinimalModelBackend
from allianceutils.auth.backends import ProfileModelBackendMixin
from django.conf import settings
from django.contrib.auth import get_user_model
from django.core.mail.backends.smtp import EmailBackend
from django.template.defaultfilters import truncatechars


class RedirectEmailBackend(EmailBackend):
    def send_messages(self, emails):
        if not hasattr(settings, "REDIRECT_EMAILS_TO"):
            import django.core.exceptions

            raise django.core.exceptions.ImproperlyConfigured(
                "You cannot use RedirectEmailBackend without setting REDIRECT_EMAILS_TO"
            )

        redirects_to = settings.REDIRECT_EMAILS_TO

        msgs = []
        for email in emails:
            original_recipients = email.to + email.cc + email.bcc
            original_recipients = ", ".join(original_recipients)
            email.subject = truncatechars(
                f"{email.subject} - Originally sending to {original_recipients}", 900
            )
            email.to = [redirects_to]
            email.cc = []
            email.bcc = []
            msgs.append(email)

        super().send_messages(msgs)
        return len(msgs)


class ProfileModelBackend(ProfileModelBackendMixin, MinimalModelBackend):
    # Overrides authenticate on ModelBackend
    #
    # Currently the authenticate method on the Alliance Utils ProfileModelBackend checks a username by lower casing.
    # That won't return a user that has a mixed case username stored in the database so we don't use it.
    #
    # This overrides the ModelBackend authenticate method to enable a case insensitive check.
    def authenticate(self, request, username=None, password=None, **kwargs):
        UserModel = get_user_model()
        if username is None:
            username = kwargs.get(UserModel.USERNAME_FIELD)
        try:
            case_insensitive_username_field = "{}__iexact".format(
                UserModel.USERNAME_FIELD
            )
            user = UserModel._default_manager.get(
                **{case_insensitive_username_field: username}
            )
        except UserModel.DoesNotExist:
            UserModel().set_password(password)
        else:
            if user.check_password(password) and self.user_can_authenticate(user):
                return user
