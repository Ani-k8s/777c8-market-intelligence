from decimal import Decimal

from rest_framework import serializers


INDEX_CHOICES = ("NIFTY", "BANKNIFTY")
RISK_CHOICES = ("Low", "Medium", "High")
IMAGE_FORMAT_CHOICES = ("square", "story")


class MarketInputSerializer(serializers.Serializer):
    index = serializers.ChoiceField(choices=INDEX_CHOICES)
    budget = serializers.DecimalField(
        max_digits=12,
        decimal_places=2,
        min_value=Decimal("500.00"),
    )
    risk = serializers.ChoiceField(choices=RISK_CHOICES)
    current_price = serializers.DecimalField(
        max_digits=12,
        decimal_places=2,
        min_value=Decimal("1.00"),
        required=False,
    )


class GenerateImageSerializer(MarketInputSerializer):
    image_format = serializers.ChoiceField(
        choices=IMAGE_FORMAT_CHOICES,
        required=False,
        default="square",
    )
