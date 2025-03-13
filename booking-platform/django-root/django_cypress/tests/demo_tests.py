from django.test import SimpleTestCase
from django.test import TestCase

from django_cypress.tests.utils import create_test_user


# TESTCASE FOR ASSERTION PURPOSE
class TestCaseA(SimpleTestCase):
    def test_failing_test_case(self):
        self.assertEqual("foo", "bar")


# SELF-CONTAINED TESTCASE - note the original setup/teardown won't be called
class TestCaseB(TestCase):
    @classmethod
    def setUpTestData(cls):
        super().setUpTestData()
        create_test_user("test_user@localhost.dev")
