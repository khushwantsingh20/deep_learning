import datetime
from unittest import skip
from unittest import skipIf

from django.conf import settings
from freezegun import freeze_time

from scbp_core.models import DistanceOverride
from scbp_core.models.booking_field_choices import BookingAddressType
from scbp_core.models.pricing import Holiday
from scbp_core.models.pricing import HourRateType
from scbp_core.services.pricing import PriceCalculator
from scbp_core.tests.distance_mock_decorators import test_case_mock_distance_to_gpo
from scbp_core.tests.factory.account import AccountFactory
from scbp_core.tests.factory.booking import AddressFactory
from scbp_core.tests.factory.booking import OneWayBookingFactory
from scbp_core.tests.factory.user import ClientUserFactory
from scbp_core.tests.pricing.pricing_test_case import PricingTestCase


@test_case_mock_distance_to_gpo
@freeze_time("2019-07-01 10:00AM")
class TestDatabaseQueries(PricingTestCase):
    def setUp(self):
        super().setUp()
        # Setting up the price calculator under test
        account = AccountFactory()
        creator = ClientUserFactory()
        from_address = AddressFactory.create(
            source_id="ChIJi7iHMsk41moR_7dXVxseiZ4",
            formatted_address="234 Whitehorse Road, Nunawading VIC 3131",
            postal_code="3131",
        )
        destination_address = AddressFactory.create(
            source_id="ChIJL_MrvoNB1moRNem-PT2uQJQ",
            formatted_address="793 Burke Road, Camberwell VIC 3124",
            postal_code="3124",
        )
        self.booking = OneWayBookingFactory(
            vehicle_class=self.vehicle_classes["Any Class"],
            account=account,
            created_by=creator,
            client_user=creator,
            from_address=from_address,
            from_address_type=BookingAddressType.CUSTOM,
            destination_address=destination_address,
            destination_address_type=BookingAddressType.OFFICE,
        )
        self.price_calculator = PriceCalculator(self.booking, self.price_list)
        # Clearing appropriate caches
        Holiday.is_holiday.cache_clear()
        HourRateType.get_hour_type_for.cache_clear()
        PriceCalculator._event_for_booking.cache_clear()
        PriceCalculator._booking_price_override.cache_clear()
        DistanceOverride.get_override_by_postcodes.cache_clear()

    @skip(
        """
    Need to investigate query-count disparities to understand if they're legitimate eg. just django ORM being more
    conservative around caching, or whether this indicates a problematic regression."""
    )
    def test_num_queries_django_2_2(self):
        # With all caches invalidated, we should have 6 queries in this setup
        self.assertNumQueries(6, lambda: self.price_calculator.total())
        # Same breakdown - should hit all caches - expect 0 queries
        self.assertNumQueries(0, lambda: self.price_calculator.price_breakdown())
        # New calculator - expect 4 queries
        # is_holiday and get_hour_type_for caches hit,
        # _event_for_booking, _booking_price_adjustment, and _booking_price_override caches missed
        self.assertNumQueries(
            4, lambda: PriceCalculator(self.booking, self.price_list).total()
        )
        # Save a new holiday - should invalidate is_holiday cache - expect 1 query
        # We don't care about the holiday date - only that a new holiday is saved
        Holiday.objects.create(title="Test Holiday", date=datetime.date.today())
        self.assertNumQueries(1, lambda: self.price_calculator.total())
        # Verify our caches work as expected (ensures that the next part only tests the delete Holiday cache reset)
        self.assertNumQueries(0, lambda: self.price_calculator.total())
        # Delete a holiday - should invalidate is_holiday cache - expect 1 query
        Holiday.objects.first().delete()
        self.assertNumQueries(1, lambda: self.price_calculator.total())
        # Verify our caches work as expected (ensures that the next part only tests the save HourRateType cache reset)
        self.assertNumQueries(0, lambda: self.price_calculator.total())
        # Save an hour rate type - should invalidate get_hour_type_for cache - expect 1 query
        test_rate_type = HourRateType.objects.first()
        test_rate_type.save()
        self.assertNumQueries(1, lambda: self.price_calculator.total())

    @skipIf(settings.SKIP_GOOGLE_API_TESTS, "Skipping Google Maps unit-tests")
    def test_num_queries_django_4_2(self):
        # With all caches invalidated, we should have 6 queries in this setup
        self.assertNumQueries(8, lambda: self.price_calculator.total())
        # Same breakdown - should hit all caches - expect 0 queries
        self.assertNumQueries(0, lambda: self.price_calculator.price_breakdown())
        # New calculator - expect 4 queries
        # is_holiday and get_hour_type_for caches hit,
        # _event_for_booking, _booking_price_adjustment, and _booking_price_override caches missed
        self.assertNumQueries(
            4, lambda: PriceCalculator(self.booking, self.price_list).total()
        )
        # Save a new holiday - should invalidate is_holiday cache - expect 1 query
        # We don't care about the holiday date - only that a new holiday is saved
        Holiday.objects.create(title="Test Holiday", date=datetime.date.today())
        self.assertNumQueries(1, lambda: self.price_calculator.total())
        # Verify our caches work as expected (ensures that the next part only tests the delete Holiday cache reset)
        self.assertNumQueries(0, lambda: self.price_calculator.total())
        # Delete a holiday - should invalidate is_holiday cache - expect 1 query
        Holiday.objects.first().delete()
        self.assertNumQueries(1, lambda: self.price_calculator.total())
        # Verify our caches work as expected (ensures that the next part only tests the save HourRateType cache reset)
        self.assertNumQueries(0, lambda: self.price_calculator.total())
        # Save an hour rate type - should invalidate get_hour_type_for cache - expect 1 query
        test_rate_type = HourRateType.objects.first()
        test_rate_type.save()
        self.assertNumQueries(1, lambda: self.price_calculator.total())
