from io import StringIO

from django.core.management import call_command
from django.test import Client
from django.test import TestCase

from scbp_core.djrad.sites import admin_site
from scbp_core.djrad.sites import app_site
from scbp_core.tests.factory.user import ClientUserFactory
from scbp_core.tests.factory.user import StaffFactory


class AuthTestCase(TestCase):
    def setUp(self):
        self.admin = StaffFactory.create()
        self.client = ClientUserFactory.create()

    # see https://gitlab.internal.alliancesoftware.com.au/alliance/template-django/issues/44
    def test_createsuperuser(self):
        output_buffer = StringIO()
        call_command(
            "createsuperuser",
            email="superuser@example.com",
            interactive=False,
            stdout=output_buffer,
        )
        output_buffer.seek(0)
        self.assertIn("Superuser created successfully.", output_buffer.read())

    def test_login_app_api(self):
        client = Client()
        response = client.post(
            # Can't reverse these as same name is used for each site ('rad_login')
            "/rad-api/login/",
            data={"username": self.client.email, "password": self.client._password},
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["user"]["email"], self.client.email)

        response = client.post(
            "/rad-api/login/",
            data={"username": self.admin.email, "password": self.admin._password},
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.json().get("redirectTo"),
            app_site.get_unsupported_user_type_redirect(self.admin),
            "Should return redirect URL as incorrect user type",
        )

    def test_login_admin_api(self):
        client = Client()
        response = client.post(
            # Can't reverse these as same name is used for each site ('rad_login')
            "/admin-api/login/",
            data={"username": self.admin.email, "password": self.admin._password},
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["user"]["email"], self.admin.email)

        response = client.post(
            "/admin-api/login/",
            data={"username": self.client.email, "password": self.client._password},
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.json().get("redirectTo"),
            admin_site.get_unsupported_user_type_redirect(self.client),
            "Should return redirect URL as incorrect user type",
        )
