from datetime import datetime, timezone
from decimal import Decimal

import pytest

from apps.accounts.models import Account, AccountType
from apps.categories.models import TransactionType
from apps.transactions.models import Transaction


@pytest.mark.django_db
def test_dashboard_summary_returns_kpis_category_breakdown_and_evolution(
    auth_client, user, income_category, expense_category
):
    account = Account.objects.create(
        user=user,
        name="Conta Principal",
        type=AccountType.CHECKING,
        initial_balance=Decimal("5000.00"),
        color="#10b981",
    )
    Transaction.objects.create(
        user=user,
        account=account,
        category=income_category,
        type=TransactionType.INCOME,
        amount=Decimal("4000.00"),
        description="Salário",
        date=datetime(2026, 11, 5, 12, 0, tzinfo=timezone.utc),
    )
    Transaction.objects.create(
        user=user,
        account=account,
        category=expense_category,
        type=TransactionType.EXPENSE,
        amount=Decimal("1000.00"),
        description="Aluguel",
        date=datetime(2026, 11, 10, 12, 0, tzinfo=timezone.utc),
    )

    res = auth_client.get("/api/dashboard/summary?month=11&year=2026")
    assert res.status_code == 200
    body = res.json()

    assert body["kpis"] == {
        "totalBalance": 8000.0,
        "periodIncome": 4000.0,
        "periodExpense": 1000.0,
        "periodBalance": 3000.0,
        "savingsRate": 75.0,
    }
    assert len(body["expensesByCategory"]) == 1
    assert body["expensesByCategory"][0]["percentage"] == 100.0
    assert len(body["monthlyEvolution"]) == 6
    assert body["monthlyEvolution"][-1]["key"] == "2026-11"
    assert body["monthlyEvolution"][-1]["label"] == "Nov/26"
    assert len(body["recentTransactions"]) == 2
    assert len(body["accounts"]) == 1
