import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/Button';
import { FieldLabel, Input, Select } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/contexts/ToastContext';
import { cn, formatDateInput, getApiErrorMessage } from '@/lib/utils';
import { api } from '@/services/api';
import type {
  Account,
  Category,
  Transaction,
  TransactionType,
} from '@/types/finance';

interface TransactionModalProps {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  accounts: Account[];
  categories: Category[];
  editing?: Transaction | null;
}

export function TransactionModal({
  open,
  onClose,
  onSaved,
  accounts,
  categories,
  editing,
}: TransactionModalProps) {
  const { toast } = useToast();

  const [type, setType] = useState<TransactionType>('EXPENSE');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(formatDateInput());
  const [accountId, setAccountId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [saving, setSaving] = useState(false);

  const filteredCategories = useMemo(
    () => categories.filter((c) => c.type === type),
    [categories, type]
  );

  useEffect(() => {
    if (!open) return;

    if (editing) {
      setType(editing.type);
      setDescription(editing.description);
      setAmount(String(editing.amount));
      setDate(formatDateInput(editing.date));
      setAccountId(editing.accountId);
      setCategoryId(editing.categoryId);
    } else {
      setType('EXPENSE');
      setDescription('');
      setAmount('');
      setDate(formatDateInput());
      setAccountId(accounts[0]?.id ?? '');
      const firstExpenseCat = categories.find((c) => c.type === 'EXPENSE');
      setCategoryId(firstExpenseCat?.id ?? '');
    }
  }, [open, editing, accounts, categories]);

  const handleTypeChange = (nextType: TransactionType) => {
    setType(nextType);
    const compatible = categories.filter((c) => c.type === nextType);
    if (!compatible.some((c) => c.id === categoryId)) {
      setCategoryId(compatible[0]?.id ?? '');
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!accountId || !categoryId) {
      toast({
        variant: 'error',
        title: 'Campos obrigatórios',
        description: 'Cadastre pelo menos uma conta e uma categoria compatível.',
      });
      return;
    }

    setSaving(true);
    try {
      const payload = {
        type,
        description,
        amount: Number(amount),
        date: `${date}T12:00:00.000Z`,
        accountId,
        categoryId,
      };

      if (editing) {
        await api.put(`/transactions/${editing.id}`, payload);
        toast({ variant: 'success', title: 'Transação atualizada!' });
      } else {
        await api.post('/transactions', payload);
        toast({ variant: 'success', title: 'Transação registrada!' });
      }
      onClose();
      onSaved();
    } catch (error) {
      toast({
        variant: 'error',
        title: 'Erro ao salvar transação',
        description: getApiErrorMessage(error),
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? 'Editar transação' : 'Nova transação'}
      description="Registre receitas ou despesas vinculadas às suas contas e categorias."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-2.5">
          {(
            [
              { value: 'EXPENSE', label: 'Despesa' },
              { value: 'INCOME', label: 'Receita' },
            ] as const
          ).map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => handleTypeChange(option.value)}
              className={cn(
                'h-10 rounded-xl border text-sm font-semibold transition-all',
                type === option.value
                  ? option.value === 'INCOME'
                    ? 'border-emerald-500 bg-emerald-500/15 text-emerald-300'
                    : 'border-rose-500 bg-rose-500/15 text-rose-300'
                  : 'border-white/10 bg-surface-950/70 text-slate-400 hover:text-slate-200'
              )}
            >
              {option.label}
            </button>
          ))}
        </div>

        <div>
          <FieldLabel htmlFor="tx-description">Descrição</FieldLabel>
          <Input
            id="tx-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Ex: Supermercado, Salário, Aluguel..."
            required
            minLength={2}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <FieldLabel htmlFor="tx-amount">Valor (R$)</FieldLabel>
            <Input
              id="tx-amount"
              type="number"
              step="0.01"
              min="0.01"
              placeholder="0,00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </div>

          <div>
            <FieldLabel htmlFor="tx-date">Data</FieldLabel>
            <Input
              id="tx-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <FieldLabel htmlFor="tx-account">Conta</FieldLabel>
            <Select
              id="tx-account"
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              required
            >
              {accounts.length === 0 && (
                <option value="" className="bg-surface-900">
                  Nenhuma conta cadastrada
                </option>
              )}
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id} className="bg-surface-900">
                  {acc.name}
                </option>
              ))}
            </Select>
          </div>

          <div>
            <FieldLabel htmlFor="tx-category">Categoria</FieldLabel>
            <Select
              id="tx-category"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              required
            >
              {filteredCategories.length === 0 && (
                <option value="" className="bg-surface-900">
                  Sem categoria de {type === 'INCOME' ? 'receita' : 'despesa'}
                </option>
              )}
              {filteredCategories.map((cat) => (
                <option key={cat.id} value={cat.id} className="bg-surface-900">
                  {cat.name}
                </option>
              ))}
            </Select>
          </div>
        </div>

        <div className="flex justify-end gap-2.5 pt-3">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={saving}>
            {saving
              ? 'Salvando...'
              : editing
                ? 'Salvar alterações'
                : 'Registrar transação'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
