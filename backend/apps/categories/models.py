from __future__ import annotations

import uuid

from django.conf import settings
from django.db import models


class TransactionType(models.TextChoices):
    INCOME = "INCOME", "Receita"
    EXPENSE = "EXPENSE", "Despesa"


class Category(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="categories",
    )
    name = models.CharField(max_length=50)
    type = models.CharField(max_length=10, choices=TransactionType.choices)
    color = models.CharField(max_length=16, default="#6366f1")
    icon = models.CharField(max_length=40, default="tag")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "categories"
        ordering = ["type", "name"]
        indexes = [
            models.Index(fields=["user", "type"], name="categories_user_type_idx"),
        ]

    def __str__(self) -> str:
        return f"{self.name} ({self.type})"
