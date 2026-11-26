from __future__ import annotations

from decimal import Decimal
import math
from typing import Any
from uuid import UUID

from django.db.models import Sum
from rest_framework import status

from apps.accounts.models import Account
from apps.categories.models import Category, TransactionType
from apps.transactions.models import Transaction
from apps.users.models import User
from core.exceptions import AppError
from core.utils.period import format_iso_utc, resolve_date_range


def _parse_uuid(raw_id: str) -> UUID | None:
    try:
        return UUID(str(raw_id))
    except (ValueError, TypeError):
        return None


def serialize_transaction(tx: Transaction) -> dict[str, Any]:
    return {
        "id": str(tx.id),
        "type": tx.type,
        "amount": round(float(tx.amount), 2),
        "description": tx.description,
        "date": format_iso_utc(tx.date),
        "accountId": str(tx.account_id),
        "categoryId": str(tx.category_id),
        "account": {
            "id": str(tx.account.id),
            "name": tx.account.name,
            "type": tx.account.type,
            "color": tx.account.color,
        },
        "category": {
            "id": str(tx.category.id),
            "name": tx.category.name,
            "type": tx.category.type,
            "color": tx.category.color,
            "icon": tx.category.icon,
        },
        "createdAt": format_iso_utc(tx.created_at),
        "updatedAt": format_iso_utc(tx.updated_at),
    }


def _validate_ownership_and_type(
    user: User,
    account_id: UUID,
    category_id: UUID,
    tx_type: str,
) -> tuple[Account, Category]:
    account = Account.objects.filter(id=account_id, user=user).first()
    if account is None:
        raise AppError("Conta não encontrada para este usuário.", status.HTTP_404_NOT_FOUND)

    category = Category.objects.filter(id=category_id, user=user).first()
    if category is None:
        raise AppError(
            "Categoria não encontrada para este usuário.",
            status.HTTP_404_NOT_FOUND,
        )

    if category.type != tx_type:
        raise AppError(
            "O tipo da categoria selecionada não corresponde ao tipo da transação.",
            status.HTTP_400_BAD_REQUEST,
        )

    return account, category


def list_transactions(user: User, query: dict[str, Any]) -> dict[str, Any]:
    date_range = resolve_date_range(
        month=query.get("month"),
        year=query.get("year"),
        start_date=query.get("startDate"),
        end_date=query.get("endDate"),
    )

    qs = Transaction.objects.filter(user=user)
    if date_range is not None:
        qs = qs.filter(date__gte=date_range.start, date__lte=date_range.end)
    if query.get("type"):
        qs = qs.filter(type=query["type"])
    if query.get("accountId"):
        qs = qs.filter(account_id=query["accountId"])
    if query.get("categoryId"):
        qs = qs.filter(category_id=query["categoryId"])
    if query.get("search"):
        qs = qs.filter(description__icontains=query["search"])

    page = int(query.get("page", 1))
    limit = int(query.get("limit", 15))
    offset = (page - 1) * limit

    total = qs.count()
    items = list(
        qs.select_related("account", "category")
        .order_by("-date", "-created_at")[offset : offset + limit]
    )

    grouped_totals = qs.values("type").annotate(total=Sum("amount"))
    total_income = Decimal("0")
    total_expense = Decimal("0")
    for row in grouped_totals:
        val = row["total"] or Decimal("0")
        if row["type"] == TransactionType.INCOME:
            total_income = val
        else:
            total_expense = val

    return {
        "transactions": [serialize_transaction(tx) for tx in items],
        "summary": {
            "totalIncome": round(float(total_income), 2),
            "totalExpense": round(float(total_expense), 2),
            "netBalance": round(float(total_income - total_expense), 2),
        },
        "pagination": {
            "page": page,
            "limit": limit,
            "total": total,
            "totalPages": max(1, math.ceil(total / limit)) if total > 0 else 1,
        },
    }


def create_transaction(user: User, data: dict[str, Any]) -> dict[str, Any]:
    account, category = _validate_ownership_and_type(
        user,
        data["accountId"],
        data["categoryId"],
        data["type"],
    )

    tx = Transaction.objects.create(
        user=user,
        account=account,
        category=category,
        type=data["type"],
        amount=Decimal(f"{data['amount']:.2f}"),
        description=data["description"],
        date=data["date"],
    )
    tx.account = account
    tx.category = category
    return serialize_transaction(tx)


def update_transaction(
    user: User,
    transaction_id: str,
    data: dict[str, Any],
) -> dict[str, Any]:
    parsed_id = _parse_uuid(transaction_id)
    tx = (
        Transaction.objects.filter(id=parsed_id, user=user).first()
        if parsed_id
        else None
    )
    if tx is None:
        raise AppError("Transação não encontrada.", status.HTTP_404_NOT_FOUND)

    next_account_id = data.get("accountId", tx.account_id)
    next_category_id = data.get("categoryId", tx.category_id)
    next_type = data.get("type", tx.type)

    account, category = _validate_ownership_and_type(
        user,
        next_account_id,
        next_category_id,
        next_type,
    )

    tx.account = account
    tx.category = category
    tx.type = next_type
    if "amount" in data:
        tx.amount = Decimal(f"{data['amount']:.2f}")
    if "description" in data:
        tx.description = data["description"]
    if "date" in data:
        tx.date = data["date"]
    tx.save()

    return serialize_transaction(tx)


def delete_transaction(user: User, transaction_id: str) -> None:
    parsed_id = _parse_uuid(transaction_id)
    tx = (
        Transaction.objects.filter(id=parsed_id, user=user).first()
        if parsed_id
        else None
    )
    if tx is None:
        raise AppError("Transação não encontrada.", status.HTTP_404_NOT_FOUND)
    tx.delete()
