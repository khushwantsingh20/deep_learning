# import warnings

from django.db import connections
from django.db import transaction
from django.db.backends.base.base import BaseDatabaseWrapper

# from django.db.utils import OperationalError

# from django_cypress.utils import cypress_manage
# BaseDatabaseWrapper.close_if_unusable_or_obsolete = cypress_manage()


def close_if_unusable_or_obsolete(self: BaseDatabaseWrapper):
    """
    Close the current connection if the connection has errors

    Is called at the end of each request

    This method gets patched onto BaseDatabaseWrapper
    """

    if self.connection is None:
        # no physical connection; do nothing
        return

    if self.errors_occurred:
        # a database exception was thrown; run a query or ping the server to confirm that connection still works
        if self.is_usable():
            # still works; do nothing
            self.errors_occurred = False
        else:
            # If we get here it's usually because an SQL error occurred and the app had not issued a rollback() by
            # the end of the request; postgres will refuse to run any more SQL commands until it sees a rollback()
            #
            # We have chosen to close the current transaction entirely but really have no better way to deal with this
            #
            # This will potentially cause expected results in tests(particularly if dealing with multiple connections;
            # only 1 will be rolled back)
            #
            # set_autocommit(True) might have worked but django won't let you do that in a transaction

            _rollback_connection(self)


def _patch_connection(conn):
    """
    Patch a connection to be always in a transaction
    """
    assert not hasattr(conn, "_django_cypress_global_transaction")
    conn._django_cypress_global_transaction = transaction.atomic(using=conn.alias)
    conn._django_cypress_global_transaction.__enter__()


def _rollback_connection(conn):
    """
    Rollback a previously patched connection and start a new transaction
    """
    # I can't create a situation where this happens without being malicious, but if the connection has disconnected
    # then will issuing a rollback just cause an error?
    # Django appears to handle this situation but if not we may need to change this to detect closed connections
    # (see .is_usable() in close_if_unusable_or_obsolete())
    transaction.set_rollback(True, using=conn.alias)
    conn._django_cypress_global_transaction.__exit__(None, None, None)
    del conn._django_cypress_global_transaction
    conn.close()
    _patch_connection(conn)


def patch_all_connections():
    """
    Patch all database connections to be always in a transaction

    This must be done before the first request is handled in order for the transactions to persist
    """
    assert (
        BaseDatabaseWrapper.close_if_unusable_or_obsolete
        != close_if_unusable_or_obsolete
    ), "Can't patch BaseDatabaseWrapper twice"
    assert (
        BaseDatabaseWrapper.close_if_unusable_or_obsolete.__module__
        == "django.db.backends.base.base"
    ), "Something else patched BaseDatabaseWrapper"
    BaseDatabaseWrapper.close_if_unusable_or_obsolete = close_if_unusable_or_obsolete

    for conn in connections.all():
        _patch_connection(conn)


def verify_patched_connections():
    """
    Verify that all connections are still patched
    """
    for conn in connections.all():
        assert (
            conn.close_if_unusable_or_obsolete.__func__ == close_if_unusable_or_obsolete
        )
        assert hasattr(conn, "_django_cypress_global_transaction")


def rollback_connections():
    """
    Rollback all connection transactions and start new ones
    """
    for conn in connections.all():
        _rollback_connection(conn)
