import {
  ArrowDownLeft,
  ArrowRight,
  ArrowUpRight,
  Calendar,
  ChevronLeft,
  ChevronRight,
  PiggyBank,
  Plus,
  TrendingDown,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { TransactionModal } from '@/components/transactions/TransactionModal';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { formatCurrency, formatDate, getApiErrorMessage } from '@/lib/utils';
import { api } from '@/services/api';
import {
  ACCOUNT_TYPE_LABELS,
  type Category,
  type DashboardSummary,
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

function CurrencyTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
}) {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div className="rounded-xl border border-white/10 bg-surface-950/95 backdrop-blur-md px-3.5 py-2.5 shadow-2xl text-xs space-y-1.5">
      {label && <p className="font-semibold text-slate-200 mb-1">{label}</p>}
      {payload.map((entry) => (
        <div
          key={entry.name}
          className="flex items-center justify-between gap-4"
        >
          <span className="flex items-center gap-1.5 text-slate-400">
            <span
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            {entry.name}
          </span>
          <span className="font-semibold text-slate-100 tabular-nums-mono">
            {formatCurrency(Number(entry.value))}
          </span>
        </div>
      ))}
    </div>
  );
}

export function DashboardPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const now = new Date();

  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    try {
      const [dashRes, catRes] = await Promise.all([
        api.get<DashboardSummary>('/dashboard/summary', {
          params: { month, year },
        }),
        api.get<{ categories: Category[] }>('/categories'),
      ]);
      setSummary(dashRes.data);
      setCategories(catRes.data.categories);
    } catch (error) {
      toast({
        variant: 'error',
        title: 'Erro ao carregar dashboard',
        description: getApiErrorMessage(error),
      });
    } finally {
      setLoading(false);
    }
  }, [month, year, toast]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const shiftMonth = (delta: number) => {
    const next = new Date(year, month - 1 + delta, 1);
    setMonth(next.getMonth() + 1);
    setYear(next.getFullYear());
  };

  const firstName = user?.name?.split(' ')[0] || 'Olá';
  const kpis = summary?.kpis ?? {
    totalBalance: 0,
    periodIncome: 0,
    periodExpense: 0,
    periodBalance: 0,
    savingsRate: 0,
  };

  return (
    <div className="space-y-6">
      {/* Header & Period Switcher */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white">
            Olá, {firstName}
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">
            Visão consolidada da sua saúde financeira em {MONTH_NAMES[month - 1]} de {year}.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="inline-flex items-center gap-1 rounded-xl border border-white/10 bg-surface-900 px-2 py-1">
            <button
              type="button"
              onClick={() => shiftMonth(-1)}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-white/5 hover:text-white transition-colors"
              aria-label="Mês anterior"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="min-w-[140px] text-center text-xs font-semibold text-slate-100 flex items-center justify-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-emerald-400" />
              {MONTH_NAMES[month - 1]} {year}
            </span>
            <button
              type="button"
              onClick={() => shiftMonth(1)}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-white/5 hover:text-white transition-colors"
              aria-label="Próximo mês"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <Button onClick={() => setModalOpen(true)}>
            <Plus className="h-4 w-4" />
            Nova transação
          </Button>
        </div>
      </div>

      {/* 4 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-surface-900 via-surface-900 to-emerald-950/40 border-emerald-500/20">
          <CardContent className="p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400">
                Saldo Total Consolidado
              </span>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400">
                <Wallet className="h-4 w-4" />
              </div>
            </div>
            {loading ? (
              <div className="h-8 w-36 rounded-lg bg-white/5 animate-pulse" />
            ) : (
              <p className="text-2xl font-extrabold text-white tabular-nums-mono">
                {formatCurrency(kpis.totalBalance)}
              </p>
            )}
            <p className="text-[11px] text-slate-400">
              Em {summary?.accounts.length ?? 0} conta(s) ativa(s)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400">
                Receitas no Período
              </span>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
                <TrendingUp className="h-4 w-4" />
              </div>
            </div>
            {loading ? (
              <div className="h-8 w-32 rounded-lg bg-white/5 animate-pulse" />
            ) : (
              <p className="text-2xl font-extrabold text-emerald-400 tabular-nums-mono">
                {formatCurrency(kpis.periodIncome)}
              </p>
            )}
            <p className="text-[11px] text-slate-500">
              Entradas confirmadas no mês
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400">
                Despesas no Período
              </span>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-500/10 text-rose-400">
                <TrendingDown className="h-4 w-4" />
              </div>
            </div>
            {loading ? (
              <div className="h-8 w-32 rounded-lg bg-white/5 animate-pulse" />
            ) : (
              <p className="text-2xl font-extrabold text-rose-400 tabular-nums-mono">
                {formatCurrency(kpis.periodExpense)}
              </p>
            )}
            <p className="text-[11px] text-slate-500">
              Saídas registradas no mês
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400">
                Balanço do Período
              </span>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-500/10 text-sky-400">
                <PiggyBank className="h-4 w-4" />
              </div>
            </div>
            {loading ? (
              <div className="h-8 w-32 rounded-lg bg-white/5 animate-pulse" />
            ) : (
              <p
                className={`text-2xl font-extrabold tabular-nums-mono ${
                  kpis.periodBalance >= 0 ? 'text-white' : 'text-rose-400'
                }`}
              >
                {formatCurrency(kpis.periodBalance)}
              </p>
            )}
            <div className="flex items-center gap-2 text-[11px]">
              <span
                className={`font-semibold px-2 py-0.5 rounded-full ${
                  kpis.savingsRate >= 0
                    ? 'bg-emerald-500/10 text-emerald-300'
                    : 'bg-rose-500/10 text-rose-300'
                }`}
              >
                {kpis.savingsRate}% de economia
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Bar Chart — 6 Month Evolution */}
        <Card className="lg:col-span-7">
          <CardHeader>
            <div>
              <CardTitle>Receitas vs. Despesas</CardTitle>
              <p className="text-xs text-slate-400 mt-0.5">
                Evolução mensal dos últimos 6 meses
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-400">
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-sm bg-emerald-500" />
                Receitas
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-sm bg-rose-500" />
                Despesas
              </span>
            </div>
          </CardHeader>
          <CardContent className="h-72">
            {loading ? (
              <div className="h-full w-full rounded-xl bg-white/[0.03] animate-pulse" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={summary?.monthlyEvolution ?? []}
                  margin={{ top: 10, right: 8, left: -12, bottom: 0 }}
                  barGap={6}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgba(255,255,255,0.06)"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="label"
                    tick={{ fill: '#94a3b8', fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: '#64748b', fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) =>
                      v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)
                    }
                  />
                  <Tooltip
                    content={<CurrencyTooltip />}
                    cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                  />
                  <Bar
                    dataKey="income"
                    name="Receitas"
                    fill="#10b981"
                    radius={[6, 6, 0, 0]}
                    maxBarSize={26}
                  />
                  <Bar
                    dataKey="expense"
                    name="Despesas"
                    fill="#f43f5e"
                    radius={[6, 6, 0, 0]}
                    maxBarSize={26}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Donut Chart — Expenses by Category */}
        <Card className="lg:col-span-5">
          <CardHeader>
            <div>
              <CardTitle>Despesas por Categoria</CardTitle>
              <p className="text-xs text-slate-400 mt-0.5">
                Distribuição de gastos em {MONTH_NAMES[month - 1]}
              </p>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-64 w-full rounded-xl bg-white/[0.03] animate-pulse" />
            ) : !summary || summary.expensesByCategory.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center text-center px-4">
                <p className="text-sm font-semibold text-slate-200">
                  Sem despesas neste período
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Quando você registrar despesas, a distribuição por categoria aparecerá aqui.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="h-48 relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={summary.expensesByCategory}
                        dataKey="total"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={56}
                        outerRadius={82}
                        paddingAngle={3}
                        stroke="none"
                      >
                        {summary.expensesByCategory.map((entry) => (
                          <Cell key={entry.categoryId} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value: number) => formatCurrency(value)}
                        contentStyle={{
                          backgroundColor: '#070b14',
                          borderColor: 'rgba(255,255,255,0.1)',
                          borderRadius: '0.75rem',
                          fontSize: '12px',
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-[10px] uppercase tracking-wider text-slate-500">
                      Total
                    </span>
                    <span className="text-sm font-bold text-white tabular-nums-mono">
                      {formatCurrency(kpis.periodExpense)}
                    </span>
                  </div>
                </div>

                <div className="space-y-2.5 max-h-36 overflow-y-auto pr-1">
                  {summary.expensesByCategory.map((cat) => (
                    <div key={cat.categoryId} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="flex items-center gap-2 text-slate-200 font-medium truncate">
                          <span
                            className="h-2.5 w-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: cat.color }}
                          />
                          {cat.name}
                        </span>
                        <span className="text-slate-300 tabular-nums-mono shrink-0">
                          {formatCurrency(cat.total)}{' '}
                          <span className="text-slate-500">
                            ({cat.percentage}%)
                          </span>
                        </span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-white/[0.06] overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${Math.min(100, cat.percentage)}%`,
                            backgroundColor: cat.color,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row — Recent Transactions & Accounts Snapshot */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <Card className="lg:col-span-7">
          <CardHeader>
            <CardTitle>Transações Recentes</CardTitle>
            <Link
              to="/transactions"
              className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition-colors"
            >
              Ver todas
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="h-12 rounded-xl bg-white/[0.03] animate-pulse"
                  />
                ))}
              </div>
            ) : !summary || summary.recentTransactions.length === 0 ? (
              <p className="py-10 text-center text-sm text-slate-400">
                Nenhuma movimentação registrada neste período.
              </p>
            ) : (
              <div className="divide-y divide-white/[0.05]">
                {summary.recentTransactions.map((tx) => (
                  <div
                    key={tx.id}
                    className="py-3 flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
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
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-100 truncate">
                          {tx.description}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <Badge color={tx.category.color} className="text-[10px] py-0">
                            {tx.category.name}
                          </Badge>
                          <span className="text-[11px] text-slate-500">
                            {tx.account.name} • {formatDate(tx.date)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <span
                      className={`text-sm font-semibold tabular-nums-mono whitespace-nowrap ${
                        tx.type === 'INCOME'
                          ? 'text-emerald-400'
                          : 'text-rose-400'
                      }`}
                    >
                      {tx.type === 'INCOME' ? '+' : '-'}{' '}
                      {formatCurrency(tx.amount)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-5">
          <CardHeader>
            <CardTitle>Suas Contas</CardTitle>
            <Link
              to="/accounts"
              className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition-colors"
            >
              Gerenciar
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-14 rounded-xl bg-white/[0.03] animate-pulse"
                  />
                ))}
              </div>
            ) : !summary || summary.accounts.length === 0 ? (
              <p className="py-10 text-center text-sm text-slate-400">
                Nenhuma conta cadastrada ainda.
              </p>
            ) : (
              <div className="space-y-2.5">
                {summary.accounts.map((acc) => (
                  <div
                    key={acc.id}
                    className="flex items-center justify-between gap-3 rounded-xl border border-white/[0.06] bg-surface-950/60 px-4 py-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span
                        className="h-3 w-3 rounded-full shrink-0"
                        style={{ backgroundColor: acc.color }}
                      />
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-100 truncate">
                          {acc.name}
                        </p>
                        <p className="text-[11px] text-slate-500">
                          {ACCOUNT_TYPE_LABELS[acc.type]}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`text-sm font-bold tabular-nums-mono whitespace-nowrap ${
                        acc.currentBalance < 0 ? 'text-rose-400' : 'text-white'
                      }`}
                    >
                      {formatCurrency(acc.currentBalance)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <TransactionModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSaved={fetchDashboard}
        accounts={summary?.accounts ?? []}
        categories={categories}
      />
    </div>
  );
}
