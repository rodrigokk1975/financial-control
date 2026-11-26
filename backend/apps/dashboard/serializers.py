from __future__ import annotations

import re

from rest_framework import serializers

ISO_DATE_ONLY_RE = re.compile(r"^\d{4}-\d{2}-\d{2}$")


class DashboardSummaryQuerySerializer(serializers.Serializer):
    month = serializers.IntegerField(min_value=1, max_value=12, required=False)
    year = serializers.IntegerField(min_value=2000, max_value=2100, required=False)
    startDate = serializers.RegexField(
        regex=ISO_DATE_ONLY_RE,
        required=False,
        error_messages={"invalid": "startDate deve estar no formato YYYY-MM-DD."},
    )
    endDate = serializers.RegexField(
        regex=ISO_DATE_ONLY_RE,
        required=False,
        error_messages={"invalid": "endDate deve estar no formato YYYY-MM-DD."},
    )
