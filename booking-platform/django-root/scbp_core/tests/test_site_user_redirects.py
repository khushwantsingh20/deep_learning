from django.test import TestCase

from scbp_core.tests.factory.user import ClientUserFactory
from scbp_core.tests.factory.user import StaffFactory
from scbp_core.tests.factory.user import UserFactory


class TestSiteUserRedirects(TestCase):
    def setUp(self):
        # Every test needs access to the request factory.
        self.super_user = UserFactory(is_superuser=True)
        self.client_user = ClientUserFactory()
        self.staff_user = StaffFactory()

    def test_super_user_redirect_to_admin(self):
        self.client.force_login(self.super_user)
        response = self.client.get("/")
        self.assertEqual(response.status_code, 302)
        self.assertEqual(response.url, "/admin/redirect-from-app/")

        response = self.client.get("/admin/")
        self.assertEqual(response.status_code, 200)

    def test_staff_redirect_to_admin(self):
        self.client.force_login(self.staff_user)
        response = self.client.get("/")
        self.assertEqual(response.status_code, 302)
        self.assertEqual(response.url, "/admin/redirect-from-app/")

        response = self.client.get("/admin/")
        self.assertEqual(response.status_code, 200)

    def test_client_redirect_to_app(self):
        self.client.force_login(self.client_user)
        response = self.client.get("/admin/")
        self.assertEqual(response.status_code, 302)
        self.assertEqual(response.url, "/logout/?next=/admin/")

        self.client.force_login(self.client_user)
        response = self.client.get("/")
        self.assertEqual(response.status_code, 200)

    def test_no_login_access_app(self):
        response = self.client.get("/")
        self.assertEqual(response.status_code, 200)
