from __future__ import annotations

import calendar
from datetime import datetime, timezone
from decimal import Decimal
from typing import Any

from apps.accounts.services import list_accounts
from apps.categories.models import TransactionType
from apps.transactions.models import Transaction
from apps.users.models import User
from core.utils.period import format_iso_utc, resolve_date_range

MONTH_LABELS_PT = [
    "Jan",
    "Fev",
    "Mar",
    "Abr",
    "Mai",
    "Jun",
    "Jul",
    "Ago",
    "Set",
    "Out",
    "Nov",
    "Dez",
]


def _shift_year_month(year: int, month: int, delta: int) -> tuple[int, int]:
    total = year * 12 + (month - 1) + delta
    return total // 12, (total % 12) + 1


def _month_key(dt: datetime) -> str:
    utc_dt = dt.astimezone(timezone.utc) if dt.tzinfo else dt.replace(tzinfo=timezone.utc)
    return f"{utc_dt.year}-{utc_dt.month:02d}"


def get_dashboard_summary(user: User, query: dict[str, Any]) -> dict[str, Any]:
    now = datetime.now(timezone.utc)

    resolved_range = resolve_date_range(
        month=query.get("month"),
        year=query.get("year"),
        start_date=query.get("startDate"),
        end_date=query.get("endDate"),
    )
    if resolved_range is None:
        resolved_range = resolve_date_range(month=now.month, year=now.year)
    assert resolved_range is not None

    anchor_year = resolved_range.end.year
    anchor_month = resolved_range.end.month

    start_y, start_m = _shift_year_month(anchor_year, anchor_month, -5)
    last_day = calendar.monthrange(anchor_year, anchor_month)[1]
    six_months_start = datetime(start_y, start_m, 1, 0, 0, 0, 0, tzinfo=timezone.utc)
    six_months_end = datetime(
        anchor_year, anchor_month, last_day, 23, 59, 59, 999000, tzinfo=timezone.utc
    )

    accounts = list_accounts(user)

    period_transactions = list(
        Transaction.objects.filter(
            user=user,
            date__gte=resolved_range.start,
            date__lte=resolved_range.end,
        ).select_related("category")
    )

    evolution_transactions = list(
        Transaction.objects.filter(
            user=user,
            date__gte=six_months_start,
            date__lte=six_months_end,
        ).only("type", "amount", "date")
    )

    recent_transactions = list(
        Transaction.objects.filter(
            user=user,
            date__gte=resolved_range.start,
            date__lte=resolved_range.end,
        )
        .select_related("account", "category")
        .order_by("-date", "-created_at")[:6]
    )

    total_balance = round(sum(acc["currentBalance"] for acc in accounts), 2)

    period_income = Decimal("0")
    period_expense = Decimal("0")
    category_totals: dict[str, dict[str, Any]] = {}

    for tx in period_transactions:
        amount = Decimal(str(tx.amount))
        if tx.type == TransactionType.INCOME:
            period_income += amount
        else:
            period_expense += amount
            cat_id = str(tx.category.id)
            if cat_id in category_totals:
                category_totals[cat_id]["total"] += amount
            else:
                category_totals[cat_id] = {
                    "categoryId": cat_id,
                    "name": tx.category.name,
                    "color": tx.category.color,
                    "icon": tx.category.icon,
                    "total": amount,
                }

    period_balance = round(float(period_income - period_expense), 2)
    savings_rate = (
        round(float(((period_income - period_expense) / period_income) * 100), 1)
        if period_income > 0
        else 0.0
    )

    expenses_by_category = []
    for item in sorted(
        category_totals.values(),
        key=lambda entry: entry["total"],
        reverse=True,
    ):
        total_val = item["total"]
        percentage = (
            round(float((total_val / period_expense) * 100), 1)
            if period_expense > 0
            else 0.0
        )
        expenses_by_category.append(
            {
                "categoryId": item["categoryId"],
                "name": item["name"],
                "color": item["color"],
                "icon": item["icon"],
                "total": round(float(total_val), 2),
                "percentage": percentage,
            }
        )

    monthly_map: dict[str, dict[str, Any]] = {}
    for offset in range(5, -1, -1):
        y, m = _shift_year_month(anchor_year, anchor_month, -offset)
        key = f"{y}-{m:02d}"
        label = f"{MONTH_LABELS_PT[m - 1]}/{str(y)[-2:]}"
        monthly_map[key] = {
            "key": key,
            "label": label,
            "income": Decimal("0"),
            "expense": Decimal("0"),
        }

    for tx in evolution_transactions:
        bucket = monthly_map.get(_month_key(tx.date))
        if bucket is None:
            continue
        amount = Decimal(str(tx.amount))
        if tx.type == TransactionType.INCOME:
            bucket["income"] += amount
        else:
            bucket["expense"] += amount

    monthly_evolution = [
        {
            "key": item["key"],
            "label": item["label"],
            "income": round(float(item["income"]), 2),
            "expense": round(float(item["expense"]), 2),
            "balance": round(float(item["income"] - item["expense"]), 2),
        }
        for item in monthly_map.values()
    ]

    return {
        "period": {
            "startDate": format_iso_utc(resolved_range.start),
            "endDate": format_iso_utc(resolved_range.end),
        },
        "kpis": {
            "totalBalance": total_balance,
            "periodIncome": round(float(period_income), 2),
            "periodExpense": round(float(period_expense), 2),
            "periodBalance": period_balance,
            "savingsRate": savings_rate,
        },
        "expensesByCategory": expenses_by_category,
        "monthlyEvolution": monthly_evolution,
        "accounts": accounts,
        "recentTransactions": [
            {
                "id": str(tx.id),
                "type": tx.type,
                "amount": round(float(tx.amount), 2),
                "description": tx.description,
                "date": format_iso_utc(tx.date),
                "account": {
                    "id": str(tx.account.id),
                    "name": tx.account.name,
                    "color": tx.account.color,
                    "type": tx.account.type,
                },
                "category": {
                    "id": str(tx.category.id),
                    "name": tx.category.name,
                    "color": tx.category.color,
                    "icon": tx.category.icon,
                    "type": tx.category.type,
                },
            }
            for tx in recent_transactions
        ],
    }
