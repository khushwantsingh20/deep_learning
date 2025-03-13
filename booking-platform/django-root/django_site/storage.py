from django.conf import settings
from storages.backends.s3boto3 import S3Boto3Storage


# Define custom storage classes so we can have media and static files with
# separate prefixes on S3
class MediaStorage(S3Boto3Storage):
    location = settings.MEDIAFILES_LOCATION
