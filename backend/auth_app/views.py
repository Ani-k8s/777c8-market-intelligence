from django.contrib.auth import authenticate, get_user_model
from django.db import transaction
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAdminUser
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from .serializers import (
    DeleteUserSerializer,
    LoginSerializer,
    ResetPasswordSerializer,
    SetUserExpirySerializer,
    ToggleUserSerializer,
    UserCreateSerializer,
    UserSummarySerializer,
    ensure_access_profile,
)


def token_payload_for(user):
    refresh = RefreshToken.for_user(user)
    return {
        "refresh": str(refresh),
        "access": str(refresh.access_token),
        "user": UserSummarySerializer(user).data,
    }


class LoginView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = authenticate(
            request,
            username=serializer.validated_data["username"],
            password=serializer.validated_data["password"],
        )
        if user is None:
            return Response(
                {"detail": "Invalid credentials or disabled user."},
                status=status.HTTP_401_UNAUTHORIZED,
            )
        profile = ensure_access_profile(user)
        if not user.is_active:
            return Response(
                {"detail": "This user is disabled."},
                status=status.HTTP_403_FORBIDDEN,
            )
        if profile.is_expired:
            return Response(
                {"detail": "This user's access has expired."},
                status=status.HTTP_403_FORBIDDEN,
            )
        return Response(token_payload_for(user))


class UserListView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        User = get_user_model()
        users = User.objects.order_by("-is_staff", "username")
        return Response({"users": UserSummarySerializer(users, many=True).data})


class CreateUserView(APIView):
    permission_classes = [IsAdminUser]

    @transaction.atomic
    def post(self, request):
        serializer = UserCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        profile = ensure_access_profile(user)
        profile.access_expires_at = serializer.validated_data.get("access_expires_at")
        profile.save(update_fields=["access_expires_at", "updated_at"])
        return Response(
            {"user": UserSummarySerializer(user).data},
            status=status.HTTP_201_CREATED,
        )


class ToggleUserView(APIView):
    permission_classes = [IsAdminUser]

    @transaction.atomic
    def post(self, request):
        serializer = ToggleUserSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        User = get_user_model()
        target = User.objects.filter(id=serializer.validated_data["user_id"]).first()
        if target is None:
            return Response({"detail": "User not found."}, status=status.HTTP_404_NOT_FOUND)
        enabled = serializer.validated_data["enabled"]
        if target.id == request.user.id and not enabled:
            return Response(
                {"detail": "Admins cannot disable their own account."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        target.is_active = enabled
        target.save(update_fields=["is_active"])
        return Response({"user": UserSummarySerializer(target).data})


class SetUserExpiryView(APIView):
    permission_classes = [IsAdminUser]

    @transaction.atomic
    def post(self, request):
        serializer = SetUserExpirySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        User = get_user_model()
        target = User.objects.filter(id=serializer.validated_data["user_id"]).first()
        if target is None:
            return Response({"detail": "User not found."}, status=status.HTTP_404_NOT_FOUND)
        profile = ensure_access_profile(target)
        profile.access_expires_at = serializer.validated_data.get("access_expires_at")
        profile.save(update_fields=["access_expires_at", "updated_at"])
        return Response({"user": UserSummarySerializer(target).data})


class ResetPasswordView(APIView):
    permission_classes = [IsAdminUser]

    @transaction.atomic
    def post(self, request):
        serializer = ResetPasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        User = get_user_model()
        target = User.objects.filter(id=serializer.validated_data["user_id"]).first()
        if target is None:
            return Response({"detail": "User not found."}, status=status.HTTP_404_NOT_FOUND)
        target.set_password(serializer.validated_data["password"])
        target.save(update_fields=["password"])
        return Response({"user": UserSummarySerializer(target).data})


class DeleteUserView(APIView):
    permission_classes = [IsAdminUser]

    @transaction.atomic
    def post(self, request):
        serializer = DeleteUserSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        User = get_user_model()
        target = User.objects.filter(id=serializer.validated_data["user_id"]).first()
        if target is None:
            return Response({"detail": "User not found."}, status=status.HTTP_404_NOT_FOUND)
        if target.id == request.user.id:
            return Response(
                {"detail": "Admins cannot delete their own account."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        target.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class AdminStatsView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        User = get_user_model()
        users = User.objects.all()
        serialized = UserSummarySerializer(users, many=True).data
        return Response(
            {
                "total_users": users.count(),
                "active_users": sum(1 for item in serialized if item["is_active"] and not item["is_expired"]),
                "disabled_users": users.filter(is_active=False).count(),
                "expired_users": sum(1 for item in serialized if item["is_expired"]),
                "admin_users": users.filter(is_staff=True).count(),
            }
        )
