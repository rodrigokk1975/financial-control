from __future__ import annotations

import re

from rest_framework import serializers

from apps.accounts.models import AccountType

HEX_COLOR_RE = re.compile(r"^#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})$")


class CreateAccountSerializer(serializers.Serializer):
    name = serializers.CharField(
        trim_whitespace=True,
        min_length=2,
        max_length=60,
        error_messages={
            "required": "Nome da conta é obrigatório.",
            "blank": "Nome da conta é obrigatório.",
            "min_length": "Nome deve ter pelo menos 2 caracteres.",
            "max_length": "Nome deve ter no máximo 60 caracteres.",
        },
    )
    type = serializers.ChoiceField(
        choices=AccountType.choices,
        default=AccountType.CHECKING,
    )
    initialBalance = serializers.FloatField(
        default=0.0,
        error_messages={"invalid": "Saldo inicial inválido."},
    )
    color = serializers.RegexField(
        regex=HEX_COLOR_RE,
        default="#10b981",
        error_messages={
            "invalid": "Cor deve estar em formato hexadecimal (ex: #10b981).",
        },
    )


class UpdateAccountSerializer(serializers.Serializer):
    name = serializers.CharField(
        required=False,
        trim_whitespace=True,
        min_length=2,
        max_length=60,
        error_messages={
            "blank": "Nome da conta é obrigatório.",
            "min_length": "Nome deve ter pelo menos 2 caracteres.",
            "max_length": "Nome deve ter no máximo 60 caracteres.",
        },
    )
    type = serializers.ChoiceField(
        required=False,
        choices=AccountType.choices,
    )
    initialBalance = serializers.FloatField(
        required=False,
        error_messages={"invalid": "Saldo inicial inválido."},
    )
    color = serializers.RegexField(
        required=False,
        regex=HEX_COLOR_RE,
        error_messages={
            "invalid": "Cor deve estar em formato hexadecimal (ex: #10b981).",
        },
    )
