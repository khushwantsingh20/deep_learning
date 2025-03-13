from collections import OrderedDict

from allianceutils.auth.models import GenericUserProfile
from allianceutils.auth.models import GenericUserProfileManagerMixin
from allianceutils.models import raise_validation_errors
from django.conf import settings
from django.contrib.auth.hashers import make_password
from django.contrib.auth.models import AbstractBaseUser
from django.contrib.auth.models import PermissionsMixin
from django.contrib.auth.models import UserManager as BaseUserManager
from django.core import signing
from django.core.exceptions import ValidationError
from django.core.mail import send_mail
from django.core.validators import MaxValueValidator
from django.core.validators import MinValueValidator
from django.db import models
from django.db import transaction
from django.db.models import CASCADE
from django.template.loader import render_to_string
from django.utils import timezone

from scbp_core.fields import PhoneNumberField
from scbp_core.model_mixins import ArchivableMixin
from scbp_core.models.user_type import UserType
from scbp_core.permissions import DefaultPermissionsMeta

USER_ACTIVATION_TOKEN_SALT = "scbp_core:activation-salt"
PASSWORD_RESET_TOKEN_SALT = "scbp_core:password-reset-salt"

__all__ = ["User", "StaffUser", "ClientUser", "DriverUser"]


class UserManager(GenericUserProfileManagerMixin, BaseUserManager):
    def _create_user(self, username, email, password, **extra_fields):
        """
        Create and save a user with the given username, email, and password.
        """
        if not email:
            raise ValueError("The given username must be set")
        email = self.normalize_email(email)
        # The `is_staff` field is not used & not present in the current User model - don't pass it when creating a new
        # User record.
        del extra_fields["is_staff"]
        user = self.model(email=email, **extra_fields)
        user.password = make_password(password)
        user.save(using=self._db)
        return user

    def create_user(self, email=None, password=None, **extra_fields):
        super().create_user(email, email=email, password=password, **extra_fields)

    def create_superuser(self, email=None, password=None, **extra_fields):
        super().create_superuser(email, email=email, password=password, **extra_fields)


