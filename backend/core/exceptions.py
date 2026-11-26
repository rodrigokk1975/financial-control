from __future__ import annotations

from typing import Any

from django.db import IntegrityError
from django.db.models.deletion import ProtectedError, RestrictedError
from django.http import Http404
from rest_framework import status
from rest_framework.exceptions import (
    AuthenticationFailed,
    NotAuthenticated,
    NotFound,
    ValidationError,
)
from rest_framework.response import Response
from rest_framework.views import exception_handler
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError


class AppError(Exception):
    """Domain error with HTTP status code and optional field errors."""

    def __init__(
        self,
        message: str,
        status_code: int = status.HTTP_400_BAD_REQUEST,
        errors: dict[str, list[str]] | None = None,
    ) -> None:
        super().__init__(message)
        self.message = message
        self.status_code = status_code
        self.errors = errors


def _flatten_drf_errors(detail: Any, prefix: str = "") -> dict[str, list[str]]:
    field_errors: dict[str, list[str]] = {}
    if isinstance(detail, dict):
        for key, value in detail.items():
            full_key = f"{prefix}.{key}" if prefix else str(key)
            if isinstance(value, dict):
                field_errors.update(_flatten_drf_errors(value, full_key))
            elif isinstance(value, list):
                field_errors[full_key] = [str(item) for item in value]
            else:
                field_errors[full_key] = [str(value)]
    elif isinstance(detail, list):
        field_errors[prefix or "root"] = [str(item) for item in detail]
    else:
        field_errors[prefix or "root"] = [str(detail)]
    return field_errors


def custom_exception_handler(exc: Exception, context: dict[str, Any]) -> Response:
    if isinstance(exc, AppError):
        payload: dict[str, Any] = {"message": exc.message}
        if exc.errors:
            payload["errors"] = exc.errors
        return Response(payload, status=exc.status_code)

    if isinstance(exc, ValidationError):
        return Response(
            {
                "message": "Erro de validação nos dados enviados.",
                "errors": _flatten_drf_errors(exc.detail),
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    if isinstance(exc, (NotAuthenticated, AuthenticationFailed, InvalidToken, TokenError)):
        return Response(
            {"message": "Token de autenticação inválido ou expirado."},
            status=status.HTTP_401_UNAUTHORIZED,
        )

    if isinstance(exc, (Http404, NotFound)):
        return Response(
            {"message": "Registro não encontrado."},
            status=status.HTTP_404_NOT_FOUND,
        )

    if isinstance(exc, (ProtectedError, RestrictedError)):
        return Response(
            {
                "message": "Não é possível concluir a operação pois existem registros vinculados.",
            },
            status=status.HTTP_409_CONFLICT,
        )

    if isinstance(exc, IntegrityError):
        return Response(
            {"message": "Já existe um registro com os dados informados."},
            status=status.HTTP_409_CONFLICT,
        )

    response = exception_handler(exc, context)
    if response is not None:
        detail = response.data.get("detail") if isinstance(response.data, dict) else None
        return Response(
            {"message": str(detail or "Erro ao processar requisição.")},
            status=response.status_code,
        )

    return Response(
        {"message": "Erro interno do servidor."},
        status=status.HTTP_500_INTERNAL_SERVER_ERROR,
    )
