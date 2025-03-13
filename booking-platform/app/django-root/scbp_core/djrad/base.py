from typing import Iterable

from django.contrib.auth import get_backends
from django.core.exceptions import ValidationError as CoreValidationError
from django.db.models import BooleanField
from django.db.models import Expression
from django.db.models import F
from django_filters.rest_framework import FilterSet
from djrad_rest import mixins
from djrad_rest.permissions import DjradGenericDjangoViewsetPermissions
from djrad_rest.registration import ModelRegistration
from djrad_rest.registration.fields import AnyTypeFieldDescriptor
from djrad_rest.registration.fields import BooleanFieldDescriptor
from djrad_rest.serializers import DjradModelSerializer
from djrad_rest.viewsets import CamelCaseOrderingFilter
from djrad_rest.viewsets import DjradDjangoFilterBackend
from djrad_rest.viewsets import DjradGenericViewSet
from djrad_rest.viewsets import DjradModelViewSet
from rest_framework.exceptions import ValidationError
from rest_framework.fields import BooleanField as DRFBooleanField
from rest_framework.fields import JSONField
from rest_framework.settings import api_settings

from scbp_core.djrad.fields import AddressFieldDescriptor
from scbp_core.djrad.fields import CreditCardFieldDescriptor
from scbp_core.djrad.fields import HtmlFieldDescriptor
from scbp_core.fields import HtmlField


def django_validation_error_to_drf(error: CoreValidationError):
    """Given a core django ValidationError convert it to a DRF validation error"""
    try:
        return ValidationError({api_settings.NON_FIELD_ERRORS_KEY: error.message})
    except AttributeError:
        error_dict = error.message_dict.copy()
        non_field_errors = error_dict.pop("__all__", None)
        if non_field_errors:
            error_dict[api_settings.NON_FIELD_ERRORS_KEY] = non_field_errors
        return ValidationError(error_dict)


class PermissionNotImplementedError(NotImplementedError):
    pass


class ScbpDjradViewSetPermissions(DjradGenericDjangoViewsetPermissions):
    default_actions_to_perms_map = dict(
        DjradGenericDjangoViewsetPermissions.default_actions_to_perms_map
    )
    default_actions_to_perms_map[None] = [
        "This is a workaround for a bug in Alliance utils"
    ]
    default_actions_to_perms_map["archive"] = (
        DjradGenericDjangoViewsetPermissions.default_actions_to_perms_map["update"]
    )

    def has_permission(self, request, viewset):
        action = getattr(viewset, "action", None)

        # Handles OPTIONS requests
        if action is None:
            return True

        user = request.user
        if hasattr(viewset, "queryset"):
            perms = self.get_permissions_for_action(action, viewset)
        else:
            perms = self.get_actions_to_perms_map().get(action)

        if not perms:
            return True

        global_perms = []
        object_perms = []

        backends = get_backends()

        for perm in perms:
            for backend in backends:
                if hasattr(backend, "is_global_perm"):
                    try:
                        if backend.is_global_perm(perm):
                            global_perms.append(perm)
                        else:
                            object_perms.append(perm)
                        break
                    # Permission doesn't exist in CsvPermissions backend
                    except ValueError:
                        pass
            else:
                raise PermissionNotImplementedError(
                    f"Permission {perm} not found in backend that supports is_global_perm. "
                    f"If this is a model permission check if model is listed in PermissionMatrix.csv"
                )

        # Check permissions for action available irrespective of object
        if global_perms and user.has_perms(global_perms, None):
            return True

        if object_perms:
            if not viewset.detail:
                raise RuntimeError(
                    f"Trying to apply object level permissions to a list view. "
                    f'Check permission configuration for: {", ".join(object_perms)}'
                )

            obj = viewset.get_object()

            if user.has_perms(object_perms, obj):
                return True

        return False


class ScbpFilterSet(FilterSet):
    pass


class ScbpModelSerializer(DjradModelSerializer):
    pass


