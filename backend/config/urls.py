from datetime import datetime, timezone

from django.urls import re_path
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response


@api_view(["GET"])
@permission_classes([AllowAny])
def health_view(_request):
    return Response(
        {
            "status": "ok",
            "service": "financial-control-api",
            "timestamp": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
        },
        status=200,
    )


urlpatterns = [
    re_path(r"^api/health/?$", health_view, name="health"),
]
