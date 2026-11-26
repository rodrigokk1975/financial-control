from __future__ import annotations

from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.accounts.serializers import CreateAccountSerializer, UpdateAccountSerializer
from apps.accounts.services import (
    create_account,
    delete_account,
    list_accounts,
    update_account,
)


class AccountListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request: Request) -> Response:
        accounts = list_accounts(request.user)
        return Response({"accounts": accounts}, status=status.HTTP_200_OK)

    def post(self, request: Request) -> Response:
        serializer = CreateAccountSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        account = create_account(request.user, serializer.validated_data)
        return Response({"account": account}, status=status.HTTP_201_CREATED)


class AccountDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def put(self, request: Request, account_id: str) -> Response:
        serializer = UpdateAccountSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        account = update_account(request.user, account_id, serializer.validated_data)
        return Response({"account": account}, status=status.HTTP_200_OK)

    def delete(self, request: Request, account_id: str) -> Response:
        delete_account(request.user, account_id)
        return Response(status=status.HTTP_204_NO_CONTENT)
