from django.db import migrations

# Enumerations for the Account.payment_method field
ACCOUNT_INVOICE = 1
ACCOUNT_CREDIT_CARD = 2
ACCOUNT_DRIVER_COLLECT = 3

# Enumerations for the Account.driver_collect_method fields
ACCOUNT_DRIVER_COLLECT_NONE = 0
ACCOUNT_DRIVER_COLLECT_CABCHARGE = 1
ACCOUNT_DRIVER_COLLECT_CAB_CARD = 2
ACCOUNT_DRIVER_COLLECT_CAB_CASH = 3


def populate_driver_collect_field(apps, _schema_editor):
    """
    For existing Accounts where the payment method is Driver Collect, we need to ensure the driver collect method is
    set to something valid, rather than (default) NONE.

    The requested default is credit-card.
    """
    Account = apps.get_model("scbp_core", "Account")
    Account.objects.filter(
        payment_method=ACCOUNT_DRIVER_COLLECT,
        driver_collect_method=ACCOUNT_DRIVER_COLLECT_NONE,
    ).update(driver_collect_method=ACCOUNT_DRIVER_COLLECT_CAB_CARD)


class Migration(migrations.Migration):
    dependencies = [
        ("scbp_core", "0007_account_driver_collect_method"),
    ]

    operations = [
        migrations.RunPython(
            populate_driver_collect_field,
            reverse_code=migrations.RunPython.noop,
            elidable=True,
        ),
    ]
