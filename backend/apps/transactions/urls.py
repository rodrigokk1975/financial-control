from django.urls import re_path

from apps.transactions.views import TransactionDetailView, TransactionListCreateView

urlpatterns = [
    re_path(
        r"^transactions/?$",
        TransactionListCreateView.as_view(),
        name="transactions-list-create",
    ),
    re_path(
        r"^transactions/(?P<transaction_id>[^/]+)/?$",
        TransactionDetailView.as_view(),
        name="transactions-detail",
    ),
]
