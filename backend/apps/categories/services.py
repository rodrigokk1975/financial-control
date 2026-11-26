from __future__ import annotations

from typing import Any
from uuid import UUID

from django.db.models import Count
from rest_framework import status

from apps.categories.models import Category
from apps.users.models import User
from core.exceptions import AppError
from core.utils.period import format_iso_utc


def _parse_uuid(raw_id: str) -> UUID | None:
    try:
        return UUID(str(raw_id))
    except (ValueError, TypeError):
        return None


def _serialize_category(category: Category, transaction_count: int = 0) -> dict[str, Any]:
    return {
        "id": str(category.id),
        "name": category.name,
        "type": category.type,
        "color": category.color,
        "icon": category.icon,
        "transactionCount": int(transaction_count),
        "createdAt": format_iso_utc(category.created_at),
    }


def list_categories(user: User, category_type: str | None = None) -> list[dict[str, Any]]:
    qs = Category.objects.filter(user=user)
    if category_type:
        qs = qs.filter(type=category_type)
    categories = qs.annotate(tx_count=Count("transactions")).order_by("type", "name")
    return [_serialize_category(cat, cat.tx_count) for cat in categories]


def create_category(user: User, data: dict[str, Any]) -> dict[str, Any]:
    category = Category.objects.create(
        user=user,
        name=data["name"],
        type=data["type"],
        color=data["color"],
        icon=data["icon"],
    )
    return _serialize_category(category, 0)


def update_category(
    user: User, category_id: str, data: dict[str, Any]
) -> dict[str, Any]:
    parsed_id = _parse_uuid(category_id)
    category = (
        Category.objects.filter(id=parsed_id, user=user)
        .annotate(tx_count=Count("transactions"))
        .first()
        if parsed_id
        else None
    )
    if category is None:
        raise AppError("Categoria não encontrada.", status.HTTP_404_NOT_FOUND)

    next_type = data.get("type")
    if next_type and next_type != category.type and category.tx_count > 0:
        raise AppError(
            "Não é possível alterar o tipo de uma categoria que já possui transações.",
            status.HTTP_409_CONFLICT,
        )

    if "name" in data:
        category.name = data["name"]
    if "type" in data:
        category.type = data["type"]
    if "color" in data:
        category.color = data["color"]
    if "icon" in data:
        category.icon = data["icon"]
    category.save()

    return _serialize_category(category, category.tx_count)


def delete_category(user: User, category_id: str) -> None:
    parsed_id = _parse_uuid(category_id)
    category = (
        Category.objects.filter(id=parsed_id, user=user)
        .annotate(tx_count=Count("transactions"))
        .first()
        if parsed_id
        else None
    )
    if category is None:
        raise AppError("Categoria não encontrada.", status.HTTP_404_NOT_FOUND)

    if category.tx_count > 0:
        raise AppError(
            "Não é possível excluir uma categoria que possui transações vinculadas.",
            status.HTTP_409_CONFLICT,
        )

    category.delete()
