from django.urls import re_path

from apps.users.views import LoginView, MeView, RegisterView

urlpatterns = [
    re_path(r"^register/?$", RegisterView.as_view(), name="auth-register"),
    re_path(r"^login/?$", LoginView.as_view(), name="auth-login"),
    re_path(r"^me/?$", MeView.as_view(), name="auth-me"),
]
