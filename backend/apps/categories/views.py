from __future__ import annotations

from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.categories.serializers import (
    CreateCategorySerializer,
    ListCategoriesQuerySerializer,
    UpdateCategorySerializer,
)
from apps.categories.services import (
    create_category,
    delete_category,
    list_categories,
    update_category,
)


class CategoryListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request: Request) -> Response:
        query_serializer = ListCategoriesQuerySerializer(data=request.query_params)
        query_serializer.is_valid(raise_exception=True)
        categories = list_categories(
            request.user,
            category_type=query_serializer.validated_data.get("type"),
        )
        return Response({"categories": categories}, status=status.HTTP_200_OK)

    def post(self, request: Request) -> Response:
        serializer = CreateCategorySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        category = create_category(request.user, serializer.validated_data)
        return Response({"category": category}, status=status.HTTP_201_CREATED)


class CategoryDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def put(self, request: Request, category_id: str) -> Response:
        serializer = UpdateCategorySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        category = update_category(request.user, category_id, serializer.validated_data)
        return Response({"category": category}, status=status.HTTP_200_OK)

    def delete(self, request: Request, category_id: str) -> Response:
        delete_category(request.user, category_id)
        return Response(status=status.HTTP_204_NO_CONTENT)
