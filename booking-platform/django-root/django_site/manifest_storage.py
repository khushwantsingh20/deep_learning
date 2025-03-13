from pathlib import Path

from django.conf import settings
from django.contrib.staticfiles.storage import ManifestFilesMixin
from django.contrib.staticfiles.storage import StaticFilesStorage


class ManifestStaticFilesExcludeWebpackStorage(ManifestFilesMixin, StaticFilesStorage):
    """Same as ManifestStaticFilesStorage but ignores files built by webpack"""

    def hashed_name(self, name, content=None, filename=None):
        # Check if file is in the output dir for webpack and if so don't generate a hash
        # in the manifest for it. We let webpack generate hashes for the files it generates
        # but use the manifest for all other files (eg. other django static files)
        for stat_dir, src in settings.STATICFILES_DIRS:
            if (
                src == settings.FRONTEND_PRODUCTION_DIR
                and Path(name).parts[0] == stat_dir
            ):
                return name
        else:
            return super().hashed_name(name, content, filename)
