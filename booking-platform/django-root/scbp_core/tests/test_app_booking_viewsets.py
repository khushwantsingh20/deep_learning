import datetime
from decimal import Decimal
from unittest.mock import patch

from freezegun import freeze_time
from rest_framework.test import APITestCase

from scbp_core.djrad.app import create_update_booking_registration
from scbp_core.djrad.app.vehicle import vehicle_class_registration
from scbp_core.djrad.sites import app_site
from scbp_core.models import Booking
from scbp_core.models import BookingAddressType
from scbp_core.models import BookingType
from scbp_core.models import PriceList
from scbp_core.services.pricing import PriceCalculator
from scbp_core.tests.util import suppress_request_warnings


class SimpleBookingViewSetTestCase(APITestCase):
    fixtures = ["vehicle_class.json"]

    def test_vehicle_class_list_responds(self):
        """Make sure vehicle class list always responds with 200"""
        url = app_site.reverse_registration_url(vehicle_class_registration, "list")
        response = self.client.get(url, format="json")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.json()), 7)

    @suppress_request_warnings
    def test_vehicle_class_list_read_only(self):
        """Standard create/update endpoints must not be available"""
        list_url = app_site.reverse_registration_url(vehicle_class_registration, "list")
        response = self.client.post(list_url, {}, format="json")
        self.assertEqual(response.status_code, 405)
        detail_url = app_site.reverse_registration_url(
            vehicle_class_registration, "detail", kwargs={"pk": 1}
        )
        response = self.client.patch(detail_url, {}, format="json")
        self.assertEqual(response.status_code, 405)
        response = self.client.post(detail_url, {}, format="json")
        self.assertEqual(response.status_code, 405)


class BookingViewSetPriceCalculationTestCase(APITestCase):
    fixtures = ["vehicle_class.json", "hour_rate_type.json", "booking_lead_time.json"]

    def test_price_options(self):
        price_options_url = app_site.reverse_registration_url(
            create_update_booking_registration, "price_options"
        )
        response = self.client.post(price_options_url, format="json")
        price_list = PriceList.get_current()
        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.json()["priceOptions"],
            {
                "weddingRibbonFee": str(price_list.wedding_ribbon_fee),
                "childSeatFee": str(price_list.child_seat_fee),
                "additionalStopFee": str(price_list.additional_stop_fee),
                "colorSelectionFee": str(price_list.color_selection_fee),
            },
        )

    @freeze_time("2019-07-11")
    @patch.object(PriceCalculator, "_is_booking_out_of_area")
    @patch.object(Booking, "get_distance")
    def test_vehicle_class_prices_simple(
        self, mock_get_distance, mock_is_booking_out_of_area
    ):
        mock_get_distance.return_value = Decimal("1")
        mock_is_booking_out_of_area.return_value = False
        vehicle_prices_url = app_site.reverse_registration_url(
            create_update_booking_registration, "validate_step"
        )
        response = self.client.post(
            vehicle_prices_url,
            {
                "stepIndex": 0,
                "bookingType": BookingType.ONE_WAY,
                "travelOnDate": datetime.date(2019, 7, 12),
                "travelOnTime": datetime.time(hour=17, minute=0),
                "passengerCount": 2,
                "baggageCount": 1,
                "fromAddressType": BookingAddressType.CUSTOM,
                "fromAddress": {
                    "postalCode": "3131",
                    "formattedAddress": "224 whitehorse road",
                    "lat": 0,
                    "long": 0,
                    "sourceId": "abc123",
                },
                "destinationAddressType": BookingAddressType.CUSTOM,
                "destinationAddress": {
                    "postalCode": "3000",
                    "formattedAddress": "somewhere else",
                    "lat": 0,
                    "long": 0,
                    "sourceId": "abc456",
                },
            },
            format="json",
        )
        self.assertEqual(response.status_code, 200)
        price_by_vehicle_id = {
            d["vehicleClassId"]: d["price"]
            for d in response.json()["vehicleClassPrices"]
        }
        self.assertEqual(
            price_by_vehicle_id,
            {1: "56.10", 2: "56.10", 3: "78.10", 4: "78.10", 5: "100.10", 6: "67.10"},
        )
