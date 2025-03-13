from django.db.models.signals import post_delete
from django.db.models.signals import post_save
from django.dispatch import receiver

from scbp_core.models.pricing import DistanceOverride
from scbp_core.models.pricing import Holiday
from scbp_core.models.pricing import HourRateType


@receiver([post_save, post_delete], sender=Holiday)
def reset_is_holiday_cache(sender, instance, **kwargs):
    Holiday.is_holiday.cache_clear()


@receiver(post_save, sender=HourRateType)
def reset_get_hour_type_for_cache(sender, instance, **kwargs):
    HourRateType.get_hour_type_for.cache_clear()


@receiver([post_save, post_delete], sender=DistanceOverride)
def reset_postcode_cache(sender, instance, **kwargs):
    DistanceOverride.get_override_by_postcodes.cache_clear()
