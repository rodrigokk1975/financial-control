from datetime import datetime, timezone
from decimal import Decimal

import pytest

from apps.categories.models import TransactionType
from apps.transactions.models import Transaction


@pytest.mark.django_db
def test_create_transaction_rejects_category_type_mismatch(
    auth_client, checking_account, income_category
):
    res = auth_client.post(
        "/api/transactions",
        {
            "accountId": str(checking_account.id),
            "categoryId": str(income_category.id),
            "type": "EXPENSE",
            "amount": 120,
            "description": "Almoço",
            "date": "2026-11-15",
        },
        format="json",
    )
    assert res.status_code == 400
    assert "message" in res.json()


@pytest.mark.django_db
def test_transactions_crud_filters_summary_and_pagination(
    auth_client, user, checking_account, income_category, expense_category
):
    create_res = auth_client.post(
        "/api/transactions",
        {
            "accountId": str(checking_account.id),
            "categoryId": str(income_category.id),
            "type": "INCOME",
            "amount": 4200.5,
            "description": "Salário Novembro",
            "date": "2026-11-05T12:00:00.000Z",
        },
        format="json",
    )
    assert create_res.status_code == 201
    created = create_res.json()["transaction"]
    assert created["amount"] == 4200.5
    assert created["account"]["name"] == "Nubank"
    assert created["category"]["name"] == "Salário"

    Transaction.objects.create(
        user=user,
        account=checking_account,
        category=expense_category,
        type=TransactionType.EXPENSE,
        amount=Decimal("1200.00"),
        description="Aluguel Novembro",
        date=datetime(2026, 11, 10, 12, 0, tzinfo=timezone.utc),
    )
    Transaction.objects.create(
        user=user,
        account=checking_account,
        category=expense_category,
        type=TransactionType.EXPENSE,
        amount=Decimal("300.00"),
        description="Conta Outubro",
        date=datetime(2026, 10, 10, 12, 0, tzinfo=timezone.utc),
    )

    list_res = auth_client.get("/api/transactions?month=11&year=2026&page=1&limit=1")
    assert list_res.status_code == 200
    body = list_res.json()
    assert len(body["transactions"]) == 1
    assert body["pagination"] == {"page": 1, "limit": 1, "total": 2, "totalPages": 2}
    assert body["summary"] == {
        "totalIncome": 4200.5,
        "totalExpense": 1200.0,
        "netBalance": 3000.5,
    }

    search_res = auth_client.get("/api/transactions?month=11&year=2026&search=aluguel")
    assert search_res.status_code == 200
    assert len(search_res.json()["transactions"]) == 1
    assert search_res.json()["transactions"][0]["description"] == "Aluguel Novembro"

    put_res = auth_client.put(
        f"/api/transactions/{created['id']}",
        {"amount": 4500, "description": "Salário Atualizado"},
        format="json",
    )
    assert put_res.status_code == 200
    assert put_res.json()["transaction"]["amount"] == 4500.0

    del_res = auth_client.delete(f"/api/transactions/{created['id']}")
    assert del_res.status_code == 204
