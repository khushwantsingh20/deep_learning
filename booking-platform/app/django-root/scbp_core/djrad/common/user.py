from collections import defaultdict

from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as CoreValidationError
from rest_framework import serializers
from rest_framework.exceptions import ValidationError
from rest_framework.settings import api_settings

from ..base import ScbpModelSerializer


class BaseUserSerializer(ScbpModelSerializer):
    name = serializers.CharField(read_only=True)
    activated_at = serializers.DateTimeField(read_only=True)
    password = serializers.CharField(
        write_only=True, min_length=8, allow_blank=True, allow_null=True
    )
    confirm_password = serializers.CharField(
        write_only=True, min_length=8, allow_blank=True, allow_null=True
    )

    def __init__(
        self,
        instance=None,
        allow_duplicate_email=False,
        require_password=False,
        **kwargs,
    ):
        super().__init__(instance=instance, **kwargs)
        if allow_duplicate_email:
            self.fields["email"] = serializers.EmailField()
        self._require_password = require_password
        if instance and hasattr(self, "password") and not require_password:
            self.password.required = False
            self.confirm_password = False

    def create(self, validated_data):
        if "password" in validated_data:
            password = validated_data["password"]
            del validated_data["password"]
            del validated_data["confirm_password"]
        else:  # allows creating user w/o specify a password. generates random bs and user can only be accessed via impersonate and/or reset pwd.
            password = self.Meta.model.objects.make_random_password()

        instance = super().create(validated_data)
        instance.set_password(password)
        instance.save()
        return instance

    def update(self, instance, validated_data):
        password = validated_data.pop("password", None)
        validated_data.pop("confirm_password", None)
        if password:
            instance.set_password(password)
        return super().update(instance, validated_data)

    def validate(self, data):
        errors = defaultdict(list)
        password = data.get("password")
        confirm_password = data.get("confirm_password")
        if password and not confirm_password:
            errors["confirm_password"] = "Please confirm the password"
        elif password and password != confirm_password:
            errors[api_settings.NON_FIELD_ERRORS_KEY].append(
                "Those passwords don't match."
            )
        elif password:
            try:
                validate_password(password)
            except CoreValidationError as cve:
                e = []
                for error in cve.error_list:
                    e += error
                errors[api_settings.NON_FIELD_ERRORS_KEY] = e
        if errors:
            raise ValidationError(errors)
        return data

    def validate_password(self, password):
        if (
            not password
            and not self.instance
            or not password
            and self._require_password
        ):
            raise ValidationError("This field cannot be blank")
        return password

    def validate_confirm_password(self, password):
        if (
            not password
            and not self.instance
            or not password
            and self._require_password
        ):
            raise ValidationError("This field cannot be blank")
        return password

    def get_djrad_label(self, instance):
        name = getattr(
            instance,
            "name",
            " ".join((instance.first_name, instance.last_name)).strip(),
        )
        return name or instance.email
