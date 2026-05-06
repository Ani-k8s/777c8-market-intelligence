from django.contrib import admin
from django.http import JsonResponse
from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from auth_app.views import (
    AdminStatsView,
    CreateUserView,
    DeleteUserView,
    LoginView,
    ResetPasswordView,
    SetUserExpiryView,
    ToggleUserView,
    UserListView,
)
from market_app.views import (
    AnalyzeView,
    GenerateCopyView,
    GenerateImageView,
    LiveDataView,
    StrikeSuggestionsView,
)


def health(_request):
    return JsonResponse({"status": "ok", "service": "777c8 Market Intelligence"})


urlpatterns = [
    path("health", health, name="health"),
    path("admin/", admin.site.urls),
    path("api/auth/login", LoginView.as_view(), name="api-auth-login"),
    path("api/auth/create-user", CreateUserView.as_view(), name="api-auth-create-user"),
    path("api/auth/toggle-user", ToggleUserView.as_view(), name="api-auth-toggle-user"),
    path("api/auth/delete-user", DeleteUserView.as_view(), name="api-auth-delete-user"),
    path("api/auth/set-expiry", SetUserExpiryView.as_view(), name="api-auth-set-expiry"),
    path("api/auth/reset-password", ResetPasswordView.as_view(), name="api-auth-reset-password"),
    path("api/auth/users", UserListView.as_view(), name="api-auth-users"),
    path("api/auth/stats", AdminStatsView.as_view(), name="api-auth-stats"),
    path("api/market/live-data", LiveDataView.as_view(), name="api-market-live-data"),
    path("api/market/analyze", AnalyzeView.as_view(), name="api-market-analyze"),
    path("api/market/strike-suggestions", StrikeSuggestionsView.as_view(), name="api-market-strikes"),
    path("api/market/generate-copy", GenerateCopyView.as_view(), name="api-market-copy"),
    path("api/market/generate-image", GenerateImageView.as_view(), name="api-market-image"),
    path("api/login", LoginView.as_view(), name="api-login"),
    path("api/token/refresh", TokenRefreshView.as_view(), name="token-refresh"),
    path("api/create-user", CreateUserView.as_view(), name="api-create-user"),
    path("api/toggle-user", ToggleUserView.as_view(), name="api-toggle-user"),
    path("api/delete-user", DeleteUserView.as_view(), name="api-delete-user"),
    path("api/users", UserListView.as_view(), name="api-users"),
    path("api/analyze", AnalyzeView.as_view(), name="api-analyze"),
    path("api/suggest-strikes", StrikeSuggestionsView.as_view(), name="api-suggest-strikes"),
    path("api/generate-copy", GenerateCopyView.as_view(), name="api-generate-copy"),
]
