import datetime

from django.test import TestCase

from scbp_core.djrad.app import CreateUpdateBookingSerializer
from scbp_core.models import BookingAddress
from scbp_core.models import BookingAddressType
from scbp_core.models import BookingType
from scbp_core.models import VehicleClass


class CreateBookingSerializerTestCase(TestCase):
    fixtures = ["vehicle_class.json", "booking_lead_time.json"]

    def setUp(self) -> None:
        vc = VehicleClass.objects.first()
        self.valid_step1_one_way = {
            "booking_type": BookingType.ONE_WAY,
            "travel_on_date": datetime.date.today() + datetime.timedelta(days=1),
            "travel_on_time": datetime.time(hour=16, minute=0),
            "passenger_count": 2,
            "baggage_count": 1,
            "from_address_type": BookingAddressType.CUSTOM,
            "from_address": {
                "postal_code": "3131",
                "formatted_address": "224 whitehorse road",
                "lat": 0,
                "long": 0,
                "source_id": "abc123",
            },
            "destination_address_type": BookingAddressType.CUSTOM,
            "destination_address": {
                "postal_code": "3000",
                "formatted_address": "somewhere else",
                "lat": 0,
                "long": 0,
                "source_id": "abc456",
            },
        }
        self.valid_step2_one_way = {
            **self.valid_step1_one_way,
            "vehicle_class_id": vc.pk,
        }
        self.valid_step1_hourly = {
            "booking_type": BookingType.HOURLY,
            "travel_on_date": datetime.date.today() + datetime.timedelta(days=1),
            "travel_on_time": datetime.time(hour=16, minute=0),
            "passenger_count": 2,
            "baggage_count": 1,
            "from_address_type": BookingAddressType.CUSTOM,
            "from_address": {
                "postal_code": "3131",
                "formatted_address": "224 whitehorse road",
                "lat": 0,
                "long": 0,
                "source_id": "abc123",
            },
            "hourly_booking_duration": datetime.timedelta(hours=3),
        }
        vc.max_child_seat_count = 3
        vc.save()
        self.vehicle_class = vc
        self.valid_step2_hourly = {**self.valid_step1_hourly, "vehicle_class_id": vc.pk}

    def test_serializer_address_validation(self):
        serializer = CreateUpdateBookingSerializer(
            current_step_number=1,
            data={
                "booking_type": BookingType.ONE_WAY,
                "from_address": {},
                "destination_address": {},
            },
        )

        self.assertFalse(serializer.is_valid())
        for f in ["from_address", "destination_address"]:
            with self.subTest(f"Validate {f}"):
                self.assertEqual(
                    set(serializer.errors["from_address"].keys()),
                    {"formatted_address", "postal_code", "lat", "long", "source_id"},
                )

        data = self.valid_step1_one_way.copy()
        data["from_address"]["source_id"] = data["destination_address"]["source_id"] = (
            "abc1"
        )
        serializer = CreateUpdateBookingSerializer(current_step_number=1, data=data)
        self.assertFalse(serializer.is_valid())
        self.assertRegex(
            serializer.errors.get("destination_address")[0],
            "Pickup and drop off address cannot be the same",
        )

    def test_serializer_address_construction(self):
        instance, _ = CreateUpdateBookingSerializer().get_instance(
            {
                "booking_type": BookingType.ONE_WAY,
                "from_address": {
                    "postal_code": "3131",
                    "formatted_address": "224 whitehorse road",
                    "lat": 0,
                    "long": 0,
                    "source_id": "abc123",
                },
                "destination_address": {
                    "postal_code": "3000",
                    "formatted_address": "somewhere else",
                    "lat": 0,
                    "long": 0,
                    "source_id": "abc456",
                },
            }
        )

        self.assertIsInstance(instance.from_address, BookingAddress)
        self.assertIsInstance(instance.destination_address, BookingAddress)
        self.assertEqual(instance.from_address.postal_code, "3131")
        self.assertEqual(instance.from_address.source_id, "abc123")
        self.assertEqual(instance.destination_address.postal_code, "3000")
        self.assertEqual(instance.destination_address.source_id, "abc456")

    def test_passenger_count(self):
        serializer = CreateUpdateBookingSerializer(
            current_step_number=1,
            data={**self.valid_step1_one_way, "passenger_count": 100},
        )
        self.assertFalse(serializer.is_valid())
        self.assertRegex(
            serializer.errors.get("passenger_count")[0],
            "Passenger count can be at most",
        )

    def test_step1_serializer_one_way_validation(self):
        serializer = CreateUpdateBookingSerializer(
            current_step_number=1, data={"booking_type": BookingType.ONE_WAY}
        )
        self.assertFalse(serializer.is_valid())
        self.assertEqual(
            set(serializer.errors.keys()),
            {
                "travel_on_date",
                "passenger_count",
                "baggage_count",
                "from_address",
                "destination_address",
            },
        )

        serializer = CreateUpdateBookingSerializer(
            current_step_number=1, data=self.valid_step1_one_way
        )
        self.assertTrue(serializer.is_valid())

    def test_step1_serializer_hourly_validation(self):
        serializer = CreateUpdateBookingSerializer(
            current_step_number=1, data={"booking_type": BookingType.HOURLY}
        )
        self.assertFalse(serializer.is_valid())
        self.assertEqual(
            set(serializer.errors.keys()),
            {
                "travel_on_date",
                "passenger_count",
                "baggage_count",
                "from_address",
                "hourly_booking_duration",
            },
        )

        serializer = CreateUpdateBookingSerializer(
            current_step_number=1, data=self.valid_step1_hourly
        )
        serializer.is_valid()
        self.assertTrue(serializer.is_valid())

    def test_step2_serializer_one_way_validation(self):
        serializer = CreateUpdateBookingSerializer(
            current_step_number=2, data={"booking_type": BookingType.ONE_WAY}
        )
        self.assertFalse(serializer.is_valid())
        self.assertEqual(
            set(serializer.errors.keys()),
            {
                "travel_on_date",
                "passenger_count",
                "baggage_count",
                "from_address",
                "destination_address",
                "vehicle_class_id",
            },
        )

        serializer = CreateUpdateBookingSerializer(
            current_step_number=2, data=self.valid_step2_one_way
        )
        self.assertTrue(serializer.is_valid())

    def test_step2_serializer_hourly_validation(self):
        serializer = CreateUpdateBookingSerializer(
            current_step_number=2, data={"booking_type": BookingType.HOURLY}
        )
        self.assertFalse(serializer.is_valid())
        self.assertEqual(
            set(serializer.errors.keys()),
            {
                "travel_on_date",
                "passenger_count",
                "baggage_count",
                "from_address",
                "hourly_booking_duration",
                "vehicle_class_id",
            },
        )

        serializer = CreateUpdateBookingSerializer(
            current_step_number=2, data=self.valid_step2_hourly
        )
        serializer.is_valid()
        self.assertTrue(serializer.is_valid())

    def test_step3_one_way_serializer_validation(self):
        serializer = CreateUpdateBookingSerializer(
            current_step_number=3,
            data={
                **self.valid_step2_one_way,
                "booster_seat_count": self.vehicle_class.max_child_seat_count,
            },
        )
        self.assertTrue(serializer.is_valid())

        serializer = CreateUpdateBookingSerializer(
            current_step_number=3,
            data={
                **self.valid_step2_one_way,
                "booster_seat_count": self.vehicle_class.max_child_seat_count + 1,
            },
        )
        self.assertFalse(serializer.is_valid())
        self.assertEqual(set(serializer.errors.keys()), {"booster_seat_count"})

        # Total is spread out across all child seat types
        serializer = CreateUpdateBookingSerializer(
            current_step_number=3,
            data={
                **self.valid_step2_one_way,
                "booster_seat_count": 1,
                "forward_facing_baby_seat_count": 1,
                "rear_facing_baby_seat_count": 1,
            },
        )
        self.assertTrue(serializer.is_valid())

        serializer = CreateUpdateBookingSerializer(
            current_step_number=3,
            data={
                **self.valid_step2_one_way,
                "booster_seat_count": 1,
                "forward_facing_baby_seat_count": 1,
                "rear_facing_baby_seat_count": 2,
            },
        )
        self.assertFalse(serializer.is_valid())
        self.assertEqual(set(serializer.errors.keys()), {"booster_seat_count"})

    def test_step3_hourly_serializer_validation(self):
        serializer = CreateUpdateBookingSerializer(
            current_step_number=3, data={**self.valid_step2_hourly}
        )
        self.assertFalse(serializer.is_valid())
        self.assertEqual(set(serializer.errors.keys()), {"additional_stops"})
        # TODO: Add additional stops to the data for hourly serialization (is this necessary?)
