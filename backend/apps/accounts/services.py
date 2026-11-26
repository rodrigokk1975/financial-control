from __future__ import annotations

from decimal import Decimal
from typing import Any
from uuid import UUID

from django.db.models import Count, Sum
from rest_framework import status

from apps.accounts.models import Account
from apps.categories.models import TransactionType
from apps.transactions.models import Transaction
from apps.users.models import User
from core.exceptions import AppError
from core.utils.period import format_iso_utc


def _parse_uuid(raw_id: str) -> UUID | None:
    try:
        return UUID(str(raw_id))
    except (ValueError, TypeError):
        return None


def _serialize_account(
    account: Account,
    *,
    income_total: Decimal = Decimal("0"),
    expense_total: Decimal = Decimal("0"),
    transaction_count: int = 0,
) -> dict[str, Any]:
    initial = Decimal(str(account.initial_balance))
    current = initial + income_total - expense_total
    return {
        "id": str(account.id),
        "name": account.name,
        "type": account.type,
        "initialBalance": round(float(initial), 2),
        "currentBalance": round(float(current), 2),
        "color": account.color,
        "transactionCount": int(transaction_count),
        "createdAt": format_iso_utc(account.created_at),
        "updatedAt": format_iso_utc(account.updated_at),
    }


def list_accounts(user: User) -> list[dict[str, Any]]:
    accounts = list(
        Account.objects.filter(user=user)
        .annotate(tx_count=Count("transactions"))
        .order_by("created_at")
    )

    grouped = (
        Transaction.objects.filter(user=user)
        .values("account_id", "type")
        .annotate(total=Sum("amount"))
    )

    totals_by_account: dict[UUID, dict[str, Decimal]] = {}
    for row in grouped:
        acc_id = row["account_id"]
        entry = totals_by_account.setdefault(
            acc_id, {"income": Decimal("0"), "expense": Decimal("0")}
        )
        value = row["total"] or Decimal("0")
        if row["type"] == TransactionType.INCOME:
            entry["income"] += value
        else:
            entry["expense"] += value

    result: list[dict[str, Any]] = []
    for account in accounts:
        totals = totals_by_account.get(
            account.id, {"income": Decimal("0"), "expense": Decimal("0")}
        )
        result.append(
            _serialize_account(
                account,
                income_total=totals["income"],
                expense_total=totals["expense"],
                transaction_count=account.tx_count,
            )
        )
    return result


def create_account(user: User, data: dict[str, Any]) -> dict[str, Any]:
    account = Account.objects.create(
        user=user,
        name=data["name"],
        type=data["type"],
        initial_balance=Decimal(f"{data['initialBalance']:.2f}"),
        color=data["color"],
    )
    return _serialize_account(account)


def update_account(user: User, account_id: str, data: dict[str, Any]) -> dict[str, Any]:
    parsed_id = _parse_uuid(account_id)
    account = (
        Account.objects.filter(id=parsed_id, user=user).first() if parsed_id else None
    )
    if account is None:
        raise AppError("Conta não encontrada.", status.HTTP_404_NOT_FOUND)

    if "name" in data:
        account.name = data["name"]
    if "type" in data:
        account.type = data["type"]
    if "initialBalance" in data:
        account.initial_balance = Decimal(f"{data['initialBalance']:.2f}")
    if "color" in data:
        account.color = data["color"]
    account.save()

    accounts = list_accounts(user)
    return next(item for item in accounts if item["id"] == str(account.id))


def delete_account(user: User, account_id: str) -> None:
    parsed_id = _parse_uuid(account_id)
    account = (
        Account.objects.filter(id=parsed_id, user=user)
        .annotate(tx_count=Count("transactions"))
        .first()
        if parsed_id
        else None
    )
    if account is None:
        raise AppError("Conta não encontrada.", status.HTTP_404_NOT_FOUND)

    if account.tx_count > 0:
        raise AppError(
            "Não é possível excluir uma conta que possui transações vinculadas.",
            status.HTTP_409_CONFLICT,
        )

    account.delete()