class ScbpOrderingFilter(CamelCaseOrderingFilter):
    """
    Filter for specifying ordering parameters that differ from the serializer fields. This lets you map a friendly
    name to something much more verbose.

    E.g.
        ordering_fields = [
            ('venue_group_name', 'venue__venue_group__name'),
            ('options', ('-rear_facing_baby_seat_count, 'forward_facing_baby_seat_count')),
            # Use lower case transform as well
            ('name', Lower('related__name')),
        ]

        This will allow you to order in a case-insensitive way.
    """

    @staticmethod
    def _field_from_mapping(view, term: str) -> Iterable[Expression]:
        """
        Transforms the value passed to the ordering query parameter into a (possibly transformed) field name.
        """
        ordering_fields = getattr(view, "ordering_fields", list())

        field = term.lstrip("-")
        is_reversed = field != term
        for ordering_field in ordering_fields:
            if isinstance(ordering_field, (tuple, list)) and ordering_field[
                0
            ] == term.lstrip("-"):
                field = ordering_field[1]
                break
        if isinstance(field, str):
            field = F(field)
        if isinstance(field, (tuple, list)):
            result = []
            for db_field in field:
                result.append(F(db_field))
            field = tuple(result)
        else:
            field = (field,)

        results = []
        for f in field:
            if is_reversed:
                f = f.desc()
            results.append(f)
        return results

    def filter_queryset(self, request, queryset, view):
        ordering = self.get_ordering(request, queryset, view)

        if ordering:
            mappings = [self._field_from_mapping(view, o) for o in ordering]
            return queryset.order_by(
                *[item for sublist in mappings for item in sublist]
            )

        return queryset


class ScbpModelBaseViewSet:
    permission_classes = (ScbpDjradViewSetPermissions,)
    filter_backends = (DjradDjangoFilterBackend, ScbpOrderingFilter)

    def perform_create(self, serializer):
        """Re-throws any django core validation errors to DRF validation errors

        This results in the validation errors being returned to frontend as 400 response
        rather than causing a 500. Primarily for use when defining custom validation
        on the model (eg. calling `self._validate()` in `save`)
        """
        try:
            super().perform_create(serializer)
        except CoreValidationError as cve:
            raise django_validation_error_to_drf(cve)

    def perform_update(self, serializer):
        """Re-throws any django core validation errors to DRF validation errors

        This results in the validation errors being returned to frontend as 400 response
        rather than causing a 500. Primarily for use when defining custom validation
        on the model (eg. calling `self._validate()` in `save`)
        """
        try:
            super().perform_update(serializer)
        except CoreValidationError as cve:
            raise django_validation_error_to_drf(cve)


class ScbpModelViewSet(ScbpModelBaseViewSet, DjradModelViewSet):
    pass


class ScbpModelNoDeleteViewSet(
    ScbpModelBaseViewSet,
    mixins.RelatedModelLookupMixin,
    mixins.CreateModelMixin,
    mixins.RetrieveModelMixin,
    mixins.UpdateModelMixin,
    mixins.ListModelMixin,
    DjradGenericViewSet,
):
    pass


class ScbpModelRegistration(ModelRegistration):
    def create_field_descriptor_for_serializer_field(
        self, field, field_kwargs, model_field=None
    ):
        from scbp_core.djrad.common.address import BaseAddressSerializer
        from scbp_core.djrad.common.creditcard import CreditCardSerializer

        if isinstance(model_field, BooleanField) or isinstance(field, DRFBooleanField):
            # djrad_rest returns NullBooleanField which causes issues with frontend Checkbox & SwitchWidget input types
            return BooleanFieldDescriptor(**field_kwargs)
        if isinstance(model_field, HtmlField):
            return HtmlFieldDescriptor(**field_kwargs)
        if isinstance(field, BaseAddressSerializer):
            return AddressFieldDescriptor(**field_kwargs)
        if isinstance(field, CreditCardSerializer):
            return CreditCardFieldDescriptor(**field_kwargs)
        descriptor = super().create_field_descriptor_for_serializer_field(
            field, field_kwargs, model_field
        )
        return descriptor

    def create_field_descriptor_for_unknown_field(
        self, field, model_field, field_kwargs
    ):
        from scbp_core.djrad.admin import DispatchDriverNumberField

        # For fields we don't want to provide a descriptor for add here - this removes warning from djrad
        if isinstance(field, (JSONField, DispatchDriverNumberField)):
            # TODO: Add a proper descriptor for JSONField later (should map to a immutable Map or plain js object)
            return AnyTypeFieldDescriptor(**field_kwargs)
        return None

    def get_filter_descriptors(self):
        try:
            return super().get_filter_descriptors()
        except TypeError as e:
            # Handle case that comes up because of using OrderedDict.items() for choices
            # Would be nice if we could handle this transparently; might be possible by hooking
            # into how django-filters generates fields for choices. For now make it clear to
            # developer why it's happening.
            # Can either fix on the FilterSet by defining the field explicitly and passing choices
            # as a list or by converting to a list on the model choices itself.
            if "can't pickle odict_items" in str(e):
                raise ValueError(
                    "This error is caused by using .items() from an OrderedDict in choices on a model. These cannot be pickled and cause issues with djrad / django-filters. To fix wrap in list(ChoiceConsant.choices.items())"
                ) from e
            raise e
