from collections import OrderedDict

from django.db.models import CheckConstraint
from django.db.models import Q
from django.test import SimpleTestCase

from django_site.views import create_choice_constants
from scbp_core.fields import get_choices_check_constraint


class TestChoices(SimpleTestCase):
    def test_get_choices_check_constraint(self):
        class ABC:
            A = 1
            B = 2
            C = 3

            choices = OrderedDict(((A, "A"), (B, "B"), (C, "C")))

        check = get_choices_check_constraint(ABC.choices, "f", "test")
        self.assertEqual(check, CheckConstraint(check=Q(f__in=[1, 2, 3]), name="test"))

    def test_create_choice_constants(self):
        class ABC:
            A = 1
            B = 2
            C = 3

            choices = OrderedDict(((A, "One"), (B, "Two"), (C, "Three")))

        class DEF:
            D = 3
            E = 4
            F = 5

            choices = OrderedDict(((D, "Four"), (E, "Five"), (F, "Six")))

        self.assertEqual(
            create_choice_constants(ABC, DEF),
            {
                "ABC": [
                    dict(label="One", value=1, name="A"),
                    dict(label="Two", value=2, name="B"),
                    dict(label="Three", value=3, name="C"),
                ],
                "DEF": [
                    dict(label="Four", value=3, name="D"),
                    dict(label="Five", value=4, name="E"),
                    dict(label="Six", value=5, name="F"),
                ],
            },
        )
