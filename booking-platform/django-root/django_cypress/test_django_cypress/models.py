from django.db import models

from scbp_core.permissions import DefaultPermissionsMeta


class TestModel(models.Model):
    data = models.CharField(max_length=255)

    class Meta(DefaultPermissionsMeta):
        db_table = "django_cypress_test_model"
