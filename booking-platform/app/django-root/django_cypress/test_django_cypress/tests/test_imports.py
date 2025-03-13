from unittest import skipIf

from django.conf import settings
from django.test import SimpleTestCase

from django_cypress.views import _import_function


def module_func():
    pass


class ExampleClass(object):
    @classmethod
    def class_func(cls):
        pass


class ImportCallableStringTestCase(SimpleTestCase):
    @skipIf(
        "django_cypress.test_django_cypress" not in settings.INSTALLED_APPS,
        "Only test if explicitly included",
    )
    def test_valid_module_function_import(self):
        func = _import_function(
            "django_cypress.test_django_cypress.tests.test_imports.module_func"
        )
        self.assertTrue(callable(func))

    @skipIf(
        "django_cypress.test_django_cypress" not in settings.INSTALLED_APPS,
        "Only test if explicitly included",
    )
    def test_invalid_module_function_import(self):
        with self.assertRaises(ImportError):
            _ = _import_function(
                "django_cypress.test_django_cypress.tests.test_imports.non_existent_func"
            )

    @skipIf(
        "django_cypress.test_django_cypress" not in settings.INSTALLED_APPS,
        "Only test if explicitly included",
    )
    def test_valid_class_method_import(self):
        func = _import_function(
            "django_cypress.test_django_cypress.tests.test_imports.ExampleClass.class_func"
        )
        self.assertTrue(callable(func))

    @skipIf(
        "django_cypress.test_django_cypress" not in settings.INSTALLED_APPS,
        "Only test if explicitly included",
    )
    def test_invalid_class_import(self):
        with self.assertRaises(ImportError):
            _ = _import_function(
                "django_cypress.test_django_cypress.tests.test_imports.NonExistentClass.class_func"
            )

    @skipIf(
        "django_cypress.test_django_cypress" not in settings.INSTALLED_APPS,
        "Only test if explicitly included",
    )
    def test_invalid_class_method_import(self):
        with self.assertRaises(ImportError):
            _ = _import_function(
                "django_cypress.test_django_cypress.tests.test_imports.ExampleClass.no_class_func"
            )