class User(GenericUserProfile, AbstractBaseUser, PermissionsMixin):
    USERNAME_FIELD = "email"

    objects = UserManager()
    profiles = UserManager(select_related_profiles=True)
    # Used in CSV permission to identify which permissions apply. This should be set on subclasses.
    user_type = None

    related_profile_tables = ["staff_user", "client_user", "driver_user"]

    first_name = models.CharField(max_length=settings.MAX_LENGTH_NAME, blank=True)
    last_name = models.CharField(max_length=settings.MAX_LENGTH_NAME, blank=True)
    email = models.EmailField(unique=True)
    date_joined = models.DateTimeField(default=timezone.now, verbose_name="date joined")

    is_active = models.BooleanField(
        default=True,
        help_text="Designates whether this user should be treated as active. Unselect this instead of deleting accounts.",
        verbose_name="active",
    )
    activated_at = models.DateTimeField(null=True, blank=True)

    class Meta(DefaultPermissionsMeta):
        db_table = "scbp_core_user"
        indexes = [models.Index(fields=["last_name", "first_name"])]

    def __str__(self):
        name = self.get_full_name()
        if name:
            return f"{name} ({self.email})"
        return self.email

    def get_full_name(self):
        return f"{self.first_name} {self.last_name}".strip()

    @classmethod
    def get_user_types(cls):
        return UserType

    @classmethod
    def get_user_type_choices(cls):
        return cls.get_user_types().choices.items()

    def activate(self):
        self.activated_at = timezone.localtime()
        self.save()

    def was_activated(self):
        return self.activated_at is not None

    def generate_activation_token(self) -> str:
        """Generate a time-stamped token for use in activation url"""
        return signing.dumps(
            {"id": self.id, "email": self.email}, salt=USER_ACTIVATION_TOKEN_SALT
        )

    def generate_password_reset_token(self) -> str:
        """Generate a token based on the current password for use in password reset url"""
        return signing.dumps(
            {"id": self.id, "email": self.email, "password": self.password},
            key=settings.PASSWORD_RESET_TOKEN_KEY,
            salt=PASSWORD_RESET_TOKEN_SALT,
            compress=True,
        )

    def _validate_email_is_unique(self):
        # Check if any profiles already contain the email being passed through.
        # Exclude if the id is the same so we don't affect updates.
        if (
            self.email
            and User.objects.filter(email__iexact=self.email.lower())
            .exclude(pk=self.pk)
            .exists()
        ):
            raise ValidationError({"email": "User with this Email already exists."})

    def clean(self):
        with raise_validation_errors(super().clean) as ve:
            with ve.capture_validation_error():
                self._validate_email_is_unique()

    @staticmethod
    def get_user_from_activation_token(token: str, max_age: int = None) -> "User":
        """
        Check that an activation token is valid, and if so, return corresponding user record.
        :param token: base64 encoded string generated by generate_activation_token
        :param max_age: max age of token in seconds
        :return: the User record
        :raises: BadSignature if token is invalid or User record is not found
                 SignatureExpired if token is too old
        """
        if max_age is None:
            max_age = settings.USER_ACTIVATION_TOKEN_MAX_AGE_DAYS * 24 * 3600
        try:
            data = signing.loads(
                token, salt=USER_ACTIVATION_TOKEN_SALT, max_age=max_age
            )
            user_id, user_email = data["id"], data["email"]
            return User.objects.get(id=user_id, email__iexact=user_email)
        except signing.SignatureExpired:
            raise
        except signing.BadSignature:
            raise
        except User.DoesNotExist:
            raise signing.BadSignature("User record not found")

    @staticmethod
    def get_user_from_password_reset_token(token: str) -> "User":
        """
        Check that an activation token is valid and return the corresponding user record if it is.
        :param token: signed base64 encoded token
        :return: the User record
        :raises: BadSignature if the token is invalid or the User record is not found
                 SignatureExpired if the signature is more than a day old
        """
        max_age = settings.PASSWORD_RESET_TOKEN_MAX_AGE_DAYS * 24 * 3600
        try:
            data = signing.loads(
                token,
                key=settings.PASSWORD_RESET_TOKEN_KEY,
                salt=PASSWORD_RESET_TOKEN_SALT,
                max_age=max_age,
            )
            user_id, user_email, user_password = (
                data["id"],
                data["email"],
                data["password"],
            )
            return User.objects.get(
                id=user_id, email__iexact=user_email, password__iexact=user_password
            )
        except signing.SignatureExpired:
            raise
        except signing.BadSignature:
            raise
        except User.DoesNotExist:
            raise signing.BadSignature("Invalid Token")

    def send_activation_email(
        self, request, is_new_user: bool = False, is_resend: bool = False
    ):
        """
        Send the new user activation email, containing an activation link.
        :param request: http request object
        :param is_new_user: True if this is a new user, False if user already existed
        :param is_resend: True if this is an existing user requesting another link (e.g. previous
        link may have expired)
        :raises SMTPException if sending fails
        """
        token = self.generate_activation_token()
        email_subject = "Activate your account"
        email_body = render_to_string(
            "email/user_signup_activation.html",
            context={
                "user": self,
                "is_new_user": is_new_user,
                "activation_url": request.build_absolute_uri("/activate/%s/" % token),
                "link_expiry_days": settings.USER_ACTIVATION_TOKEN_MAX_AGE_DAYS,
            },
        )
        send_mail(
            email_subject,
            "",
            settings.SERVER_EMAIL,
            [self.email],
            html_message=email_body,
        )

    def send_welcome_email(self):
        email_subject = "Welcome to Limomate!"
        email_body = render_to_string(
            "email/welcome_email.html",
            context={"user": self, "domain": settings.SITE_URL},
        )
        send_mail(
            email_subject,
            "",
            settings.SERVER_EMAIL,
            [self.email],
            html_message=email_body,
        )

    def send_password_reset_email(self, request, context="app"):
        """
        Send the password reset email including the password reset link.
        :param context: app or admin
        :param request: http request object
        :raises SMTPException if sending fails for whatever reason
        """
        token = self.generate_password_reset_token()
        email_subject = "Reset your password"
        email_body = render_to_string(
            "email/password_reset.html",
            context={
                "reset_url": request.build_absolute_uri(
                    f"/{context}/reset-password/?token={token}"
                ),
                "domain": settings.SITE_URL,
            },
        )
        send_mail(
            email_subject,
            "",
            settings.SERVER_EMAIL,
            [self.email],
            html_message=email_body,
        )


class ArchivableUserManager(UserManager):
    def __init__(self, *args, **kwargs):
        self.non_archived_only = kwargs.pop("non_archived_only", True)
        super().__init__(*args, **kwargs)

    def get_queryset(self):
        queryset = super().get_queryset()
        if self.non_archived_only:
            return queryset.filter(archived_at=None)
        return queryset


class ArchivableUser(User, ArchivableMixin):
    objects = ArchivableUserManager()
    all_objects = ArchivableUserManager(non_archived_only=False)

    class Meta:
        abstract = True


class StaffUser(ArchivableUser):
    user_ptr = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        parent_link=True,
        related_name="staff_user",
        on_delete=models.PROTECT,
        primary_key=True,
    )

    user_type = models.PositiveSmallIntegerField(choices=UserType.get_staff_choices())

    class Meta(DefaultPermissionsMeta):
        db_table = "scbp_core_staff_user"
        default_related_name = "staff_users"
        verbose_name = "Staff Member"
        verbose_name_plural = "Staff"


