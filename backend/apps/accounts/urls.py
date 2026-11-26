from django.urls import re_path

from apps.accounts.views import AccountDetailView, AccountListCreateView

urlpatterns = [
    re_path(r"^accounts/?$", AccountListCreateView.as_view(), name="accounts-list-create"),
    re_path(
        r"^accounts/(?P<account_id>[^/]+)/?$",
        AccountDetailView.as_view(),
        name="accounts-detail",
    ),
]
