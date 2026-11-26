from __future__ import annotations

from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.dashboard.serializers import DashboardSummaryQuerySerializer
from apps.dashboard.services import get_dashboard_summary


class DashboardSummaryView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request: Request) -> Response:
        query_serializer = DashboardSummaryQuerySerializer(data=request.query_params)
        query_serializer.is_valid(raise_exception=True)
        summary = get_dashboard_summary(request.user, query_serializer.validated_data)
        return Response(summary, status=status.HTTP_200_OK)
