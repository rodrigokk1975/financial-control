import {
  ArrowDownLeft,
  ArrowUpRight,
  Pencil,
  Plus,
  Tags,
  Trash2,
} from 'lucide-react';
import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { FieldLabel, Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/contexts/ToastContext';
import { cn, getApiErrorMessage } from '@/lib/utils';
import { api } from '@/services/api';
import type { Category, TransactionType } from '@/types/finance';

const COLOR_PRESETS = [
  '#10b981',
  '#06b6d4',
  '#3b82f6',
  '#6366f1',
  '#a855f7',
  '#ec4899',
  '#f43f5e',
  '#f97316',
  '#eab308',
];

export function CategoriesPage() {
  const { toast } = useToast();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'ALL' | TransactionType>('ALL');

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [name, setName] = useState('');
  const [type, setType] = useState<TransactionType>('EXPENSE');
  const [color, setColor] = useState(COLOR_PRESETS[6]);
  const [saving, setSaving] = useState(false);

  const [deleting, setDeleting] = useState<Category | null>(null);

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get<{ categories: Category[] }>('/categories');
      setCategories(data.categories);
    } catch (error) {
      toast({
        variant: 'error',
        title: 'Erro ao carregar categorias',
        description: getApiErrorMessage(error),
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const openCreate = () => {
    setEditing(null);
    setName('');
    setType(filter === 'INCOME' ? 'INCOME' : 'EXPENSE');
    setColor(filter === 'INCOME' ? '#10b981' : '#f43f5e');
    setModalOpen(true);
  };

  const openEdit = (cat: Category) => {
    setEditing(cat);
    setName(cat.name);
    setType(cat.type);
    setColor(cat.color);
    setModalOpen(true);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { name, type, color, icon: 'tag' };
      if (editing) {
        await api.put(`/categories/${editing.id}`, payload);
        toast({ variant: 'success', title: 'Categoria atualizada!' });
      } else {
        await api.post('/categories', payload);
        toast({ variant: 'success', title: 'Categoria criada com sucesso!' });
      }
      setModalOpen(false);
      await fetchCategories();
    } catch (error) {
      toast({
        variant: 'error',
        title: 'Não foi possível salvar a categoria',
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
      await api.delete(`/categories/${deleting.id}`);
      toast({ variant: 'success', title: 'Categoria excluída.' });
      setDeleting(null);
      await fetchCategories();
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

  const visibleCategories =
    filter === 'ALL'
      ? categories
      : categories.filter((c) => c.type === filter);

  const incomeCount = categories.filter((c) => c.type === 'INCOME').length;
  const expenseCount = categories.filter((c) => c.type === 'EXPENSE').length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white">
            Categorias
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">
            Classifique suas receitas e despesas para análises precisas no dashboard.
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" />
          Nova categoria
        </Button>
      </div>

      {/* Filter Tabs */}
      <div className="inline-flex rounded-xl border border-white/[0.08] bg-surface-900 p-1">
        {(
          [
            { key: 'ALL', label: `Todas (${categories.length})` },
            { key: 'INCOME', label: `Receitas (${incomeCount})` },
            { key: 'EXPENSE', label: `Despesas (${expenseCount})` },
          ] as const
        ).map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setFilter(tab.key)}
            className={cn(
              'rounded-lg px-4 py-2 text-xs font-semibold transition-all',
              filter === tab.key
                ? 'bg-emerald-500 text-slate-950 shadow'
                : 'text-slate-400 hover:text-slate-100'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="h-24 rounded-2xl border border-white/[0.06] bg-surface-900/60 animate-pulse"
            />
          ))}
        </div>
      ) : visibleCategories.length === 0 ? (
        <Card>
          <CardContent className="py-14 text-center space-y-3">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white/5 text-slate-400">
              <Tags className="h-6 w-6" />
            </div>
            <h3 className="text-base font-semibold text-white">
              Nenhuma categoria encontrada
            </h3>
            <p className="text-sm text-slate-400">
              Adicione categorias personalizadas para organizar seus lançamentos.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {visibleCategories.map((cat) => (
            <Card
              key={cat.id}
              className="group hover:border-white/15 transition-all"
            >
              <CardContent className="p-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3.5 min-w-0">
                  <div
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border"
                    style={{
                      backgroundColor: `${cat.color}1f`,
                      borderColor: `${cat.color}45`,
                      color: cat.color,
                    }}
                  >
                    {cat.type === 'INCOME' ? (
                      <ArrowUpRight className="h-4 w-4" />
                    ) : (
                      <ArrowDownLeft className="h-4 w-4" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-100 truncate">
                      {cat.name}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge color={cat.type === 'INCOME' ? '#10b981' : '#f43f5e'}>
                        {cat.type === 'INCOME' ? 'Receita' : 'Despesa'}
                      </Badge>
                      <span className="text-[11px] text-slate-500">
                        {cat.transactionCount} uso(s)
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1 opacity-75 group-hover:opacity-100">
                  <button
                    type="button"
                    onClick={() => openEdit(cat)}
                    className="rounded-lg p-1.5 text-slate-400 hover:bg-white/5 hover:text-white"
                    aria-label="Editar categoria"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleting(cat)}
                    className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-500/15 hover:text-rose-300"
                    aria-label="Excluir categoria"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
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
        title={editing ? 'Editar categoria' : 'Nova categoria'}
        description="Defina nome, tipo e cor de destaque para os gráficos."
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <FieldLabel htmlFor="cat-name">Nome da categoria</FieldLabel>
            <Input
              id="cat-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Alimentação, Salário, Investimentos"
              required
              minLength={2}
            />
          </div>

          <div>
            <FieldLabel>Tipo</FieldLabel>
            <div className="grid grid-cols-2 gap-2.5">
              {(
                [
                  { value: 'EXPENSE', label: 'Despesa', accent: 'rose' },
                  { value: 'INCOME', label: 'Receita', accent: 'emerald' },
                ] as const
              ).map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setType(option.value)}
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
          </div>

          <div>
            <FieldLabel>Cor nos gráficos</FieldLabel>
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
              {saving
                ? 'Salvando...'
                : editing
                  ? 'Salvar alterações'
                  : 'Criar categoria'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Modal */}
      <Modal
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        title="Excluir categoria"
        description={`Tem certeza que deseja excluir "${deleting?.name}"?`}
      >
        <div className="flex justify-end gap-2.5 pt-2">
          <Button variant="secondary" onClick={() => setDeleting(null)}>
            Cancelar
          </Button>
          <Button variant="danger" onClick={handleDelete} disabled={saving}>
            {saving ? 'Excluindo...' : 'Excluir'}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
