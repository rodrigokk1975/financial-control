import {
  Banknote,
  CreditCard,
  Landmark,
  Pencil,
  PiggyBank,
  Plus,
  Trash2,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { FieldLabel, Input, Select } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/contexts/ToastContext';
import { formatCurrency, getApiErrorMessage } from '@/lib/utils';
import { api } from '@/services/api';
import {
  ACCOUNT_TYPE_LABELS,
  type Account,
  type AccountType,
} from '@/types/finance';

const COLOR_PRESETS = [
  '#10b981',
  '#8b5cf6',
  '#3b82f6',
  '#06b6d4',
  '#f59e0b',
  '#f43f5e',
  '#ec4899',
  '#64748b',
];

function AccountIcon({ type, color }: { type: AccountType; color: string }) {
  const Icon =
    type === 'CREDIT_CARD'
      ? CreditCard
      : type === 'SAVINGS'
        ? PiggyBank
        : type === 'CASH'
          ? Banknote
          : type === 'INVESTMENT'
            ? TrendingUp
            : Landmark;

  return (
    <div
      className="flex h-11 w-11 items-center justify-center rounded-xl border"
      style={{
        backgroundColor: `${color}1f`,
        borderColor: `${color}45`,
        color,
      }}
    >
      <Icon className="h-5 w-5" />
    </div>
  );
}

export function AccountsPage() {
  const { toast } = useToast();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Account | null>(null);
  const [name, setName] = useState('');
  const [type, setType] = useState<AccountType>('CHECKING');
  const [initialBalance, setInitialBalance] = useState('0');
  const [color, setColor] = useState(COLOR_PRESETS[0]);
  const [saving, setSaving] = useState(false);

  const [deleting, setDeleting] = useState<Account | null>(null);

  const fetchAccounts = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get<{ accounts: Account[] }>('/accounts');
      setAccounts(data.accounts);
    } catch (error) {
      toast({
        variant: 'error',
        title: 'Erro ao carregar contas',
        description: getApiErrorMessage(error),
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  const openCreate = () => {
    setEditing(null);
    setName('');
    setType('CHECKING');
    setInitialBalance('0');
    setColor(COLOR_PRESETS[0]);
    setModalOpen(true);
  };

  const openEdit = (account: Account) => {
    setEditing(account);
    setName(account.name);
    setType(account.type);
    setInitialBalance(String(account.initialBalance));
    setColor(account.color);
    setModalOpen(true);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        name,
        type,
        initialBalance: Number(initialBalance || 0),
        color,
      };
      if (editing) {
        await api.put(`/accounts/${editing.id}`, payload);
        toast({ variant: 'success', title: 'Conta atualizada!' });
      } else {
        await api.post('/accounts', payload);
        toast({ variant: 'success', title: 'Conta criada com sucesso!' });
      }
      setModalOpen(false);
      await fetchAccounts();
    } catch (error) {
      toast({
        variant: 'error',
        title: 'Não foi possível salvar a conta',
        description: getApiErrorMessage(error),
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleting) return;
    setSaving(true);
    try {
      await api.delete(`/accounts/${deleting.id}`);
      toast({ variant: 'success', title: 'Conta excluída.' });
      setDeleting(null);
      await fetchAccounts();
    } catch (error) {
      toast({
        variant: 'error',
        title: 'Não foi possível excluir',
        description: getApiErrorMessage(error),
      });
    } finally {
      setSaving(false);
    }
  };

  const totalBalance = accounts.reduce((sum, acc) => sum + acc.currentBalance, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white">
            Contas e Carteiras
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">
            Gerencie suas contas bancárias, cartões e reservas com saldo calculado automaticamente.
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" />
          Nova conta
        </Button>
      </div>

      {/* Consolidated Banner */}
      <Card className="bg-gradient-to-r from-surface-900 via-surface-900 to-emerald-950/35 border-emerald-500/20">
        <CardContent className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">
              <Wallet className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
                Saldo Consolidado ({accounts.length}{' '}
                {accounts.length === 1 ? 'conta' : 'contas'})
              </p>
              <p className="text-3xl font-extrabold text-white tabular-nums-mono mt-0.5">
                {formatCurrency(totalBalance)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Accounts Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-44 rounded-2xl border border-white/[0.06] bg-surface-900/60 animate-pulse"
            />
          ))}
        </div>
      ) : accounts.length === 0 ? (
        <Card>
          <CardContent className="py-14 text-center space-y-3">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white/5 text-slate-400">
              <Wallet className="h-6 w-6" />
            </div>
            <h3 className="text-base font-semibold text-white">
              Nenhuma conta cadastrada
            </h3>
            <p className="text-sm text-slate-400 max-w-sm mx-auto">
              Crie sua primeira conta bancária, carteira ou cartão para começar a registrar transações.
            </p>
            <Button onClick={openCreate} className="mt-2">
              <Plus className="h-4 w-4" />
              Criar primeira conta
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {accounts.map((account) => (
            <Card
              key={account.id}
              className="group relative overflow-hidden hover:border-white/15 transition-all duration-200"
            >
              <div
                className="h-1 w-full"
                style={{ backgroundColor: account.color }}
              />
              <CardContent className="p-5 space-y-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <AccountIcon type={account.type} color={account.color} />
                    <div className="min-w-0">
                      <h3 className="font-bold text-slate-100 truncate">
                        {account.name}
                      </h3>
                      <p className="text-xs text-slate-400">
                        {ACCOUNT_TYPE_LABELS[account.type]}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100">
                    <button
                      type="button"
                      onClick={() => openEdit(account)}
                      className="rounded-lg p-1.5 text-slate-400 hover:bg-white/5 hover:text-white transition-colors"
                      aria-label="Editar conta"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleting(account)}
                      className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-500/15 hover:text-rose-300 transition-colors"
                      aria-label="Excluir conta"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="pt-3 border-t border-white/[0.06] flex items-end justify-between gap-2">
                  <div>
                    <p className="text-[11px] uppercase tracking-wider text-slate-500 font-medium">
                      Saldo atual
                    </p>
                    <p
                      className={`text-2xl font-bold tabular-nums-mono mt-0.5 ${
                        account.currentBalance < 0
                          ? 'text-rose-400'
                          : 'text-white'
                      }`}
                    >
                      {formatCurrency(account.currentBalance)}
                    </p>
                  </div>
                  <span className="text-xs text-slate-400 bg-white/5 rounded-full px-2.5 py-1">
                    {account.transactionCount}{' '}
                    {account.transactionCount === 1 ? 'lançamento' : 'lançamentos'}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Editar conta' : 'Nova conta'}
        description="Configure os detalhes da conta para acompanhar seu saldo."
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <FieldLabel htmlFor="acc-name">Nome da conta</FieldLabel>
            <Input
              id="acc-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Nubank Conta, Itaú Personalité"
              required
              minLength={2}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <FieldLabel htmlFor="acc-type">Tipo</FieldLabel>
              <Select
                id="acc-type"
                value={type}
                onChange={(e) => setType(e.target.value as AccountType)}
              >
                {Object.entries(ACCOUNT_TYPE_LABELS).map(([value, label]) => (
                  <option key={value} value={value} className="bg-surface-900">
                    {label}
                  </option>
                ))}
              </Select>
            </div>

            <div>
              <FieldLabel htmlFor="acc-balance">Saldo inicial (R$)</FieldLabel>
              <Input
                id="acc-balance"
                type="number"
                step="0.01"
                value={initialBalance}
                onChange={(e) => setInitialBalance(e.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <FieldLabel>Cor identificadora</FieldLabel>
            <div className="flex flex-wrap gap-2.5 mt-1">
              {COLOR_PRESETS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setColor(preset)}
                  className={`h-8 w-8 rounded-full transition-transform ${
                    color === preset
                      ? 'scale-110 ring-2 ring-white ring-offset-2 ring-offset-surface-900'
                      : 'opacity-80 hover:opacity-100'
                  }`}
                  style={{ backgroundColor: preset }}
                  aria-label={`Selecionar cor ${preset}`}
                />
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2.5 pt-3">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Salvando...' : editing ? 'Salvar alterações' : 'Criar conta'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        title="Excluir conta"
        description={`Tem certeza que deseja excluir "${deleting?.name}"? Essa ação não pode ser desfeita.`}
      >
        <div className="flex justify-end gap-2.5 pt-2">
          <Button variant="secondary" onClick={() => setDeleting(null)}>
            Cancelar
          </Button>
          <Button variant="danger" onClick={handleDelete} disabled={saving}>
            {saving ? 'Excluindo...' : 'Excluir conta'}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
