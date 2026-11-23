import { TransactionType } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { resolveDateRange } from '../../utils/period';
import { listAccounts } from '../accounts/accounts.service';
import type { DashboardSummaryQuery } from './dashboard.schemas';

const MONTH_LABELS_PT = [
  'Jan',
  'Fev',
  'Mar',
  'Abr',
  'Mai',
  'Jun',
  'Jul',
  'Ago',
  'Set',
  'Out',
  'Nov',
  'Dez',
];

function getMonthKey(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

export async function getDashboardSummary(
  userId: string,
  query: DashboardSummaryQuery
) {
  const now = new Date();
  const defaultMonth = now.getUTCMonth() + 1;
  const defaultYear = now.getUTCFullYear();

  const resolvedRange =
    resolveDateRange(query) ??
    resolveDateRange({ month: defaultMonth, year: defaultYear })!;

  const anchorYear = resolvedRange.end.getUTCFullYear();
  const anchorMonth = resolvedRange.end.getUTCMonth();

  const sixMonthsStart = new Date(Date.UTC(anchorYear, anchorMonth - 5, 1, 0, 0, 0, 0));
  const sixMonthsEnd = new Date(Date.UTC(anchorYear, anchorMonth + 1, 0, 23, 59, 59, 999));

  const [accounts, periodTransactions, evolutionTransactions, recentTransactions] =
    await Promise.all([
      listAccounts(userId),
      prisma.transaction.findMany({
        where: {
          userId,
          date: {
            gte: resolvedRange.start,
            lte: resolvedRange.end,
          },
        },
        include: {
          category: {
            select: {
              id: true,
              name: true,
              color: true,
              icon: true,
            },
          },
        },
      }),
      prisma.transaction.findMany({
        where: {
          userId,
          date: {
            gte: sixMonthsStart,
            lte: sixMonthsEnd,
          },
        },
        select: {
          type: true,
          amount: true,
          date: true,
        },
      }),
      prisma.transaction.findMany({
        where: {
          userId,
          date: {
            gte: resolvedRange.start,
            lte: resolvedRange.end,
          },
        },
        include: {
          account: {
            select: { id: true, name: true, color: true, type: true },
          },
          category: {
            select: { id: true, name: true, color: true, icon: true, type: true },
          },
        },
        orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
        take: 6,
      }),
    ]);

  const totalBalance = Number(
    accounts.reduce((acc, item) => acc + item.currentBalance, 0).toFixed(2)
  );

  let periodIncome = 0;
  let periodExpense = 0;

  const categoryTotals = new Map<
    string,
    { categoryId: string; name: string; color: string; icon: string; total: number }
  >();

  for (const tx of periodTransactions) {
    const amount = Number(tx.amount);
    if (tx.type === TransactionType.INCOME) {
      periodIncome += amount;
    } else {
      periodExpense += amount;
      const existing = categoryTotals.get(tx.category.id);
      if (existing) {
        existing.total += amount;
      } else {
        categoryTotals.set(tx.category.id, {
          categoryId: tx.category.id,
          name: tx.category.name,
          color: tx.category.color,
          icon: tx.category.icon,
          total: amount,
        });
      }
    }
  }

  const periodBalance = Number((periodIncome - periodExpense).toFixed(2));
  const savingsRate =
    periodIncome > 0
      ? Number((((periodIncome - periodExpense) / periodIncome) * 100).toFixed(1))
      : 0;

  const expensesByCategory = Array.from(categoryTotals.values())
    .sort((a, b) => b.total - a.total)
    .map((item) => ({
      ...item,
      total: Number(item.total.toFixed(2)),
      percentage:
        periodExpense > 0
          ? Number(((item.total / periodExpense) * 100).toFixed(1))
          : 0,
    }));

  const monthlyMap = new Map<
    string,
    { key: string; label: string; income: number; expense: number }
  >();

  for (let offset = 5; offset >= 0; offset--) {
    const d = new Date(Date.UTC(anchorYear, anchorMonth - offset, 1));
    const key = getMonthKey(d);
    const label = `${MONTH_LABELS_PT[d.getUTCMonth()]}/${String(
      d.getUTCFullYear()
    ).slice(-2)}`;
    monthlyMap.set(key, { key, label, income: 0, expense: 0 });
  }

  for (const tx of evolutionTransactions) {
    const key = getMonthKey(tx.date);
    const bucket = monthlyMap.get(key);
    if (!bucket) continue;
    const amount = Number(tx.amount);
    if (tx.type === TransactionType.INCOME) {
      bucket.income += amount;
    } else {
      bucket.expense += amount;
    }
  }

  const monthlyEvolution = Array.from(monthlyMap.values()).map((item) => ({
    key: item.key,
    label: item.label,
    income: Number(item.income.toFixed(2)),
    expense: Number(item.expense.toFixed(2)),
    balance: Number((item.income - item.expense).toFixed(2)),
  }));

  return {
    period: {
      startDate: resolvedRange.start.toISOString(),
      endDate: resolvedRange.end.toISOString(),
    },
    kpis: {
      totalBalance,
      periodIncome: Number(periodIncome.toFixed(2)),
      periodExpense: Number(periodExpense.toFixed(2)),
      periodBalance,
      savingsRate,
    },
    expensesByCategory,
    monthlyEvolution,
    accounts,
    recentTransactions: recentTransactions.map((tx) => ({
      id: tx.id,
      type: tx.type,
      amount: Number(tx.amount),
      description: tx.description,
      date: tx.date,
      account: tx.account,
      category: tx.category,
    })),
  };
}
