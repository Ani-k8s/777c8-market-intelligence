from django.conf import settings
from django.db import models
from django.utils import timezone


class UserAccessProfile(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="access_profile",
    )
    access_expires_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "User access profile"
        verbose_name_plural = "User access profiles"

    def __str__(self):
        return f"{self.user.username} access"

    @property
    def is_expired(self) -> bool:
        return bool(self.access_expires_at and timezone.now() >= self.access_expires_at)

    @property
    def has_access(self) -> bool:
        return self.user.is_active and not self.is_expired
