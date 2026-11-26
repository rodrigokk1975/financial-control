from __future__ import annotations

import re

from rest_framework import serializers

from apps.categories.models import TransactionType

HEX_COLOR_RE = re.compile(r"^#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})$")


class ListCategoriesQuerySerializer(serializers.Serializer):
    type = serializers.ChoiceField(choices=TransactionType.choices, required=False)


class CreateCategorySerializer(serializers.Serializer):
    name = serializers.CharField(
        trim_whitespace=True,
        min_length=2,
        max_length=50,
        error_messages={
            "required": "Nome da categoria é obrigatório.",
            "blank": "Nome da categoria é obrigatório.",
            "min_length": "Nome deve ter pelo menos 2 caracteres.",
            "max_length": "Nome deve ter no máximo 50 caracteres.",
        },
    )
    type = serializers.ChoiceField(
        choices=TransactionType.choices,
        error_messages={
            "required": "Tipo da categoria (INCOME ou EXPENSE) é obrigatório.",
        },
    )
    color = serializers.RegexField(
        regex=HEX_COLOR_RE,
        default="#6366f1",
        error_messages={
            "invalid": "Cor deve estar em formato hexadecimal (ex: #6366f1).",
        },
    )
    icon = serializers.CharField(
        trim_whitespace=True,
        min_length=1,
        max_length=40,
        default="tag",
    )


class UpdateCategorySerializer(serializers.Serializer):
    name = serializers.CharField(
        required=False,
        trim_whitespace=True,
        min_length=2,
        max_length=50,
        error_messages={
            "blank": "Nome da categoria é obrigatório.",
            "min_length": "Nome deve ter pelo menos 2 caracteres.",
            "max_length": "Nome deve ter no máximo 50 caracteres.",
        },
    )
    type = serializers.ChoiceField(
        required=False,
        choices=TransactionType.choices,
    )
    color = serializers.RegexField(
        required=False,
        regex=HEX_COLOR_RE,
        error_messages={
            "invalid": "Cor deve estar em formato hexadecimal (ex: #6366f1).",
        },
    )
    icon = serializers.CharField(
        required=False,
        trim_whitespace=True,
        min_length=1,
        max_length=40,
    )
