from django.conf import settings
from django.test import TestCase
from django.urls import reverse

from scbp_core.models import ClientUser
from scbp_core.models import StaffUser
from scbp_core.models import User
from scbp_core.tests.factory.user import ClientUserFactory
from scbp_core.tests.factory.user import StaffFactory
from scbp_core.tests.factory.user import UserFactory
from scbp_core.tests.util import suppress_request_warnings


class HijackTest(TestCase):
    def _request_hijack(self, user):
        return self.client.post(
            reverse("hijack:acquire"),
            data={"user_pk": user.pk},
            content_type="application/json",
        )

    def test_can_hijack(self):
        superuser = UserFactory(is_superuser=True)
        staff: StaffUser = StaffFactory()
        client: ClientUser = ClientUserFactory()

        for hijacker, hijacked in (
            (superuser, client),
            (superuser, staff),
            (staff, client),
        ):
            with self.subTest(hijacker=hijacker, hijacked=hijacked):
                self.client.force_login(hijacker)

                response = self._request_hijack(hijacked)

                self.assertEqual(response.status_code, 302)
                self.assertEqual(response.url, settings.HIJACK_LOGIN_REDIRECT_URL)

    @suppress_request_warnings
    def test_staff_cannot_hijack_other_staff(self):
        staff = StaffFactory()
        self.client.force_login(staff)
        staff2: StaffUser = StaffFactory()

        response = self._request_hijack(staff2)

        self.assertEqual(response.status_code, 403)

    @suppress_request_warnings
    def test_client_cannot_impersonate_anyone(self):
        client = ClientUserFactory()
        client2: ClientUser = ClientUserFactory()
        superuser: User = UserFactory(is_superuser=True)
        staff: StaffUser = StaffFactory()
        for u in [client2, superuser, staff]:
            self.client.force_login(client)
            with self.subTest(f"Client cannot impersonate {u.__class__.__name__}"):
                response = self._request_hijack(u)

                self.assertEqual(response.status_code, 403)
