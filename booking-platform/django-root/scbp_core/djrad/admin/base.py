from rest_framework.decorators import action
from rest_framework.response import Response

from scbp_core.djrad.base import ScbpDjradViewSetPermissions
from scbp_core.djrad.base import ScbpFilterSet
from scbp_core.djrad.base import ScbpModelNoDeleteViewSet
from scbp_core.djrad.base import ScbpModelRegistration
from scbp_core.djrad.base import ScbpModelSerializer
from scbp_core.djrad.base import ScbpModelViewSet
from scbp_core.models import ClientUser
from scbp_core.models import VehicleClass


class ScbpAdminViewSetPermissions(ScbpDjradViewSetPermissions):
    pass


class ScbpAdminFilterSet(ScbpFilterSet):
    pass


class ScbpAdminModelSerializer(ScbpModelSerializer):
    pass


class ScbpAdminModelViewSet(ScbpModelViewSet):
    permission_classes = (ScbpAdminViewSetPermissions,)


class ScbpAdminModelNoDeleteViewSet(ScbpModelNoDeleteViewSet):
    permission_classes = (ScbpAdminViewSetPermissions,)


class ScbpArchivableViewSetPermissions(ScbpAdminViewSetPermissions):
    actions_to_perms_map = {
        "archive": ["%(app_label)s.delete_%(model_name)s"],
        "unarchive": ["%(app_label)s.delete_%(model_name)s"],
    }


# we want to do it like this instead of a mixin because we need the underlying NoDeleteViewSet
class ScbpAdminModelArchivableViewSet(ScbpAdminModelNoDeleteViewSet):
    permission_classes = (ScbpArchivableViewSetPermissions,)

    @action(methods=["POST"], detail=True)
    def archive(self, request, pk):
        instance = self.get_object()
        instance.archive(request.user)
        return Response(self.get_serializer(instance).data)

    @action(methods=["POST"], detail=True)
    def unarchive(self, request, pk):
        instance = self.get_object()
        instance.unarchive()
        return Response(self.get_serializer(instance).data)


class ScbpAdminModelRegistration(ScbpModelRegistration):
    def get_related_lookup_serializer_class(self, field_name, to_model):
        if to_model == VehicleClass:
            from scbp_core.djrad.admin import VehicleClassRelatedLookupSerializer

            return VehicleClassRelatedLookupSerializer
        return super().get_related_lookup_serializer_class(field_name, to_model)


class ScbpAdminModelArchivableRegistration(ScbpAdminModelRegistration):
    action_permissions = {
        **ScbpAdminModelRegistration.action_permissions,
        "archive": ["%(app_label)s.delete_%(model_name)s"],
        "unarchive": ["%(app_label)s.delete_%(model_name)s"],
    }

    def get_object_actions(self):
        actions = super().get_object_actions()
        actions += ["archive", "unarchive"]
        return actions


class ScbpAdminBookingViewSet(ScbpAdminModelViewSet):
    def get_related_lookup_queryset(self, model):
        if model == ClientUser:
            account = self.request.query_params.get("account")
            # is_strict flag is set True for booking confirmation email lookup
            is_strict = self.request.query_params.get("strict", "False") != "False"
            if not account:
                if is_strict:
                    return ClientUser.objects.none()
                return ClientUser.objects.all()
            return ClientUser.objects.filter(
                account_to_client__account=account, account_to_client__archived_at=None
            )

        return super().get_related_lookup_queryset(model)
