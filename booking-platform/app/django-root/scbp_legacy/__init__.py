from os.path import abspath
from os.path import dirname

from django.apps import apps


def load_tests(loader, tests, pattern):
    """
    scbp_legacy has no tests, but Django's test runner still "discovers" this app as needing to be loaded
    because it imports the bottom-most __init__.py that it finds, which is scbp_legacy.data_migration.__init__
    which causes undesired errors when the app isn't actually an installed app
    (if you do add "scbp_legacy" to your INSTALLED_APPS though, then this runs as Django intended)
    """
    if apps.is_installed("scbp_legacy"):
        return loader.discover(start_dir=dirname(abspath(__file__)), pattern=pattern)
