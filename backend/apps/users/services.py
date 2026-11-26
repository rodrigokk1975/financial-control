from __future__ import annotations

from django.db import transaction
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken

from apps.categories.models import Category, TransactionType
from apps.users.models import User
from apps.users.serializers import serialize_user
from core.exceptions import AppError

DEFAULT_CATEGORIES: list[dict[str, str]] = [
    {"name": "Salário", "type": TransactionType.INCOME, "color": "#10b981", "icon": "briefcase"},
    {"name": "Freelance", "type": TransactionType.INCOME, "color": "#06b6d4", "icon": "laptop"},
    {"name": "Moradia", "type": TransactionType.EXPENSE, "color": "#f43f5e", "icon": "home"},
    {"name": "Alimentação", "type": TransactionType.EXPENSE, "color": "#f97316", "icon": "utensils"},
    {"name": "Transporte", "type": TransactionType.EXPENSE, "color": "#eab308", "icon": "car"},
    {"name": "Lazer", "type": TransactionType.EXPENSE, "color": "#a855f7", "icon": "gamepad-2"},
]


def _issue_access_token(user: User) -> str:
    refresh = RefreshToken.for_user(user)
    refresh["email"] = user.email
    access = refresh.access_token
    access["email"] = user.email
    return str(access)


@transaction.atomic
def register_user(*, name: str, email: str, password: str) -> dict[str, object]:
    normalized_email = email.strip().lower()
    if User.objects.filter(email=normalized_email).exists():
        raise AppError(
            "Já existe uma conta cadastrada com este e-mail.",
            status.HTTP_409_CONFLICT,
        )

    user = User.objects.create_user(
        email=normalized_email,
        name=name.strip(),
        password=password,
    )

    Category.objects.bulk_create(
        [Category(user=user, **cat) for cat in DEFAULT_CATEGORIES]
    )

    return {
        "user": serialize_user(user),
        "accessToken": _issue_access_token(user),
    }


def login_user(*, email: str, password: str) -> dict[str, object]:
    normalized_email = email.strip().lower()
    user = User.objects.filter(email=normalized_email).first()

    if user is None or not user.check_password(password):
        raise AppError("E-mail ou senha inválidos.", status.HTTP_401_UNAUTHORIZED)

    return {
        "user": serialize_user(user),
        "accessToken": _issue_access_token(user),
    }
