from django.contrib.auth import get_user_model, password_validation
from django.utils import timezone
from rest_framework import serializers

from .models import UserAccessProfile


class UserSummarySerializer(serializers.ModelSerializer):
    is_admin = serializers.SerializerMethodField()
    access_expires_at = serializers.SerializerMethodField()
    is_expired = serializers.SerializerMethodField()

    class Meta:
        model = "auth.User"
        fields = (
            "id",
            "username",
            "email",
            "is_active",
            "is_admin",
            "date_joined",
            "access_expires_at",
            "is_expired",
        )

    def get_is_admin(self, obj):
        return bool(obj.is_staff or obj.is_superuser)

    def get_access_expires_at(self, obj):
        profile = ensure_access_profile(obj)
        return profile.access_expires_at.isoformat() if profile.access_expires_at else None

    def get_is_expired(self, obj):
        return ensure_access_profile(obj).is_expired


class LoginSerializer(serializers.Serializer):
    username = serializers.CharField(trim_whitespace=True)
    password = serializers.CharField(write_only=True, trim_whitespace=False)


class UserCreateSerializer(serializers.Serializer):
    username = serializers.CharField(max_length=150, trim_whitespace=True)
    email = serializers.EmailField(required=False, allow_blank=True)
    password = serializers.CharField(write_only=True, min_length=8, trim_whitespace=False)
    access_expires_at = serializers.DateTimeField(required=False, allow_null=True)

    def validate_username(self, value):
        User = get_user_model()
        if User.objects.filter(username__iexact=value).exists():
            raise serializers.ValidationError("A user with this username already exists.")
        return value

    def validate_password(self, value):
        password_validation.validate_password(value)
        return value

    def create(self, validated_data):
        User = get_user_model()
        email = validated_data.get("email", "")
        return User.objects.create_user(
            username=validated_data["username"],
            email=email,
            password=validated_data["password"],
            is_active=True,
        )


class ToggleUserSerializer(serializers.Serializer):
    user_id = serializers.IntegerField(min_value=1)
    enabled = serializers.BooleanField()


class DeleteUserSerializer(serializers.Serializer):
    user_id = serializers.IntegerField(min_value=1)


class SetUserExpirySerializer(serializers.Serializer):
    user_id = serializers.IntegerField(min_value=1)
    access_expires_at = serializers.DateTimeField(required=False, allow_null=True)

    def validate_access_expires_at(self, value):
        if value and value <= timezone.now():
            raise serializers.ValidationError("Expiry date must be in the future.")
        return value


class ResetPasswordSerializer(serializers.Serializer):
    user_id = serializers.IntegerField(min_value=1)
    password = serializers.CharField(write_only=True, min_length=8, trim_whitespace=False)

    def validate_password(self, value):
        password_validation.validate_password(value)
        return value


def ensure_access_profile(user):
    return UserAccessProfile.get_for_user(user)
