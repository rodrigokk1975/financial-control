export type AccountType =
  | 'CHECKING'
  | 'SAVINGS'
  | 'CREDIT_CARD'
  | 'CASH'
  | 'INVESTMENT';

export type TransactionType = 'INCOME' | 'EXPENSE';

export interface User {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  initialBalance: number;
  currentBalance: number;
  color: string;
  transactionCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  type: TransactionType;
  color: string;
  icon: string;
  transactionCount: number;
  createdAt: string;
}

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  description: string;
  date: string;
  accountId: string;
  categoryId: string;
  account: {
    id: string;
    name: string;
    type: AccountType;
    color: string;
  };
  category: {
    id: string;
    name: string;
    type: TransactionType;
    color: string;
    icon: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface TransactionsResponse {
  transactions: Transaction[];
  summary: {
    totalIncome: number;
    totalExpense: number;
    netBalance: number;
  };
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface DashboardSummary {
  period: {
    startDate: string;
    endDate: string;
  };
  kpis: {
    totalBalance: number;
    periodIncome: number;
    periodExpense: number;
    periodBalance: number;
    savingsRate: number;
  };
  expensesByCategory: Array<{
    categoryId: string;
    name: string;
    color: string;
    icon: string;
    total: number;
    percentage: number;
  }>;
  monthlyEvolution: Array<{
    key: string;
    label: string;
    income: number;
    expense: number;
    balance: number;
  }>;
  accounts: Account[];
  recentTransactions: Array<{
    id: string;
    type: TransactionType;
    amount: number;
    description: string;
    date: string;
    account: { id: string; name: string; color: string; type: AccountType };
    category: { id: string; name: string; color: string; icon: string; type: TransactionType };
  }>;
}

export const ACCOUNT_TYPE_LABELS: Record<AccountType, string> = {
  CHECKING: 'Conta Corrente',
  SAVINGS: 'Poupança',
  CREDIT_CARD: 'Cartão de Crédito',
  CASH: 'Dinheiro',
  INVESTMENT: 'Investimento',
};
