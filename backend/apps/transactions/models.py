from __future__ import annotations

import uuid

from django.conf import settings
from django.db import models

from apps.accounts.models import Account
from apps.categories.models import Category, TransactionType


class Transaction(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="transactions",
    )
    account = models.ForeignKey(
        Account,
        on_delete=models.RESTRICT,
        related_name="transactions",
    )
    category = models.ForeignKey(
        Category,
        on_delete=models.RESTRICT,
        related_name="transactions",
    )
    type = models.CharField(max_length=10, choices=TransactionType.choices)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    description = models.CharField(max_length=140)
    date = models.DateTimeField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "transactions"
        ordering = ["-date", "-created_at"]
        indexes = [
            models.Index(fields=["user", "date"], name="transactions_user_date_idx"),
            models.Index(fields=["account"], name="transactions_account_idx"),
            models.Index(fields=["category"], name="transactions_category_idx"),
        ]

    def __str__(self) -> str:
        return f"{self.description} ({self.type}: {self.amount})"
