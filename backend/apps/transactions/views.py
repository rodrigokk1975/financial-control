from __future__ import annotations

from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.transactions.serializers import (
    CreateTransactionSerializer,
    ListTransactionsQuerySerializer,
    UpdateTransactionSerializer,
)
from apps.transactions.services import (
    create_transaction,
    delete_transaction,
    list_transactions,
    update_transaction,
)


class TransactionListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request: Request) -> Response:
        query_serializer = ListTransactionsQuerySerializer(data=request.query_params)
        query_serializer.is_valid(raise_exception=True)
        result = list_transactions(request.user, query_serializer.validated_data)
        return Response(result, status=status.HTTP_200_OK)

    def post(self, request: Request) -> Response:
        serializer = CreateTransactionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        tx = create_transaction(request.user, serializer.validated_data)
        return Response({"transaction": tx}, status=status.HTTP_201_CREATED)


class TransactionDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def put(self, request: Request, transaction_id: str) -> Response:
        serializer = UpdateTransactionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        tx = update_transaction(request.user, transaction_id, serializer.validated_data)
        return Response({"transaction": tx}, status=status.HTTP_200_OK)

    def delete(self, request: Request, transaction_id: str) -> Response:
        delete_transaction(request.user, transaction_id)
        return Response(status=status.HTTP_204_NO_CONTENT)
