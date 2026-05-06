from django.contrib.auth import authenticate, get_user_model
from django.db import transaction
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAdminUser
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

# Serializer imports moved inside view methods to prevent startup DB queries


def token_payload_for(user):
    from .serializers import UserSummarySerializer
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
        from .serializers import LoginSerializer, ensure_access_profile
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = authenticate(
            request,
            username=serializer.validated_data["username"],
            password=serializer.validated_data["password"],
        )
        if not user:
            return Response(
                {"error": "Invalid credentials"}, status=status.HTTP_401_UNAUTHORIZED
            )
        if not user.is_active:
            return Response(
                {"error": "User account is disabled"}, status=status.HTTP_403_FORBIDDEN
            )
        profile = ensure_access_profile(user)
        if profile.is_expired:
            return Response(
                {"detail": "This user's access has expired."},
                status=status.HTTP_403_FORBIDDEN,
            )
        return Response(token_payload_for(user))


class UserListView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        from .serializers import UserSummarySerializer
        User = get_user_model()
        users = User.objects.order_by("-is_staff", "username")
        return Response({"users": UserSummarySerializer(users, many=True).data})


class CreateUserView(APIView):
    permission_classes = [IsAdminUser]

    @transaction.atomic
    def post(self, request):
        from .serializers import UserCreateSerializer, UserSummarySerializer, ensure_access_profile
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
        from .serializers import ToggleUserSerializer, UserSummarySerializer, ensure_access_profile
        serializer = ToggleUserSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        User = get_user_model()
        target = User.objects.filter(id=serializer.validated_data["user_id"]).first()
        if not target:
            return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)
        
        enabled = serializer.validated_data["enabled"]
        if target.id == request.user.id and not enabled:
            return Response(
                {"error": "Admins cannot disable their own account"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
            
        target.is_active = enabled
        target.save()
        ensure_access_profile(target)
        return Response({"user": UserSummarySerializer(target).data})


class SetUserExpiryView(APIView):
    permission_classes = [IsAdminUser]

    @transaction.atomic
    def post(self, request):
        from .serializers import SetUserExpirySerializer, UserSummarySerializer, ensure_access_profile
        serializer = SetUserExpirySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        User = get_user_model()
        target = User.objects.filter(id=serializer.validated_data["user_id"]).first()
        if not target:
            return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)
        profile = ensure_access_profile(target)
        profile.access_expires_at = serializer.validated_data["access_expires_at"]
        profile.save()
        return Response({"user": UserSummarySerializer(target).data})


class ResetPasswordView(APIView):
    permission_classes = [IsAdminUser]

    @transaction.atomic
    def post(self, request):
        from .serializers import ResetPasswordSerializer, UserSummarySerializer
        serializer = ResetPasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        User = get_user_model()
        target = User.objects.filter(id=serializer.validated_data["user_id"]).first()
        if not target:
            return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)
        target.set_password(serializer.validated_data["password"])
        target.save()
        return Response({"user": UserSummarySerializer(target).data})


class DeleteUserView(APIView):
    permission_classes = [IsAdminUser]

    @transaction.atomic
    def post(self, request):
        from .serializers import DeleteUserSerializer
        serializer = DeleteUserSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        User = get_user_model()
        target = User.objects.filter(id=serializer.validated_data["user_id"]).first()
        if not target:
            return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)
        if target.id == request.user.id:
            return Response(
                {"error": "Admins cannot delete their own account"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        target.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class AdminStatsView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        from .serializers import UserSummarySerializer
        User = get_user_model()
        users = User.objects.all()
        serialized = UserSummarySerializer(users, many=True).data
        total = users.count()
        active = users.filter(is_active=True).count()
        admin = users.filter(is_staff=True).count()
        return Response(
            {"total": total, "active": active, "admin": admin, "users": serialized}
        )
