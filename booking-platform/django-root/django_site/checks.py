import ast
from collections import defaultdict
import inspect
from typing import Callable
from typing import Dict
from typing import Iterable
from typing import List
from typing import Optional
from typing import Type

from allianceutils.util import get_firstparty_apps
from django.apps import AppConfig
from django.apps import apps
from django.conf import settings
from django.core.checks import CheckMessage
from django.core.checks import Error
from django.db import models
from django.db.models import Model
from django.db.models.options import Options

ID_BAD_REGISTRATION_SERIALIZER_CLASS = "django_site.E001"
ID_BAD_PERMISSION_REGISTRATION = "django_site.E002"
ID_ERROR_PERMISSIONS = "django_site.E003"
ID_ERROR_EXPLICIT_TABLE_NAME = "django_site.E004"
ID_ERROR_EXPLICIT_TABLE_NAME_LOWERCASE = "django_site.E004"


def find_candidate_models(
    app_configs: Optional[Iterable[AppConfig]], ignore_labels: List[str] = None
) -> Dict[str, Type[Model]]:
    """
    Given a list of labels to ignore, return models whose app_label or label is NOT in ignore_labels.
    :return: dict which is a mapping of candidate models in the format of { model_label: Model }
    """
    if app_configs is None:
        app_configs = get_firstparty_apps()

    if ignore_labels is None:
        ignore_labels = []

    ignore_labels = set(ignore_labels)
    candidate_models: Dict[str, Type[Model]] = {}

    for app_config in app_configs:
        candidate_models.update(
            {
                model._meta.label: model
                for model in app_config.get_models()
                if model._meta.app_label not in ignore_labels
                and model._meta.label not in ignore_labels
            }
        )

    return candidate_models


def make_site_check(site):
    def check_registrations(app_configs, **kwargs):
        errors = []
        registration_by_serializer_class = defaultdict(list)
        for _, registration in site.registry.items():
            registration_by_serializer_class[
                registration.get_serializer_class()
            ].append(registration)
        for serializer_class, registrations in registration_by_serializer_class.items():
            if len(registrations) > 1:
                reg_names = ", ".join([reg.__class__.__name__ for reg in registrations])
                # If class has provided it's own get_permission_registration_class all is well. NOTE: This specifically
                # doesn't count inherited methods - subclasses must implement their own
                if not serializer_class.__dict__.get(
                    "get_permission_registration_class"
                ):
                    errors.append(
                        Error(
                            f"The serializer class {serializer_class.__name__} is used on multiple registrations.",
                            hint=f"If you do this "
                            "you must either implement the 'get_permission_registration_class' function on the serializer "
                            f"OR create a new serializer class that extends {serializer_class.__name__} for each registration. "
                            f"The registrations in question are: {reg_names}",
                            obj=serializer_class,
                            id=ID_BAD_REGISTRATION_SERIALIZER_CLASS,
                        )
                    )
                else:
                    registration_class = (
                        serializer_class().get_permission_registration_class()
                    )
                    if not any(
                        [isinstance(reg, registration_class) for reg in registrations]
                    ):
                        errors.append(
                            Error(
                                "get_permission_registration_class returns invalid registration class",
                                hint=f"Registration class must be one of {reg_names}",
                                obj=serializer_class,
                                id=ID_BAD_PERMISSION_REGISTRATION,
                            )
                        )
        return errors

    return check_registrations


def get_models(exclude_test_models: bool = True) -> List[models.Model]:
    """
    Get all models in app, excluding test models
    :param exclude_test_models:
    :return List: list of models
    """
    models = []

    # Ignore test models
    if exclude_test_models and hasattr(settings, "TEST_MODEL_APPS"):
        for app_config in apps.app_configs.values():
            if app_config.name not in settings.TEST_MODEL_APPS:
                models.extend(list(app_config.get_models()))
    else:
        models = apps.get_models()

    return models


def check_permissions(**kwargs) -> List[CheckMessage]:
    """
    Check that models in current app override default permission
    unless they are
    - Test models
    - many to many models (currently a hard coded list)
    - external library models
    :return List[CheckMessage]: list of Errors
    """
    default_django_options = Options(None, None)
    errors = []

    # include_apps = [app.label for app in get_firstparty_apps()]
    include_apps = ["django_site", "scbp_core"]

    for model in get_models():
        # Ignore specific many to many join tables
        if model._meta.app_label not in include_apps:
            continue

        # Check if default permissions are overridden by have been overriden from django defaults
        if (
            model._meta.default_permissions
            == default_django_options.default_permissions
        ):
            errors.append(
                Error(
                    "Meta does not inherit from DefaultPermissionsMeta or define custom permissions",
                    obj=model,
                    id=ID_ERROR_PERMISSIONS,
                )
            )
    return errors


def _check_explicit_table_names_on_model(
    model: Type[Model], enforce_lowercase: bool
) -> Iterable[Type[Error]]:
    """
    Use an ast to check if a model has the db_table meta option set.
    This is done this way because a model instance's db_table is always
    populated even if with that of the default.
    """
    errors = []
    found = None
    tree = ast.parse(inspect.getsource(model))
    for node in ast.walk(tree):
        if isinstance(node, ast.ClassDef) and node.name == "Meta":
            for sub_node in node.body:
                if isinstance(sub_node, ast.Assign):
                    if sub_node.targets[0].id == "db_table":
                        found = sub_node.value.s
                        break
    if not found:
        errors.append(
            Error(
                "Explicit table name required",
                hint=f"Add db_table setting to {model._meta.label} model Meta",
                obj=model,
                id=ID_ERROR_EXPLICIT_TABLE_NAME,
            )
        )
    elif enforce_lowercase and not found.islower():
        errors.append(
            Error(
                "Table names must be lowercase",
                hint=f"Check db_table setting for {model._meta.label}",
                obj=model,
                id=ID_ERROR_EXPLICIT_TABLE_NAME_LOWERCASE,
            )
        )

    return errors


def make_check_explicit_table_names(
    ignore_labels: Optional[Iterable[str]], enforce_lowercase: bool = True
) -> Callable:
    """
    Return a function that checks for models with missing or invalid db_table settings

    Args:
        ignore_labels: ignore apps or models matching supplied labels
        enforce_lowercase: applies rule E010 which enforces table name to be all lowercase; defaults to True

    Returns:
        check function for use with django system checks
    """

    def _check_explicit_table_names(app_configs: Iterable[AppConfig], **kwargs):
        """
        Warn when models don't have Meta's db_table_name set in apps that require it.
        """
        candidate_models = find_candidate_models(app_configs, ignore_labels)
        errors = []
        for model in candidate_models.values():
            if not model._meta.proxy:
                errors += _check_explicit_table_names_on_model(model, enforce_lowercase)
        return errors

    return _check_explicit_table_names


# TODO: Check all proxy models inherit from non-proxy models (not part of MVP)


DEFAULT_TABLE_NAME_CHECK_IGNORE = ["auth", "test_csv_permissions", "scbp_legacy"]
check_explicit_table_names = make_check_explicit_table_names(
    DEFAULT_TABLE_NAME_CHECK_IGNORE
)
