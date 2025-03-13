from scbp_core.djrad.base import ScbpDjradViewSetPermissions
from scbp_core.djrad.base import ScbpFilterSet
from scbp_core.djrad.base import ScbpModelNoDeleteViewSet
from scbp_core.djrad.base import ScbpModelRegistration
from scbp_core.djrad.base import ScbpModelSerializer
from scbp_core.djrad.base import ScbpModelViewSet


class ScbpDriverViewSetPermissions(ScbpDjradViewSetPermissions):
    pass


class ScbpDriverFilterSet(ScbpFilterSet):
    pass


class ScbpDriverModelSerializer(ScbpModelSerializer):
    pass


class ScbpDriverModelViewSet(ScbpModelViewSet):
    permission_classes = (ScbpDriverViewSetPermissions,)


class ScbpDriverModelNoDeleteViewSet(ScbpModelNoDeleteViewSet):
    permission_classes = (ScbpDriverViewSetPermissions,)


class ScbpDriverModelRegistration(ScbpModelRegistration):
    pass
