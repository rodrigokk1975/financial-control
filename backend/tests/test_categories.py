from datetime import datetime, timezone
from decimal import Decimal

import pytest

from apps.categories.models import TransactionType
from apps.transactions.models import Transaction


@pytest.mark.django_db
def test_categories_crud_and_type_filter(auth_client, income_category, expense_category):
    all_res = auth_client.get("/api/categories")
    assert all_res.status_code == 200
    assert len(all_res.json()["categories"]) == 2

    only_income = auth_client.get("/api/categories?type=INCOME")
    assert only_income.status_code == 200
    assert len(only_income.json()["categories"]) == 1
    assert only_income.json()["categories"][0]["id"] == str(income_category.id)

    create_res = auth_client.post(
        "/api/categories",
        {"name": "Educação", "type": "EXPENSE", "color": "#3b82f6", "icon": "book"},
        format="json",
    )
    assert create_res.status_code == 201
    cat_id = create_res.json()["category"]["id"]

    update_res = auth_client.put(
        f"/api/categories/{cat_id}",
        {"name": "Cursos"},
        format="json",
    )
    assert update_res.status_code == 200
    assert update_res.json()["category"]["name"] == "Cursos"

    delete_res = auth_client.delete(f"/api/categories/{cat_id}")
    assert delete_res.status_code == 204


@pytest.mark.django_db
def test_category_with_transactions_blocks_type_change_and_delete(
    auth_client, user, checking_account, expense_category
):
    Transaction.objects.create(
        user=user,
        account=checking_account,
        category=expense_category,
        type=TransactionType.EXPENSE,
        amount=Decimal("500.00"),
        description="Condomínio",
        date=datetime(2026, 11, 5, 12, 0, tzinfo=timezone.utc),
    )

    change_type_res = auth_client.put(
        f"/api/categories/{expense_category.id}",
        {"type": "INCOME"},
        format="json",
    )
    assert change_type_res.status_code == 409

    delete_res = auth_client.delete(f"/api/categories/{expense_category.id}")
    assert delete_res.status_code == 409
