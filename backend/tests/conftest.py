from __future__ import annotations

import pytest
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken

from apps.accounts.models import Account, AccountType
from apps.categories.models import Category, TransactionType
from apps.users.models import User


@pytest.fixture
def api_client() -> APIClient:
    return APIClient()


@pytest.fixture
def user(db) -> User:
    return User.objects.create_user(
        email="tester@finpulse.dev",
        name="Rodrigo Tester",
        password="secret123",
    )


@pytest.fixture
def other_user(db) -> User:
    return User.objects.create_user(
        email="other@finpulse.dev",
        name="Outro Usuário",
        password="secret123",
    )


@pytest.fixture
def auth_client(api_client: APIClient, user: User) -> APIClient:
    token = str(RefreshToken.for_user(user).access_token)
    api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
    return api_client


@pytest.fixture
def checking_account(user: User) -> Account:
    return Account.objects.create(
        user=user,
        name="Nubank",
        type=AccountType.CHECKING,
        initial_balance=1000,
        color="#8b5cf6",
    )


@pytest.fixture
def income_category(user: User) -> Category:
    return Category.objects.create(
        user=user,
        name="Salário",
        type=TransactionType.INCOME,
        color="#10b981",
        icon="briefcase",
    )


@pytest.fixture
def expense_category(user: User) -> Category:
    return Category.objects.create(
        user=user,
        name="Moradia",
        type=TransactionType.EXPENSE,
        color="#f43f5e",
        icon="home",
    )
