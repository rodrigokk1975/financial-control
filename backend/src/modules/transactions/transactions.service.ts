import { Prisma, TransactionType } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { AppError } from '../../errors/AppError';
import { resolveDateRange } from '../../utils/period';
import type {
  CreateTransactionInput,
  ListTransactionsQuery,
  UpdateTransactionInput,
} from './transactions.schemas';

const transactionInclude = {
  account: {
    select: {
      id: true,
      name: true,
      type: true,
      color: true,
    },
  },
  category: {
    select: {
      id: true,
      name: true,
      type: true,
      color: true,
      icon: true,
    },
  },
} as const;

function serializeTransaction(
  tx: Prisma.TransactionGetPayload<{ include: typeof transactionInclude }>
) {
  return {
    id: tx.id,
    type: tx.type,
    amount: Number(tx.amount),
    description: tx.description,
    date: tx.date,
    accountId: tx.accountId,
    categoryId: tx.categoryId,
    account: tx.account,
    category: tx.category,
    createdAt: tx.createdAt,
    updatedAt: tx.updatedAt,
  };
}

async function validateOwnershipAndType(
  userId: string,
  accountId: string,
  categoryId: string,
  type: TransactionType
) {
  const [account, category] = await Promise.all([
    prisma.account.findFirst({ where: { id: accountId, userId } }),
    prisma.category.findFirst({ where: { id: categoryId, userId } }),
  ]);

  if (!account) {
    throw new AppError('Conta não encontrada para este usuário.', 404);
  }

  if (!category) {
    throw new AppError('Categoria não encontrada para este usuário.', 404);
  }

  if (category.type !== type) {
    throw new AppError(
      'O tipo da categoria selecionada não corresponde ao tipo da transação.',
      400
    );
  }
}

export async function listTransactions(userId: string, query: ListTransactionsQuery) {
  const range = resolveDateRange({
    month: query.month,
    year: query.year,
    startDate: query.startDate,
    endDate: query.endDate,
  });

  const where: Prisma.TransactionWhereInput = {
    userId,
    ...(range ? { date: { gte: range.start, lte: range.end } } : {}),
    ...(query.type ? { type: query.type } : {}),
    ...(query.accountId ? { accountId: query.accountId } : {}),
    ...(query.categoryId ? { categoryId: query.categoryId } : {}),
    ...(query.search
      ? {
          description: {
            contains: query.search,
            mode: 'insensitive',
          },
        }
      : {}),
  };

  const skip = (query.page - 1) * query.limit;

  const [items, total, groupedTotals] = await Promise.all([
    prisma.transaction.findMany({
      where,
      include: transactionInclude,
      orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
      skip,
      take: query.limit,
    }),
    prisma.transaction.count({ where }),
    prisma.transaction.groupBy({
      by: ['type'],
      where,
      _sum: { amount: true },
    }),
  ]);

  let totalIncome = 0;
  let totalExpense = 0;

  for (const row of groupedTotals) {
    const val = Number(row._sum.amount ?? 0);
    if (row.type === TransactionType.INCOME) {
      totalIncome = val;
    } else {
      totalExpense = val;
    }
  }

  return {
    transactions: items.map(serializeTransaction),
    summary: {
      totalIncome: Number(totalIncome.toFixed(2)),
      totalExpense: Number(totalExpense.toFixed(2)),
      netBalance: Number((totalIncome - totalExpense).toFixed(2)),
    },
    pagination: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / query.limit)),
    },
  };
}

export async function createTransaction(
  userId: string,
  input: CreateTransactionInput
) {
  await validateOwnershipAndType(
    userId,
    input.accountId,
    input.categoryId,
    input.type
  );

  const created = await prisma.transaction.create({
    data: {
      userId,
      accountId: input.accountId,
      categoryId: input.categoryId,
      type: input.type,
      amount: input.amount,
      description: input.description,
      date: input.date,
    },
    include: transactionInclude,
  });

  return serializeTransaction(created);
}

export async function updateTransaction(
  userId: string,
  transactionId: string,
  input: UpdateTransactionInput
) {
  const existing = await prisma.transaction.findFirst({
    where: { id: transactionId, userId },
  });

  if (!existing) {
    throw new AppError('Transação não encontrada.', 404);
  }

  const nextAccountId = input.accountId ?? existing.accountId;
  const nextCategoryId = input.categoryId ?? existing.categoryId;
  const nextType = input.type ?? existing.type;

  await validateOwnershipAndType(userId, nextAccountId, nextCategoryId, nextType);

  const updated = await prisma.transaction.update({
    where: { id: transactionId },
    data: {
      accountId: nextAccountId,
      categoryId: nextCategoryId,
      type: nextType,
      ...(input.amount !== undefined ? { amount: input.amount } : {}),
      ...(input.description !== undefined ? { description: input.description } : {}),
      ...(input.date !== undefined ? { date: input.date } : {}),
    },
    include: transactionInclude,
  });

  return serializeTransaction(updated);
}

export async function deleteTransaction(userId: string, transactionId: string) {
  const existing = await prisma.transaction.findFirst({
    where: { id: transactionId, userId },
  });

  if (!existing) {
    throw new AppError('Transação não encontrada.', 404);
  }

  await prisma.transaction.delete({
    where: { id: transactionId },
  });
}
