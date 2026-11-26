from django.urls import re_path

from apps.categories.views import CategoryDetailView, CategoryListCreateView

urlpatterns = [
    re_path(r"^categories/?$", CategoryListCreateView.as_view(), name="categories-list-create"),
    re_path(
        r"^categories/(?P<category_id>[^/]+)/?$",
        CategoryDetailView.as_view(),
        name="categories-detail",
    ),
]
