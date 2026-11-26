from datetime import datetime, timezone
from decimal import Decimal

import pytest

from apps.accounts.models import Account, AccountType
from apps.categories.models import TransactionType
from apps.transactions.models import Transaction


@pytest.mark.django_db
def test_list_accounts_calculates_current_balance_and_isolates_users(
    auth_client, user, other_user, checking_account, income_category, expense_category
):
    Account.objects.create(
        user=other_user,
        name="Conta de Terceiro",
        type=AccountType.CASH,
        initial_balance=9999,
    )
    Transaction.objects.create(
        user=user,
        account=checking_account,
        category=income_category,
        type=TransactionType.INCOME,
        amount=Decimal("2500.00"),
        description="Salário",
        date=datetime(2026, 11, 5, 12, 0, tzinfo=timezone.utc),
    )
    Transaction.objects.create(
        user=user,
        account=checking_account,
        category=expense_category,
        type=TransactionType.EXPENSE,
        amount=Decimal("850.50"),
        description="Aluguel",
        date=datetime(2026, 11, 10, 12, 0, tzinfo=timezone.utc),
    )

    res = auth_client.get("/api/accounts")
    assert res.status_code == 200
    accounts = res.json()["accounts"]
    assert len(accounts) == 1
    assert accounts[0]["currentBalance"] == 2649.5
    assert isinstance(accounts[0]["currentBalance"], (int, float))
    assert accounts[0]["transactionCount"] == 2


@pytest.mark.django_db
def test_create_update_and_delete_account(auth_client):
    create_res = auth_client.post(
        "/api/accounts",
        {
            "name": "Reserva CDB",
            "type": "INVESTMENT",
            "initialBalance": 5000.25,
            "color": "#10b981",
        },
        format="json",
    )
    assert create_res.status_code == 201
    created = create_res.json()["account"]
    assert created["currentBalance"] == 5000.25

    update_res = auth_client.put(
        f"/api/accounts/{created['id']}",
        {"name": "Reserva Liquidez", "initialBalance": 6000},
        format="json",
    )
    assert update_res.status_code == 200
    assert update_res.json()["account"]["name"] == "Reserva Liquidez"
    assert update_res.json()["account"]["currentBalance"] == 6000.0

    delete_res = auth_client.delete(f"/api/accounts/{created['id']}")
    assert delete_res.status_code == 204


@pytest.mark.django_db
def test_delete_account_with_transactions_returns_409(
    auth_client, user, checking_account, income_category
):
    Transaction.objects.create(
        user=user,
        account=checking_account,
        category=income_category,
        type=TransactionType.INCOME,
        amount=Decimal("100.00"),
        description="Bônus",
        date=datetime(2026, 11, 1, 12, 0, tzinfo=timezone.utc),
    )

    res = auth_client.delete(f"/api/accounts/{checking_account.id}")
    assert res.status_code == 409
    assert "message" in res.json()