class ClientUserPriority:
    HIGH = 1
    MID = 2
    LOW = 3

    choices = OrderedDict(((HIGH, "1"), (MID, "2"), (LOW, "3")))


class ClientUser(ArchivableUser):
    title = models.CharField(max_length=settings.MAX_LENGTH_NAME, blank=True)
    contact_phone = PhoneNumberField("Contact Phone (mobile)")
    contact_phone_alternate = PhoneNumberField("Contact Phone (home)", blank=True)

    driver_instructions = models.CharField(
        max_length=settings.MAX_LENGTH_SHORT_DESCRIPTION, blank=True
    )
    internal_instructions = models.CharField(
        max_length=settings.MAX_LENGTH_SHORT_DESCRIPTION, blank=True
    )

    priority = models.PositiveSmallIntegerField(
        choices=ClientUserPriority.choices.items(), default=ClientUserPriority.LOW
    )

    user_ptr = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        parent_link=True,
        related_name="client_user",
        on_delete=models.PROTECT,
        primary_key=True,
    )

    user_type = UserType.CLIENT

    # Primary key into tblClient
    legacy_clientno = models.IntegerField(null=True, unique=True)
    # Primary key into tblContact
    legacy_contactno = models.IntegerField(null=True, unique=True)

    def get_full_name_with_title(self):
        return f"{self.title} {self.get_full_name()}".strip()

    class Meta(DefaultPermissionsMeta):
        db_table = "scbp_core_client_user"
        verbose_name = "Client"
        verbose_name_plural = "Clients"

    def unarchive(self):
        with transaction.atomic():
            super().unarchive()
            from scbp_core.models import AccountToClient

            for link in AccountToClient.all_objects.filter(
                archived_at__isnull=False, client_user=self
            ):
                link.unarchive()

    def archive(self, user):
        with transaction.atomic():
            super().archive(user)
            from scbp_core.models import AccountToClient

            for link in AccountToClient.objects.filter(client_user=self):
                link.archive(user)


class DriverUser(ArchivableUser):
    user_ptr = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        parent_link=True,
        related_name="driver_user",
        on_delete=models.PROTECT,
        primary_key=True,
    )

    user_type = UserType.DRIVER

    driver_no = models.IntegerField()
    title = models.CharField(max_length=settings.MAX_LENGTH_NAME, blank=True)

    current_vehicle = models.ForeignKey(
        "scbp_core.Vehicle",
        related_name="drivers",
        null=True,
        help_text="This vehicle will be assigned to any bookings this driver completes",
        on_delete=models.SET_NULL,
    )

    home_phone = PhoneNumberField(blank=True)
    mobile = PhoneNumberField()
    date_of_birth = models.DateField()
    address = models.CharField(max_length=settings.MAX_LENGTH_SHORT_DESCRIPTION)

    partner_name = models.CharField(max_length=settings.MAX_LENGTH_NAME, blank=True)
    partner_phone = PhoneNumberField(blank=True)

    commision_rate = models.PositiveSmallIntegerField(
        validators=[MinValueValidator(0), MaxValueValidator(100)]
    )
    has_driver_agreement_signed = models.BooleanField(default=False)
    abn = models.CharField(max_length=settings.MAX_LENGTH_NAME, blank=True)
    is_abn_verified = models.BooleanField(default=False)
    start_date = models.DateField()
    end_date = models.DateField(blank=True, null=True)

    drivers_license_number = models.CharField(max_length=settings.MAX_LENGTH_NAME)
    drivers_license_expiry_date = models.DateField()
    driver_certificate_number = models.CharField(max_length=settings.MAX_LENGTH_NAME)
    driver_certificate_expiry_date = models.DateField()

    operations_manual_number = models.CharField(
        max_length=settings.MAX_LENGTH_NAME, blank=True
    )
    operations_manual_version = models.CharField(
        max_length=settings.MAX_LENGTH_NAME, blank=True
    )
    operations_manual_issued_date = models.DateField(blank=True, null=True)
    operations_manual_returned_date = models.DateField(blank=True, null=True)

    class Meta(DefaultPermissionsMeta):
        db_table = "scbp_core_driver_user"
        verbose_name = "Driver"
        verbose_name_plural = "Drivers"

    def _validate(self):
        # Prevent the existance of two driver records that are both active and sharing a driver no
        if (
            DriverUser.objects.filter(driver_no=self.driver_no)
            .exclude(pk=self.pk)
            .exists()
        ):
            raise ValidationError(
                {
                    "driver_no": "This driver number is already used by another active driver."
                }
            )

    def save(self, *args, **kwargs):
        self._validate()
        super().save()


class MobileDeviceToken(models.Model):
    token = models.CharField(max_length=255)
    user = models.ForeignKey(User, on_delete=CASCADE)

    class Meta(DefaultPermissionsMeta):
        db_table = "scbp_core_mobile_device_token"
        default_related_name = "mobile_tokens"
