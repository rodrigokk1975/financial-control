import {
  ArrowDownLeft,
  ArrowUpRight,
  Calendar,
  ChevronLeft,
  ChevronRight,
  FilterX,
  Pencil,
  Plus,
  Search,
  Trash2,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { TransactionModal } from '@/components/transactions/TransactionModal';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Input, Select } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/contexts/ToastContext';
import { formatCurrency, formatDate, getApiErrorMessage } from '@/lib/utils';
import { api } from '@/services/api';
import type {
  Account,
  Category,
  Transaction,
  TransactionsResponse,
  TransactionType,
} from '@/types/finance';

const MONTH_NAMES = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
];

export function TransactionsPage() {
  const { toast } = useToast();
  const now = new Date();

  const [periodMode, setPeriodMode] = useState<'month' | 'range'>('month');
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const [typeFilter, setTypeFilter] = useState<'' | TransactionType>('');
  const [accountFilter, setAccountFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const [data, setData] = useState<TransactionsResponse | null>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [deleting, setDeleting] = useState<Transaction | null>(null);
  const [deletingBusy, setDeletingBusy] = useState(false);

  const loadMetadata = useCallback(async () => {
    try {
      const [accRes, catRes] = await Promise.all([
        api.get<{ accounts: Account[] }>('/accounts'),
        api.get<{ categories: Category[] }>('/categories'),
      ]);
      setAccounts(accRes.data.accounts);
      setCategories(catRes.data.categories);
    } catch {
      // Handled gracefully when fetching transactions
    }
  }, []);

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { page, limit: 12 };
      if (periodMode === 'month') {
        params.month = month;
        params.year = year;
      } else {
        if (startDate) params.startDate = startDate;
        if (endDate) params.endDate = endDate;
      }
      if (typeFilter) params.type = typeFilter;
      if (accountFilter) params.accountId = accountFilter;
      if (categoryFilter) params.categoryId = categoryFilter;
      if (search.trim()) params.search = search.trim();

      const res = await api.get<TransactionsResponse>('/transactions', { params });
      setData(res.data);
    } catch (error) {
      toast({
        variant: 'error',
        title: 'Erro ao carregar transações',
        description: getApiErrorMessage(error),
      });
    } finally {
      setLoading(false);
    }
  }, [
    page,
    periodMode,
    month,
    year,
    startDate,
    endDate,
    typeFilter,
    accountFilter,
    categoryFilter,
    search,
    toast,
  ]);

  useEffect(() => {
    loadMetadata();
  }, [loadMetadata]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const shiftMonth = (delta: number) => {
    const next = new Date(year, month - 1 + delta, 1);
    setMonth(next.getMonth() + 1);
    setYear(next.getFullYear());
    setPage(1);
  };

  const resetFilters = () => {
    setPeriodMode('month');
    setMonth(now.getMonth() + 1);
    setYear(now.getFullYear());
    setStartDate('');
    setEndDate('');
    setTypeFilter('');
    setAccountFilter('');
    setCategoryFilter('');
    setSearch('');
    setPage(1);
  };

  const handleDelete = async () => {
    if (!deleting) return;
    setDeletingBusy(true);
    try {
      await api.delete(`/transactions/${deleting.id}`);
      toast({ variant: 'success', title: 'Transação excluída.' });
      setDeleting(null);
      await fetchTransactions();
    } catch (error) {
      toast({
        variant: 'error',
        title: 'Erro ao excluir',
        description: getApiErrorMessage(error),
      });
    } finally {
      setDeletingBusy(false);
    }
  };

  const transactions = data?.transactions ?? [];
  const summary = data?.summary ?? {
    totalIncome: 0,
    totalExpense: 0,
    netBalance: 0,
  };
  const pagination = data?.pagination ?? {
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 1,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white">
            Transações
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">
            Consulte, filtre por período e gerencie todos os seus lançamentos.
          </p>
        </div>
        <Button
          onClick={() => {
            setEditing(null);
            setModalOpen(true);
          }}
        >
          <Plus className="h-4 w-4" />
          Nova transação
        </Button>
      </div>

      {/* Filtered Summary Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-400">Receitas no filtro</p>
              <p className="text-xl font-bold text-emerald-400 tabular-nums-mono mt-0.5">
                {formatCurrency(summary.totalIncome)}
              </p>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
              <ArrowUpRight className="h-4 w-4" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-400">Despesas no filtro</p>
              <p className="text-xl font-bold text-rose-400 tabular-nums-mono mt-0.5">
                {formatCurrency(summary.totalExpense)}
              </p>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-500/10 text-rose-400">
              <ArrowDownLeft className="h-4 w-4" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-400">Balanço do filtro</p>
              <p
                className={`text-xl font-bold tabular-nums-mono mt-0.5 ${
                  summary.netBalance >= 0 ? 'text-white' : 'text-rose-400'
                }`}
              >
                {formatCurrency(summary.netBalance)}
              </p>
            </div>
            <span className="text-xs text-slate-400 bg-white/5 px-2.5 py-1 rounded-full">
              {pagination.total} item(s)
            </span>
          </CardContent>
        </Card>
      </div>

      {/* Filters Card */}
      <Card>
        <CardContent className="p-4 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="inline-flex rounded-xl border border-white/10 bg-surface-950 p-1">
                <button
                  type="button"
                  onClick={() => {
                    setPeriodMode('month');
                    setPage(1);
                  }}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                    periodMode === 'month'
                      ? 'bg-emerald-500 text-slate-950'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Mês
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPeriodMode('range');
                    setPage(1);
                  }}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                    periodMode === 'range'
                      ? 'bg-emerald-500 text-slate-950'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Intervalo
                </button>
              </div>

              {periodMode === 'month' ? (
                <div className="inline-flex items-center gap-1 rounded-xl border border-white/10 bg-surface-950 px-2 py-1">
                  <button
                    type="button"
                    onClick={() => shiftMonth(-1)}
                    className="rounded-lg p-1 text-slate-400 hover:bg-white/5 hover:text-white"
                    aria-label="Mês anterior"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <span className="min-w-[130px] text-center text-xs font-semibold text-slate-100 flex items-center justify-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 text-emerald-400" />
                    {MONTH_NAMES[month - 1]} {year}
                  </span>
                  <button
                    type="button"
                    onClick={() => shiftMonth(1)}
                    className="rounded-lg p-1 text-slate-400 hover:bg-white/5 hover:text-white"
                    aria-label="Próximo mês"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div className="flex flex-wrap items-center gap-2">
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => {
                      setStartDate(e.target.value);
                      setPage(1);
                    }}
                    className="w-40 h-9 text-xs"
                  />
                  <span className="text-xs text-slate-500">até</span>
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => {
                      setEndDate(e.target.value);
                      setPage(1);
                    }}
                    className="w-40 h-9 text-xs"
                  />
                </div>
              )}
            </div>

            <Button variant="ghost" size="sm" onClick={resetFilters}>
              <FilterX className="h-3.5 w-3.5" />
              Limpar filtros
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="relative">
              <Search className="h-4 w-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <Input
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder="Buscar descrição..."
                className="pl-9 h-9 text-xs"
              />
            </div>

            <Select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value as '' | TransactionType);
                setPage(1);
              }}
              className="h-9 text-xs"
            >
              <option value="" className="bg-surface-900">
                Todos os tipos
              </option>
              <option value="INCOME" className="bg-surface-900">
                Apenas Receitas
              </option>
              <option value="EXPENSE" className="bg-surface-900">
                Apenas Despesas
              </option>
            </Select>

            <Select
              value={accountFilter}
              onChange={(e) => {
                setAccountFilter(e.target.value);
                setPage(1);
              }}
              className="h-9 text-xs"
            >
              <option value="" className="bg-surface-900">
                Todas as contas
              </option>
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id} className="bg-surface-900">
                  {acc.name}
                </option>
              ))}
            </Select>

            <Select
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setPage(1);
              }}
              className="h-9 text-xs"
            >
              <option value="" className="bg-surface-900">
                Todas as categorias
              </option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id} className="bg-surface-900">
                  {cat.name}
                </option>
              ))}
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Transactions Table */}
      <Card className="overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="h-12 rounded-xl bg-white/[0.04] animate-pulse"
              />
            ))}
          </div>
        ) : transactions.length === 0 ? (
          <div className="py-16 text-center space-y-3 px-4">
            <p className="text-base font-semibold text-white">
              Nenhuma transação encontrada neste período
            </p>
            <p className="text-sm text-slate-400 max-w-sm mx-auto">
              Ajuste os filtros acima ou clique em "Nova transação" para registrar uma movimentação.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/[0.06] text-[11px] uppercase tracking-wider text-slate-500">
                  <th className="py-3.5 px-5 font-semibold">Descrição</th>
                  <th className="py-3.5 px-4 font-semibold">Categoria</th>
                  <th className="py-3.5 px-4 font-semibold">Conta</th>
                  <th className="py-3.5 px-4 font-semibold">Data</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Valor</th>
                  <th className="py-3.5 px-5 font-semibold text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.05] text-sm">
                {transactions.map((tx) => (
                  <tr
                    key={tx.id}
                    className="hover:bg-white/[0.025] transition-colors"
                  >
                    <td className="py-3.5 px-5 font-medium text-slate-100">
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                            tx.type === 'INCOME'
                              ? 'bg-emerald-500/15 text-emerald-400'
                              : 'bg-rose-500/15 text-rose-400'
                          }`}
                        >
                          {tx.type === 'INCOME' ? (
                            <ArrowUpRight className="h-4 w-4" />
                          ) : (
                            <ArrowDownLeft className="h-4 w-4" />
                          )}
                        </div>
                        <span className="truncate max-w-[240px]">
                          {tx.description}
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge color={tx.category.color}>
                        <span
                          className="h-1.5 w-1.5 rounded-full"
                          style={{ backgroundColor: tx.category.color }}
                        />
                        {tx.category.name}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4 text-slate-300">
                      <span className="inline-flex items-center gap-2 text-xs">
                        <span
                          className="h-2 w-2 rounded-full"
                          style={{ backgroundColor: tx.account.color }}
                        />
                        {tx.account.name}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-400 whitespace-nowrap">
                      {formatDate(tx.date)}
                    </td>
                    <td
                      className={`py-3.5 px-4 text-right font-semibold tabular-nums-mono whitespace-nowrap ${
                        tx.type === 'INCOME'
                          ? 'text-emerald-400'
                          : 'text-rose-400'
                      }`}
                    >
                      {tx.type === 'INCOME' ? '+' : '-'}{' '}
                      {formatCurrency(tx.amount)}
                    </td>
                    <td className="py-3.5 px-5 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            setEditing(tx);
                            setModalOpen(true);
                          }}
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-white/5 hover:text-white"
                          aria-label="Editar transação"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleting(tx)}
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-500/15 hover:text-rose-300"
                          aria-label="Excluir transação"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-white/[0.06] px-5 py-3 text-xs text-slate-400">
            <span>
              Página {pagination.page} de {pagination.totalPages}
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                disabled={pagination.page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Anterior
              </Button>
              <Button
                variant="secondary"
                size="sm"
                disabled={pagination.page >= pagination.totalPages}
                onClick={() =>
                  setPage((p) => Math.min(pagination.totalPages, p + 1))
                }
              >
                Próxima
              </Button>
            </div>
          </div>
        )}
      </Card>

      <TransactionModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSaved={fetchTransactions}
        accounts={accounts}
        categories={categories}
        editing={editing}
      />

      <Modal
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        title="Excluir transação"
        description={`Deseja excluir "${deleting?.description}"? O saldo da conta será recalculado automaticamente.`}
      >
        <div className="flex justify-end gap-2.5 pt-2">
          <Button variant="secondary" onClick={() => setDeleting(null)}>
            Cancelar
          </Button>
          <Button variant="danger" onClick={handleDelete} disabled={deletingBusy}>
            {deletingBusy ? 'Excluindo...' : 'Excluir'}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
