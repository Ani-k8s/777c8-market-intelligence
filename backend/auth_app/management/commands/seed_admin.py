import os

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand, CommandError
from django.db import connection

from auth_app.models import UserAccessProfile


class Command(BaseCommand):
    help = "Create or update the default admin user from environment variables."

    def handle(self, *args, **options):
        # Safety check: ensure migrations have run
        User = get_user_model()
        table_name = User._meta.db_table
        if table_name not in connection.introspection.table_names():
            self.stdout.write(
                self.style.WARNING(
                    f"Table {table_name} does not exist. Skipping admin seeding. "
                    "Ensure migrations have run first."
                )
            )
            return

        username = os.getenv("ADMIN_USERNAME", "Admin")
        password = os.getenv("ADMIN_PASSWORD", "Admin@123")
        email = os.getenv("ADMIN_EMAIL", "admin@777c8.local")

        if not username or not password:
            raise CommandError("ADMIN_USERNAME and ADMIN_PASSWORD must be set.")

        user, created = User.objects.get_or_create(
            username=username,
            defaults={
                "email": email,
                "is_staff": True,
                "is_superuser": True,
                "is_active": True,
            },
        )
        changed = created
        if not user.is_staff or not user.is_superuser or not user.is_active:
            user.is_staff = True
            user.is_superuser = True
            user.is_active = True
            changed = True
        if email and user.email != email:
            user.email = email
            changed = True
        user.set_password(password)
        user.save()
        UserAccessProfile.objects.get_or_create(user=user)

        action = "created" if created else "updated"
        if not changed:
            action = "verified"
        self.stdout.write(self.style.SUCCESS(f"Admin user {action}: {username}"))
