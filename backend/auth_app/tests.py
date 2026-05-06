from datetime import timedelta

from django.contrib.auth import get_user_model
from django.test import override_settings
from django.utils import timezone
from rest_framework.test import APITestCase


@override_settings(
    PASSWORD_HASHERS=["django.contrib.auth.hashers.MD5PasswordHasher"],
)
class AuthApiTests(APITestCase):
    def setUp(self):
        User = get_user_model()
        self.admin = User.objects.create_superuser(
            username="Admin",
            password="Admin@123",
            email="admin@777c8.local",
        )
        self.disabled = User.objects.create_user(
            username="disabled",
            password="Disabled@123",
            is_active=False,
        )

    def login_admin(self):
        response = self.client.post(
            "/api/login",
            {"username": "Admin", "password": "Admin@123"},
            format="json",
        )
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {response.data['access']}")

    def test_admin_can_login(self):
        response = self.client.post(
            "/api/login",
            {"username": "Admin", "password": "Admin@123"},
            format="json",
        )

        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.data["user"]["is_admin"])

    def test_disabled_user_cannot_login(self):
        response = self.client.post(
            "/api/login",
            {"username": "disabled", "password": "Disabled@123"},
            format="json",
        )

        self.assertEqual(response.status_code, 401)

    def test_admin_can_create_toggle_and_delete_user(self):
        self.login_admin()

        create_response = self.client.post(
            "/api/create-user",
            {
                "username": "trader",
                "email": "trader@example.com",
                "password": "Trader@12345",
            },
            format="json",
        )
        self.assertEqual(create_response.status_code, 201)
        user_id = create_response.data["user"]["id"]

        toggle_response = self.client.post(
            "/api/toggle-user",
            {"user_id": user_id, "enabled": False},
            format="json",
        )
        self.assertEqual(toggle_response.status_code, 200)
        self.assertFalse(toggle_response.data["user"]["is_active"])

        delete_response = self.client.post(
            "/api/delete-user",
            {"user_id": user_id},
            format="json",
        )
        self.assertEqual(delete_response.status_code, 204)

    def test_admin_can_set_expiry_and_reset_password(self):
        self.login_admin()
        User = get_user_model()
        trader = User.objects.create_user(
            username="expiry-user",
            password="OldPass@123",
            is_active=True,
        )

        expiry_response = self.client.post(
            "/api/auth/set-expiry",
            {
                "user_id": trader.id,
                "access_expires_at": (timezone.now() + timedelta(days=7)).isoformat(),
            },
            format="json",
        )
        self.assertEqual(expiry_response.status_code, 200)
        self.assertIsNotNone(expiry_response.data["user"]["access_expires_at"])

        reset_response = self.client.post(
            "/api/auth/reset-password",
            {"user_id": trader.id, "password": "NewPass@12345"},
            format="json",
        )
        self.assertEqual(reset_response.status_code, 200)
