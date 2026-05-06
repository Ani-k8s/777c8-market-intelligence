from rest_framework.response import Response
from rest_framework.views import APIView

from .data import get_live_market_data
from .serializers import GenerateImageSerializer, MarketInputSerializer
from .services import analyze_market, generate_copy, generate_image_payload, suggest_strikes


class LiveDataView(APIView):
    def get(self, request):
        force = request.query_params.get("force") == "1"
        return Response(get_live_market_data(force_refresh=force))


class AnalyzeView(APIView):
    def post(self, request):
        serializer = MarketInputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        return Response(analyze_market(**serializer.validated_data))


class StrikeSuggestionsView(APIView):
    def post(self, request):
        serializer = MarketInputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        return Response(suggest_strikes(**serializer.validated_data))


class GenerateCopyView(APIView):
    def post(self, request):
        serializer = MarketInputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        return Response(generate_copy(**serializer.validated_data))


class GenerateImageView(APIView):
    def post(self, request):
        serializer = GenerateImageSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        return Response(generate_image_payload(**serializer.validated_data))
