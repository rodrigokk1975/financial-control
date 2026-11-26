from __future__ import annotations

import uuid

from django.conf import settings
from django.db import models


class AccountType(models.TextChoices):
    CHECKING = "CHECKING", "Conta Corrente"
    SAVINGS = "SAVINGS", "Poupança"
    CREDIT_CARD = "CREDIT_CARD", "Cartão de Crédito"
    CASH = "CASH", "Dinheiro"
    INVESTMENT = "INVESTMENT", "Investimento"


class Account(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="accounts",
    )
    name = models.CharField(max_length=60)
    type = models.CharField(
        max_length=20,
        choices=AccountType.choices,
        default=AccountType.CHECKING,
    )
    initial_balance = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    color = models.CharField(max_length=16, default="#10b981")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "accounts"
        ordering = ["created_at"]
        indexes = [
            models.Index(fields=["user"], name="accounts_user_idx"),
        ]

    def __str__(self) -> str:
        return f"{self.name} ({self.type})"
