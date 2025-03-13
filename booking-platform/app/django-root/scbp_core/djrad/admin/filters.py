from django.db.models import Q
from django.db.models import Value
from django.db.models.functions import Concat
from djrad_rest.filters import RefineModelChoiceFilter
from djrad_rest.filters import RefineModelMultipleChoiceFilter

from scbp_core.models.account import Account
from scbp_core.models.user import ClientUser


class RefineAccountFilterMixin:
    default_label = "Accounts"

    def __init__(self, **kwargs):
        def refine_choices(qs, keywords, request):
            qs = qs.order_by("account_no")
            if not keywords:
                return qs
            filter = Q()
            for keyword in keywords.split():
                filter = filter & (
                    Q(account_no__icontains=keyword)
                    | Q(account_nickname__icontains=keyword)
                )
            return qs.filter(filter)

        default_kwargs = dict(
            label=self.default_label,
            queryset=Account.objects.all(),
            refine_choices=refine_choices,
        )

        super().__init__(**{**default_kwargs, **kwargs})


class RefineAccountMultipleChoiceFilter(
    RefineAccountFilterMixin, RefineModelMultipleChoiceFilter
):
    """Filter on accounts

    Use this on your FilterSet, eg.

        accounts = AccountMultipleChoiceFilter()
    """


class RefineAccountChoiceFilter(RefineAccountFilterMixin, RefineModelChoiceFilter):
    """Filter on accounts

    Use this on your FilterSet, eg.

        account = AccountChoiceFilter()
    """


class RefineClientUserFilterMixin:
    default_label = "Client"

    def __init__(self, queryset=None, **kwargs):
        def refine_choices(qs, keywords, request):
            qs = qs.order_by("first_name", "last_name", "email")
            if not keywords:
                return qs
            filter = Q()
            for keyword in keywords.split():
                filter = filter & (
                    Q(email__icontains=keyword)
                    | Q(name_first_first__icontains=keyword)
                    | Q(name_last_first__icontains=keyword)
                )
            return qs.filter(filter)

        if queryset is None:
            queryset = ClientUser.objects.all()
        queryset = queryset.annotate(
            name_last_first=Concat("last_name", Value(", "), "first_name"),
            name_first_first=Concat("first_name", Value(" "), "last_name"),
        )
        default_kwargs = dict(
            label=self.default_label, queryset=queryset, refine_choices=refine_choices
        )

        super().__init__(**{**default_kwargs, **kwargs})


class RefineClientUserMultipleChoiceFilter(
    RefineClientUserFilterMixin, RefineModelMultipleChoiceFilter
):
    """Filter on accounts

    Use this on your FilterSet, eg.

        accounts = ClientUserMultipleChoiceFilter()
    """


class RefineClientUserChoiceFilter(
    RefineClientUserFilterMixin, RefineModelChoiceFilter
):
    """Filter on accounts

    Use this on your FilterSet, eg.

        account = ClientUserChoiceFilter()
    """


# Filter by ids on a model. Not intended to expose a UI on the frontend - used for manual
# calls or things like related model lookups which pass a list of ids
class ModelIdFilter(RefineModelMultipleChoiceFilter):
    def __init__(self, *args, **kwargs):
        super().__init__(self.refine_choices, *args, **kwargs)

    def refine_choices(self, qs, **kwargs):
        # refine_choices is only used to generate dropdown lists for this filter
        # Because this filter will never be used in this way,
        # and because we expect a significant number of clients,
        # we disallow this functionality
        return qs.none()

    def filter(self, qs, value):
        return qs.filter(id__in=[record.id for record in value]) if value else qs
