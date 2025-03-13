from django.db import migrations

from scbp_core.models import AccountStatement
from scbp_core.models import Invoice


class Migration(migrations.Migration):
    dependencies = [
        ("scbp_core", "0001_initial"),
    ]

    operations = [
        *AccountStatement.get_custom_migration_commands(),
        *Invoice.get_custom_migration_commands(),
    ]
