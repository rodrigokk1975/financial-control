from __future__ import annotations

from datetime import date, datetime, timezone
import re

from rest_framework import serializers

from apps.categories.models import TransactionType

ISO_DATE_ONLY_RE = re.compile(r"^\d{4}-\d{2}-\d{2}$")


class FlexibleDateTimeField(serializers.Field):
    """Accepts ISO-8601 date ('YYYY-MM-DD') or datetime strings and normalizes to UTC."""

    def to_internal_value(self, data) -> datetime:
        if isinstance(data, datetime):
            return data if data.tzinfo else data.replace(tzinfo=timezone.utc)
        if isinstance(data, date):
            return datetime(data.year, data.month, data.day, tzinfo=timezone.utc)
        if not isinstance(data, str) or not data.strip():
            raise serializers.ValidationError("Data é obrigatória.")

        raw = data.strip()
        if ISO_DATE_ONLY_RE.match(raw):
            try:
                parsed_date = date.fromisoformat(raw)
            except ValueError as exc:
                raise serializers.ValidationError("Data inválida.") from exc
            return datetime(
                parsed_date.year, parsed_date.month, parsed_date.day, tzinfo=timezone.utc
            )

        normalized = raw.replace("Z", "+00:00")
        try:
            parsed_dt = datetime.fromisoformat(normalized)
        except ValueError as exc:
            raise serializers.ValidationError("Data inválida.") from exc

        if parsed_dt.tzinfo is None:
            return parsed_dt.replace(tzinfo=timezone.utc)
        return parsed_dt.astimezone(timezone.utc)

    def to_representation(self, value: datetime) -> str:
        return value.astimezone(timezone.utc).isoformat().replace("+00:00", "Z")


class ListTransactionsQuerySerializer(serializers.Serializer):
    month = serializers.IntegerField(min_value=1, max_value=12, required=False)
    year = serializers.IntegerField(min_value=2000, max_value=2100, required=False)
    startDate = serializers.RegexField(
        regex=ISO_DATE_ONLY_RE,
        required=False,
        error_messages={"invalid": "startDate deve estar no formato YYYY-MM-DD."},
    )
    endDate = serializers.RegexField(
        regex=ISO_DATE_ONLY_RE,
        required=False,
        error_messages={"invalid": "endDate deve estar no formato YYYY-MM-DD."},
    )
    type = serializers.ChoiceField(choices=TransactionType.choices, required=False)
    accountId = serializers.UUIDField(
        required=False,
        error_messages={"invalid": "accountId inválido."},
    )
    categoryId = serializers.UUIDField(
        required=False,
        error_messages={"invalid": "categoryId inválido."},
    )
    search = serializers.CharField(
        required=False,
        allow_blank=True,
        trim_whitespace=True,
        max_length=100,
    )
    page = serializers.IntegerField(min_value=1, default=1)
    limit = serializers.IntegerField(min_value=1, max_value=100, default=15)


class CreateTransactionSerializer(serializers.Serializer):
    accountId = serializers.UUIDField(
        error_messages={
            "required": "Conta é obrigatória.",
            "invalid": "ID de conta inválido.",
        }
    )
    categoryId = serializers.UUIDField(
        error_messages={
            "required": "Categoria é obrigatória.",
            "invalid": "ID de categoria inválido.",
        }
    )
    type = serializers.ChoiceField(
        choices=TransactionType.choices,
        error_messages={
            "required": "Tipo da transação (INCOME ou EXPENSE) é obrigatório.",
        },
    )
    amount = serializers.FloatField(
        error_messages={
            "required": "Valor é obrigatório.",
            "invalid": "Valor inválido.",
        }
    )
    description = serializers.CharField(
        trim_whitespace=True,
        min_length=2,
        max_length=140,
        error_messages={
            "required": "Descrição é obrigatória.",
            "blank": "Descrição é obrigatória.",
            "min_length": "Descrição deve ter pelo menos 2 caracteres.",
            "max_length": "Descrição deve ter no máximo 140 caracteres.",
        },
    )
    date = FlexibleDateTimeField(
        error_messages={"required": "Data é obrigatória."},
    )

    def validate_amount(self, value: float) -> float:
        if value <= 0:
            raise serializers.ValidationError("O valor deve ser maior que zero.")
        return value


class UpdateTransactionSerializer(serializers.Serializer):
    accountId = serializers.UUIDField(
        required=False,
        error_messages={"invalid": "ID de conta inválido."},
    )
    categoryId = serializers.UUIDField(
        required=False,
        error_messages={"invalid": "ID de categoria inválido."},
    )
    type = serializers.ChoiceField(
        required=False,
        choices=TransactionType.choices,
    )
    amount = serializers.FloatField(
        required=False,
        error_messages={"invalid": "Valor inválido."},
    )
    description = serializers.CharField(
        required=False,
        trim_whitespace=True,
        min_length=2,
        max_length=140,
        error_messages={
            "blank": "Descrição é obrigatória.",
            "min_length": "Descrição deve ter pelo menos 2 caracteres.",
            "max_length": "Descrição deve ter no máximo 140 caracteres.",
        },
    )
    date = FlexibleDateTimeField(required=False)

    def validate_amount(self, value: float) -> float:
        if value <= 0:
            raise serializers.ValidationError("O valor deve ser maior que zero.")
        return value
