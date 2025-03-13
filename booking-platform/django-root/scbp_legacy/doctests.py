import doctest

from scbp_legacy.data_migration import bookings
from scbp_legacy.data_migration import clients


def run():
    doctest.testmod(clients)
    doctest.testmod(bookings)
