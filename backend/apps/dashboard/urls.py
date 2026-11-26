from django.urls import re_path

from apps.dashboard.views import DashboardSummaryView

urlpatterns = [
    re_path(r"^summary/?$", DashboardSummaryView.as_view(), name="dashboard-summary"),
]
