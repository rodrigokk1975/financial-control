import { TransactionType } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { AppError } from '../../errors/AppError';
import type { CreateAccountInput, UpdateAccountInput } from './accounts.schemas';

export async function listAccounts(userId: string) {
  const [accounts, grouped] = await Promise.all([
    prisma.account.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
      include: {
        _count: {
          select: { transactions: true },
        },
      },
    }),
    prisma.transaction.groupBy({
      by: ['accountId', 'type'],
      where: { userId },
      _sum: { amount: true },
    }),
  ]);

  const totalsByAccount = new Map<string, { income: number; expense: number }>();

  for (const row of grouped) {
    const entry = totalsByAccount.get(row.accountId) ?? { income: 0, expense: 0 };
    const value = Number(row._sum.amount ?? 0);
    if (row.type === TransactionType.INCOME) {
      entry.income += value;
    } else {
      entry.expense += value;
    }
    totalsByAccount.set(row.accountId, entry);
  }

  return accounts.map((account) => {
    const totals = totalsByAccount.get(account.id) ?? { income: 0, expense: 0 };
    const initialBalance = Number(account.initialBalance);
    const currentBalance = Number((initialBalance + totals.income - totals.expense).toFixed(2));

    return {
      id: account.id,
      name: account.name,
      type: account.type,
      initialBalance,
      currentBalance,
      color: account.color,
      transactionCount: account._count.transactions,
      createdAt: account.createdAt,
      updatedAt: account.updatedAt,
    };
  });
}

export async function createAccount(userId: string, input: CreateAccountInput) {
  const account = await prisma.account.create({
    data: {
      userId,
      name: input.name,
      type: input.type,
      initialBalance: input.initialBalance,
      color: input.color,
    },
  });

  const initialBalance = Number(account.initialBalance);

  return {
    id: account.id,
    name: account.name,
    type: account.type,
    initialBalance,
    currentBalance: initialBalance,
    color: account.color,
    transactionCount: 0,
    createdAt: account.createdAt,
    updatedAt: account.updatedAt,
  };
}

export async function updateAccount(
  userId: string,
  accountId: string,
  input: UpdateAccountInput
) {
  const existing = await prisma.account.findFirst({
    where: { id: accountId, userId },
  });

  if (!existing) {
    throw new AppError('Conta não encontrada.', 404);
  }

  const updated = await prisma.account.update({
    where: { id: accountId },
    data: {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.type !== undefined ? { type: input.type } : {}),
      ...(input.initialBalance !== undefined
        ? { initialBalance: input.initialBalance }
        : {}),
      ...(input.color !== undefined ? { color: input.color } : {}),
    },
  });

  const accounts = await listAccounts(userId);
  return accounts.find((a) => a.id === updated.id)!;
}

export async function deleteAccount(userId: string, accountId: string) {
  const existing = await prisma.account.findFirst({
    where: { id: accountId, userId },
    include: {
      _count: { select: { transactions: true } },
    },
  });

  if (!existing) {
    throw new AppError('Conta não encontrada.', 404);
  }

  if (existing._count.transactions > 0) {
    throw new AppError(
      'Não é possível excluir uma conta que possui transações vinculadas.',
      409
    );
  }

  await prisma.account.delete({
    where: { id: accountId },
  });
}
