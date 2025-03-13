from unittest.mock import patch

from django.urls import reverse
from django.utils import timezone
from rest_framework.test import APITestCase

from scbp_core.models import User
from scbp_core.tests.factory.user import ClientUserFactory
from scbp_core.tests.util import suppress_request_warnings


def create_user_form_data(email=None, captcha=None):
    return {
        "firstName": "Test First Name",
        "lastName": "Test Last Name",
        "email": email or "test@test.com",
        "middleName": str(captcha or 0),
        "password": "someEit93412",
        "confirmPassword": "someEit93412",
        "contactPhone": "1300 660 417",
    }


class UserSignupTestCase(APITestCase):
    def setUp(self):
        self.signup_url = reverse("app.scbp_core.clientuser-signup")

    def _create_user_form_data(self, **kwargs):
        response = self.client.get("/")
        self.assertEqual(response.status_code, 200)
        captcha = response.wsgi_request.session["makeshift captcha"]
        return create_user_form_data(captcha=captcha, **kwargs)

    @patch("scbp_core.djrad.app.user.create_or_update_subscription")
    def test_new_user_can_signup(self, cm_mock):
        user_data = self._create_user_form_data()
        response = self.client.post(self.signup_url, user_data, format="json")
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.wsgi_request.user.is_authenticated, True)
        self.assertEqual(response.wsgi_request.user.email, user_data["email"])
        self.assertTrue(cm_mock.delay.called_once_with(response.wsgi_request.user.pk))

    @suppress_request_warnings
    def test_new_user_data_validated_correctly(self):
        user_data = self._create_user_form_data()
        user_data["email"] = "invalid"
        response = self.client.post(self.signup_url, user_data, format="json")
        self.assertEqual(response.status_code, 400)
        self.assertIn("email", response.json())

        user_data = self._create_user_form_data()
        user_data["confirmPassword"] = "does not match"
        response = self.client.post(self.signup_url, user_data, format="json")
        self.assertEqual(response.status_code, 400)
        self.assertEqual(
            response.json()["nonFieldErrors"], ["Those passwords don't match."]
        )

    @suppress_request_warnings
    @patch("scbp_core.djrad.app.user.create_or_update_subscription")
    def test_existing_inactive_user_can_sign_up_if_not_previously_activated(
        self, cm_mock
    ):
        client = ClientUserFactory(is_active=False, activated_at=None)
        user_data = self._create_user_form_data(email=client.email)
        response = self.client.post(self.signup_url, user_data, format="json")
        self.assertEqual(response.status_code, 200)
        self.assertTrue(cm_mock.delay.called_once_with(response.wsgi_request.user.pk))

        # User is not active, but has previously been activated - don't allow signup
        client = ClientUserFactory(is_active=True, activated_at=timezone.localtime())
        user_data = create_user_form_data(email=client.email)
        response = self.client.post(self.signup_url, user_data, format="json")
        self.assertEqual(response.status_code, 400)


class UserActivationTestCase(APITestCase):
    def setUp(self):
        self.activation_url = reverse("app.scbp_core.clientuser-activate")

    def test_new_user_can_activate(self):
        client = ClientUserFactory()
        token = client.generate_activation_token()
        response = self.client.post(
            self.activation_url, {"token": token}, format="json"
        )
        self.assertEqual(response.status_code, 200)
        user = User.objects.get(id=client.id)
        self.assertEqual(user.is_active, True)
        self.assertTrue(user.activated_at is not None)

    @suppress_request_warnings
    def test_non_existent_user_cant_activate(self):
        client = ClientUserFactory()
        token = client.generate_activation_token()
        client.delete(hard_delete=True)
        response = self.client.post(
            self.activation_url, {"token": token}, format="json"
        )
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.json()["error"], "bad token")

    @suppress_request_warnings
    def test_activated_user_cant_activate(self):
        client = ClientUserFactory(activated_at=timezone.localtime())
        token = client.generate_activation_token()
        response = self.client.post(
            self.activation_url, {"token": token}, format="json"
        )
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.json()["error"], "account active")

    @suppress_request_warnings
    def test_bad_token_cant_activate(self):
        client = ClientUserFactory()
        token = client.generate_activation_token()
        client.delete()
        response = self.client.post(
            self.activation_url, {"token": token + "x"}, format="json"
        )
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.json()["error"], "bad token")

    @suppress_request_warnings
    def test_expired_token_cant_activate(self):
        with self.settings(USER_ACTIVATION_TOKEN_MAX_AGE_DAYS=0):
            client = ClientUserFactory()
            token = client.generate_activation_token()
            response = self.client.post(
                self.activation_url, {"token": token}, format="json"
            )
            self.assertEqual(response.status_code, 400)
            self.assertEqual(response.json()["error"], "signature expired")
