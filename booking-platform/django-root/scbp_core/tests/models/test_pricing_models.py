from datetime import timedelta
from decimal import Decimal

from django.test import TestCase
from django.utils import timezone

from scbp_core.models import PriceList
from scbp_core.models import VehicleClassPriceList
from scbp_core.tests.factory.vehicle import VehicleClassFactory


class TestingPricingModel(TestCase):
    def test_get_current(self):
        price_list = PriceList.get_current()
        self.assertEqual(price_list.is_current, True)
        self.assertEqual(PriceList.objects.count(), 1)
        self.assertEqual(PriceList.get_current(), price_list)

    def test_get_future(self):
        price_list = PriceList.get_future()
        self.assertEqual(price_list.is_current, None)
        self.assertEqual(price_list.is_future, True)
        self.assertEqual(PriceList.objects.count(), 1)
        self.assertEqual(PriceList.get_future(), price_list)

    def test_get_current_with_future_booking_date(self):
        future_price_list = PriceList.get_future()
        future_price_list.scheduled_from = timezone.localtime() + timedelta(days=10)
        future_price_list.save(save_existing=True)
        future_scheduled_date = future_price_list.scheduled_from
        current_price_list = PriceList.get_current(travel_date=future_scheduled_date)

        self.assertEqual(current_price_list.is_current, None)
        self.assertEqual(current_price_list.is_future, True)
        self.assertEqual(future_price_list, current_price_list)

    def test_future_price_list_switches_to_current(self):
        # Get our future price list with some attributes to check
        future_price_list = PriceList.get_future()
        future_price_list.scheduled_from = timezone.localtime() + timedelta(days=-1)
        future_price_list.wedding_ribbon_fee = Decimal("1000")
        future_price_list.save(save_existing=True)

        # Check that our future price list is future and not current
        self.assertEqual(future_price_list.is_current, None)
        self.assertEqual(future_price_list.is_future, True)

        # Get the current price list without a passed date
        current_price_list = PriceList.get_current()
        self.assertEqual(current_price_list.is_current, True)
        # Check that the current price list now has the value that was on the future list
        self.assertEqual(current_price_list.wedding_ribbon_fee, Decimal("1000"))
        # Check it doesn't have future flag or scheduled_from
        self.assertEqual(current_price_list.is_future, None)
        self.assertEqual(current_price_list.scheduled_from, None)

        # Check that passing scheduled_from date will still choose the correct list
        current_price_list_with_date = PriceList.get_current(
            travel_date=future_price_list.scheduled_from
        )
        self.assertEqual(current_price_list_with_date, current_price_list)

        # Get the latest future price list
        new_future_price_list = PriceList.get_future()
        # Check it isn't current and is future
        self.assertEqual(new_future_price_list.is_current, None)
        self.assertEqual(new_future_price_list.is_future, True)
        # Check that we don't have the old future value set
        self.assertNotEqual(new_future_price_list.wedding_ribbon_fee, Decimal("1000"))
        self.assertEqual(PriceList.objects.filter(is_current=True).count(), 1)
        self.assertEqual(PriceList.objects.filter(is_future=True).count(), 1)
        # Check that the latest current record is the same one as our original future.
        self.assertEqual(PriceList.objects.get(is_current=True), future_price_list)

    def test_modify_creates_new(self):
        price_list = PriceList.get_current()
        original_price_list = PriceList.objects.get(pk=price_list.pk)
        self.assertEqual(PriceList.objects.count(), 1)
        price_list.additional_stop_fee = Decimal("666")
        price_list.save()

        self.assertTrue(price_list.is_current)
        self.assertEqual(PriceList.objects.count(), 2)
        self.assertEqual(PriceList.objects.filter(is_current=True).count(), 1)
        original_price_list.refresh_from_db()
        self.assertNotEqual(
            original_price_list.additional_stop_fee, price_list.additional_stop_fee
        )

    def test_delete_disabled(self):
        price_list = PriceList.get_current()
        with self.assertRaisesMessage(ValueError, "delete not supported"):
            price_list.delete()
        with self.assertRaisesMessage(ValueError, "delete not supported"):
            PriceList.objects.all().delete()

    def test_vehicle_class_price_changes_are_tracked(self):
        PriceList.get_current()  # this creates an 'initial' price list, one unattached to any vehicle class

        vehicle_class = VehicleClassFactory(one_way_rate_tier1=3)

        self.assertEqual(
            VehicleClassPriceList.objects.count(), 1
        )  # there should be exactly one VCPL created at this point

        self.assertEqual(
            VehicleClassPriceList.objects.filter(
                price_list=PriceList.get_current(), vehicle_class=vehicle_class
            )
            .first()
            .one_way_rate_tier1,
            3,
        )

        vehicle_class.one_way_rate_tier1 = 8
        vehicle_class.save()

        self.assertEqual(
            VehicleClassPriceList.objects.filter(
                price_list=PriceList.get_current(), vehicle_class=vehicle_class
            )
            .first()
            .one_way_rate_tier1,
            8,
        )
