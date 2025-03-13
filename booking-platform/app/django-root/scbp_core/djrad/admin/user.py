from django.core import signing
from django.core.validators import validate_email
from django.db.models import Value
from django.db.models.functions import Concat
from django_filters import OrderingFilter
from django_filters import rest_framework as filters
from rest_framework import status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.settings import api_settings

from scbp_core.djrad.admin.base import ScbpAdminModelRegistration
from scbp_core.djrad.admin.base import ScbpAdminModelViewSet
from scbp_core.djrad.admin.base import ScbpAdminViewSetPermissions
from scbp_core.djrad.base import ScbpFilterSet
from scbp_core.djrad.common.user import BaseUserSerializer
from scbp_core.djrad.sites import admin_site
from scbp_core.models import User
from scbp_core.models import ValidationError


class AdminUserSerializer(BaseUserSerializer):
    class Meta:
        model = User
        fields = (
            "name",
            "first_name",
            "last_name",
            "email",
            "password",
            "confirm_password",
            "activated_at",
            "is_active",
            "is_superuser",
            "user_type",
        )

    def validate(self, data):
        can_set_superuser = False
        # Make sure only super users can change super user
        if "request" in self.context:
            can_set_superuser = self.context["request"].user.is_superuser
        if not can_set_superuser:
            data.pop("is_superuser", None)
        if (
            User.objects.filter(email__iexact=data.get("email").lower())
            .exclude(pk=self.instance.pk if self.instance else None)
            .exists()
        ):
            raise ValidationError({"email": "Email already exists"})
        return data


class AdminUserFilterSet(ScbpFilterSet):
    name = filters.CharFilter(method="filter_name")
    email = filters.CharFilter(lookup_expr="icontains")
    date_joined = filters.DateFromToRangeFilter()

    ordering = OrderingFilter(
        fields=(("email", "email"), ("first_name", "name"), ("last_name", "name"))
    )

    class Meta:
        model = User
        fields = (
            "name",
            "email",
            "is_active",
            "is_superuser",
            "date_joined",
        )

    def filter_name(self, queryset, name, value):
        return queryset.annotate(
            name=Concat("first_name", Value(" "), "last_name")
        ).filter(name__icontains=value)


class AdminUserViewSetPermissions(ScbpAdminViewSetPermissions):
    actions_to_perms_map = {
        "request_password_reset": [],
        "validate_password_reset": [],
        "reset_password": [],
    }


class AdminUserViewSet(ScbpAdminModelViewSet):
    serializer_class = AdminUserSerializer
    queryset = (
        User.objects.select_related_profiles()
        .all()
        .annotate(name=Concat("first_name", Value(" "), "last_name"))
    )
    filterset_class = AdminUserFilterSet
    permission_classes = (AdminUserViewSetPermissions,)

    @action(methods=["POST"], detail=False)
    def request_password_reset(self, request):
        """
        Handle the initial step of requesting a password reset. We'll send a password reset email if the
        email account corresponds to one of our users, and a non-existent account email otherwise.
        """
        email = request.data["email"]
        try:
            validate_email(email)
        except ValidationError:
            return Response(
                {"email": "Invalid email address"}, status=status.HTTP_400_BAD_REQUEST
            )
        try:
            user = User.objects.get(email__iexact=email)
            user.send_password_reset_email(request, "admin")
        except User.DoesNotExist:
            return Response(
                {"email": "Email does not correspond to any user"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        return Response({"email": email}, status=status.HTTP_200_OK)

    @action(methods=["POST"], detail=False)
    def validate_password_reset(self, request):
        """
        Validate that the request is a valid password reset request
        """
        token = request.data["token"]
        try:
            User.get_user_from_password_reset_token(token)
            return Response(status=status.HTTP_200_OK)
        except signing.SignatureExpired:
            return Response(
                {"error": "signature expired"}, status=status.HTTP_400_BAD_REQUEST
            )
        except signing.BadSignature:
            return Response(
                {"error": "invalid token"}, status=status.HTTP_400_BAD_REQUEST
            )

    @action(methods=["POST"], detail=False)
    def reset_password(self, request):
        """
        Actually change the password
        """
        token = request.data["token"]
        try:
            user = User.get_user_from_password_reset_token(token).get_profile()
            if request.data["password"] != request.data["confirm_password"]:
                return Response(
                    {api_settings.NON_FIELD_ERRORS_KEY: "Passwords do not match"},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            user.set_password(request.data["password"])
            user.save()
            return Response({"user": AdminUserSerializer(user).data})
        except signing.SignatureExpired:
            return Response(
                {"error": "signature expired"}, status=status.HTTP_400_BAD_REQUEST
            )
        except signing.BadSignature:
            return Response(
                {"error": "invalid token"}, status=status.HTTP_400_BAD_REQUEST
            )


class BaseAdminUserRegistration(ScbpAdminModelRegistration):
    action_permissions = {
        **ScbpAdminModelRegistration.action_permissions,
        "impersonate": ["can_hijack"],
    }

    def get_object_actions(self):
        return super().get_object_actions() + ["impersonate"]


class AdminUserRegistration(BaseAdminUserRegistration):
    viewset_class = AdminUserViewSet

    def create_field_descriptor(
        self, serializer, field_name, field, model_field, field_kwargs, container=None
    ):
        # Make choices available on frontend so that labels are used when displaying the user_type
        if field_name == "user_type":
            field_kwargs["choices"] = User.get_user_type_choices()
        return super().create_field_descriptor(
            serializer, field_name, field, model_field, field_kwargs, container
        )


class AdminUserArchivableRegistration(AdminUserRegistration):
    action_permissions = {
        **AdminUserRegistration.action_permissions,
        "archive": ["%(app_label)s.delete_%(model_name)s"],
        "unarchive": ["%(app_label)s.delete_%(model_name)s"],
    }

    def get_object_actions(self):
        actions = super().get_object_actions()
        actions += ["archive", "unarchive"]
        return actions


admin_site.register(User, AdminUserRegistration)
# Set the class to use for serializing user data
admin_site.set_user_serializer_class(AdminUserSerializer)
