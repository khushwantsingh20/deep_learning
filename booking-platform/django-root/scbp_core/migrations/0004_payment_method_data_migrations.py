from django.db import migrations
from django.db.models.expressions import Case
from django.db.models.expressions import F
from django.db.models.expressions import OuterRef
from django.db.models.expressions import Subquery
from django.db.models.expressions import Value
from django.db.models.expressions import When

# Enumerations for the Account.payment_method field
ACCOUNT_INVOICE = 1
ACCOUNT_CREDIT_CARD = 2
ACCOUNT_DRIVER_COLLECT = 3

# Old enumerations for the Booking.booking_payment_method field
OLD_ACCOUNT = 1
OLD_CABCHARGE = 2
OLD_CAB_CARD = 3
OLD_CAB_CASH = 4

# New enumerations for the Booking.booking_payment_method field
NEW_INVOICE = 1
NEW_CREDIT_CARD = 2
NEW_DRIVER_COLLECT = 3

# Enumerations for the Booking.driver_collect_method field
DC_NONE = 0
DC_CABCHARGE = 1
DC_CAB_CARD = 2
DC_CAB_CASH = 3


def _migrate(booking_model, reverse=False):
    booking_qs = booking_model.objects.all()
    if reverse:
        # Update all bookings whose booking_payment_method2 is NOT new_driver_collect
        (
            booking_qs.exclude(booking_payment_method2=NEW_DRIVER_COLLECT).update(
                booking_payment_method=Value(OLD_ACCOUNT)
            )
        )

        # Now update all bookings whose booking_payment_method2 IS new_driver_collect
        (
            booking_qs.filter(booking_payment_method2=NEW_DRIVER_COLLECT)
            .annotate(
                new_booking_payment_method=Case(
                    When(
                        booking_payment_method=DC_CABCHARGE, then=Value(OLD_CABCHARGE)
                    ),
                    When(booking_payment_method=DC_CAB_CARD, then=Value(OLD_CAB_CARD)),
                    When(booking_payment_method=DC_CAB_CASH, then=Value(OLD_CAB_CASH)),
                    default=Value(OLD_CABCHARGE),
                )
            )
            .update(booking_payment_method=F("new_booking_payment_method"))
        )
    else:
        # If you try and use F("account__payment_method") in a .update() (even if it's annotated prior), you get a
        # "Joined field references are not permitted in this query" error
        # Subquery annotation is the only workaround I can find :( still speeds up the migration almost 3x compared
        # To doing it all python-side and bulk_update's though.
        booking_qs = booking_qs.annotate(
            account_payment_method=Subquery(
                booking_model.objects.filter(pk=OuterRef("pk")).values(
                    "account__payment_method"
                )[:1]
            )
        )

        # Update Booking's whose booking_payment_method is NOT old_account first
        (
            booking_qs.exclude(booking_payment_method=OLD_ACCOUNT)
            # old booking payment-method is one of OLD_CABCHARGE, OLD_CAB_CARD or OLD_CAB_CASH.
            .annotate(
                new_driver_collect_method=Case(
                    When(
                        booking_payment_method=OLD_CABCHARGE, then=Value(DC_CABCHARGE)
                    ),
                    When(booking_payment_method=OLD_CAB_CARD, then=Value(DC_CAB_CARD)),
                    When(booking_payment_method=OLD_CAB_CASH, then=Value(DC_CAB_CASH)),
                )
            ).update(
                booking_payment_method2=NEW_DRIVER_COLLECT,
                driver_collect_method=F("new_driver_collect_method"),
            )
        )

        # Now update all bookings that ARE old_account
        (
            booking_qs.filter(booking_payment_method=OLD_ACCOUNT)
            .annotate(
                new_payment_method=Case(
                    When(
                        account_payment_method=ACCOUNT_INVOICE, then=Value(NEW_INVOICE)
                    ),
                    When(
                        account_payment_method=ACCOUNT_CREDIT_CARD,
                        then=Value(NEW_CREDIT_CARD),
                    ),
                    When(
                        account_payment_method=ACCOUNT_DRIVER_COLLECT,
                        then=Value(NEW_DRIVER_COLLECT),
                    ),
                )
            )
            .annotate(
                new_driver_collect_method=Case(
                    # Booking payment-method = Account, Account payment-method = Driver-collect -> We don't actually
                    # know what the collection method should be.  Going with DC_CAB_CARD as this seems to be the most
                    # common payment method in existing data.
                    When(
                        account_payment_method=ACCOUNT_DRIVER_COLLECT,
                        then=Value(DC_CAB_CARD),
                    ),
                    default=Value(DC_NONE),
                )
            )
            .update(
                booking_payment_method2=F("new_payment_method"),
                driver_collect_method=F("new_driver_collect_method"),
            )
        )


def migrate_to_new_fields(apps, _schema_editor):
    Booking = apps.get_model("scbp_core", "Booking")
    _migrate(Booking)


def migrate_to_old_fields(apps, _schema_editor):
    Booking = apps.get_model("scbp_core", "Booking")
    _migrate(Booking, reverse=True)


class Migration(migrations.Migration):
    dependencies = [
        ("scbp_core", "0003_add_booking_payment_method_fields"),
    ]

    operations = [
        migrations.RunPython(
            migrate_to_new_fields, reverse_code=migrate_to_old_fields, elidable=True
        ),
    ]
