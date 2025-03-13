from rest_framework.permissions import BasePermission

from scbp_core.djrad.base import ScbpDjradViewSetPermissions
from scbp_core.djrad.base import ScbpFilterSet
from scbp_core.djrad.base import ScbpModelRegistration
from scbp_core.djrad.base import ScbpModelSerializer
from scbp_core.djrad.base import ScbpModelViewSet
from scbp_core.models import ClientUser
from scbp_core.util import is_current_user_of_type


class ScbpAppViewSetPermissions(ScbpDjradViewSetPermissions):
    pass


class ScbpAppClientUserOnlyPermission(BasePermission):
    """Restrict access to users with ClientUser profile

    Usage:

    class MyViewSet(ScbpAppModelViewSet):
        # Check ClientUser only and then enforce normal permission checks with ScbpAppViewSetPermissions
        permission_classes = (ScbpAppClientUserOnlyPermission, ScbpAppViewSetPermissions)

    """

    def has_permission(self, request, view):
        return is_current_user_of_type(request, ClientUser)


class ScbpAppFilterSet(ScbpFilterSet):
    pass


class ScbpAppModelSerializer(ScbpModelSerializer):
    pass


class ScbpAppModelViewSet(ScbpModelViewSet):
    permission_classes = (ScbpAppViewSetPermissions,)


class ScbpAppModelRegistration(ScbpModelRegistration):
    pass
