from __future__ import annotations

from rest_framework import serializers

from apps.users.models import User
from core.utils.period import format_iso_utc


class RegisterSerializer(serializers.Serializer):
    name = serializers.CharField(
        trim_whitespace=True,
        min_length=2,
        max_length=80,
        error_messages={
            "required": "Nome é obrigatório.",
            "blank": "Nome é obrigatório.",
            "min_length": "Nome deve ter pelo menos 2 caracteres.",
            "max_length": "Nome deve ter no máximo 80 caracteres.",
        },
    )
    email = serializers.EmailField(
        trim_whitespace=True,
        error_messages={
            "required": "E-mail é obrigatório.",
            "blank": "E-mail é obrigatório.",
            "invalid": "Informe um e-mail válido.",
        },
    )
    password = serializers.CharField(
        min_length=6,
        max_length=100,
        trim_whitespace=False,
        error_messages={
            "required": "Senha é obrigatória.",
            "blank": "Senha é obrigatória.",
            "min_length": "Senha deve ter pelo menos 6 caracteres.",
            "max_length": "Senha muito longa.",
        },
    )

    def validate_email(self, value: str) -> str:
        return value.strip().lower()


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField(
        trim_whitespace=True,
        error_messages={
            "required": "E-mail é obrigatório.",
            "blank": "E-mail é obrigatório.",
            "invalid": "Informe um e-mail válido.",
        },
    )
    password = serializers.CharField(
        min_length=1,
        trim_whitespace=False,
        error_messages={
            "required": "Senha é obrigatória.",
            "blank": "Senha é obrigatória.",
        },
    )

    def validate_email(self, value: str) -> str:
        return value.strip().lower()


def serialize_user(user: User) -> dict[str, str]:
    return {
        "id": str(user.id),
        "name": user.name,
        "email": user.email,
        "createdAt": format_iso_utc(user.created_at),
    }
