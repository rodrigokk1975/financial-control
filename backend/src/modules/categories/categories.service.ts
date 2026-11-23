import type { TransactionType } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { AppError } from '../../errors/AppError';
import type { CreateCategoryInput, UpdateCategoryInput } from './categories.schemas';

export async function listCategories(userId: string, type?: TransactionType) {
  const categories = await prisma.category.findMany({
    where: {
      userId,
      ...(type ? { type } : {}),
    },
    orderBy: [{ type: 'asc' }, { name: 'asc' }],
    include: {
      _count: {
        select: { transactions: true },
      },
    },
  });

  return categories.map((category) => ({
    id: category.id,
    name: category.name,
    type: category.type,
    color: category.color,
    icon: category.icon,
    transactionCount: category._count.transactions,
    createdAt: category.createdAt,
  }));
}

export async function createCategory(userId: string, input: CreateCategoryInput) {
  const category = await prisma.category.create({
    data: {
      userId,
      name: input.name,
      type: input.type,
      color: input.color,
      icon: input.icon,
    },
  });

  return {
    id: category.id,
    name: category.name,
    type: category.type,
    color: category.color,
    icon: category.icon,
    transactionCount: 0,
    createdAt: category.createdAt,
  };
}

export async function updateCategory(
  userId: string,
  categoryId: string,
  input: UpdateCategoryInput
) {
  const existing = await prisma.category.findFirst({
    where: { id: categoryId, userId },
    include: {
      _count: { select: { transactions: true } },
    },
  });

  if (!existing) {
    throw new AppError('Categoria não encontrada.', 404);
  }

  if (
    input.type &&
    input.type !== existing.type &&
    existing._count.transactions > 0
  ) {
    throw new AppError(
      'Não é possível alterar o tipo de uma categoria que já possui transações.',
      409
    );
  }

  const updated = await prisma.category.update({
    where: { id: categoryId },
    data: {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.type !== undefined ? { type: input.type } : {}),
      ...(input.color !== undefined ? { color: input.color } : {}),
      ...(input.icon !== undefined ? { icon: input.icon } : {}),
    },
  });

  return {
    id: updated.id,
    name: updated.name,
    type: updated.type,
    color: updated.color,
    icon: updated.icon,
    transactionCount: existing._count.transactions,
    createdAt: updated.createdAt,
  };
}

export async function deleteCategory(userId: string, categoryId: string) {
  const existing = await prisma.category.findFirst({
    where: { id: categoryId, userId },
    include: {
      _count: { select: { transactions: true } },
    },
  });

  if (!existing) {
    throw new AppError('Categoria não encontrada.', 404);
  }

  if (existing._count.transactions > 0) {
    throw new AppError(
      'Não é possível excluir uma categoria que possui transações vinculadas.',
      409
    );
  }

  await prisma.category.delete({
    where: { id: categoryId },
  });
}
