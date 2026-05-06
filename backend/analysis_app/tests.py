from django.contrib.auth import get_user_model
from django.test import override_settings
from rest_framework.test import APITestCase
from unittest.mock import patch


def sample_live_data():
    candles = [
        {"time": "09:15", "open": 22500, "high": 22540, "low": 22480, "close": 22510, "volume": 1},
        {"time": "09:20", "open": 22510, "high": 22570, "low": 22500, "close": 22550, "volume": 1},
    ]
    chain = {
        "symbol": "NIFTY",
        "source": "test chain",
        "is_live": True,
        "underlying": 22550,
        "atm_strike": 22550,
        "expiry": "",
        "volatility": 12,
        "nearby": [
            {"strike": 22500, "ce": {"ltp": 95}, "pe": {"ltp": 45}},
            {"strike": 22550, "ce": {"ltp": 65}, "pe": {"ltp": 62}},
            {"strike": 22600, "ce": {"ltp": 38}, "pe": {"ltp": 92}},
        ],
    }
    return {
        "indices": {
            "NIFTY": {"symbol": "NIFTY", "price": 22550, "change": 50, "change_percent": 0.22, "source": "test", "is_live": True},
            "BANKNIFTY": {"symbol": "BANKNIFTY", "price": 48000, "change": 80, "change_percent": 0.18, "source": "test", "is_live": True},
        },
        "option_chains": {"NIFTY": chain, "BANKNIFTY": {**chain, "symbol": "BANKNIFTY", "underlying": 48000, "atm_strike": 48000}},
        "candles": {"NIFTY": candles, "BANKNIFTY": candles},
        "source": "test",
        "is_live": True,
        "market_status": {"status": "Live", "time": "10:00 AM", "date": "2026-05-06", "timezone": "Asia/Kolkata", "high_decay": False},
        "sentiment": {"label": "Balanced"},
        "volatility": {"value": 12, "label": "Moderate"},
        "expiry_warning": "Normal premium decay",
        "errors": [],
        "cache": {"hit": False},
    }


@override_settings(
    PASSWORD_HASHERS=["django.contrib.auth.hashers.MD5PasswordHasher"],
)
class AnalysisApiTests(APITestCase):
    def setUp(self):
        User = get_user_model()
        self.user = User.objects.create_user(
            username="analyst",
            password="Analyst@123",
            is_active=True,
        )
        response = self.client.post(
            "/api/login",
            {"username": "analyst", "password": "Analyst@123"},
            format="json",
        )
        self.token = response.data["access"]

    def auth(self):
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.token}")

    def test_analyze_requires_authentication(self):
        response = self.client.post(
            "/api/analyze",
            {
                "index": "NIFTY",
                "budget": 5000,
                "risk": "Medium",
                "current_price": 22500,
            },
            format="json",
        )

        self.assertEqual(response.status_code, 401)

    @patch("market_app.services.get_live_market_data", side_effect=sample_live_data)
    def test_analysis_returns_decision_and_warning(self, _mock_live):
        self.auth()
        response = self.client.post(
            "/api/analyze",
            {
                "index": "NIFTY",
                "budget": 5000,
                "risk": "Medium",
                "current_price": 22500,
            },
            format="json",
        )

        self.assertEqual(response.status_code, 200)
        self.assertIn(response.data["decision"], {"AVOID", "WAIT", "TRADE SETUP"})
        self.assertTrue(response.data["risk_warnings"])

    @patch("market_app.services.get_live_market_data", side_effect=sample_live_data)
    def test_strike_suggestions_return_two_or_more_items(self, _mock_live):
        self.auth()
        response = self.client.post(
            "/api/suggest-strikes",
            {
                "index": "BANKNIFTY",
                "budget": 7000,
                "risk": "Low",
                "current_price": 48000,
            },
            format="json",
        )

        self.assertEqual(response.status_code, 200)
        self.assertGreaterEqual(len(response.data["suggestions"]), 2)

    @patch("market_app.services.get_live_market_data", side_effect=sample_live_data)
    def test_copy_generator_includes_brand_and_warning(self, _mock_live):
        self.auth()
        response = self.client.post(
            "/api/generate-copy",
            {
                "index": "NIFTY",
                "budget": 5000,
                "risk": "Medium",
                "current_price": 22500,
            },
            format="json",
        )

        self.assertEqual(response.status_code, 200)
        self.assertIn("777c8 MARKET ANALYSIS", response.data["message"])
        self.assertIn("Risk Warning", response.data["message"])
