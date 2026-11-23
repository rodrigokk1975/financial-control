import { ArrowRight, CheckCircle2, TrendingUp } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { FieldLabel, Input } from '@/components/ui/Input';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { getApiErrorMessage } from '@/lib/utils';

export function RegisterPage() {
  const { register } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await register(name, email, password);
      toast({
        variant: 'success',
        title: 'Conta criada!',
        description: 'Categorias iniciais já foram configuradas para você.',
      });
      navigate('/');
    } catch (error) {
      toast({
        variant: 'error',
        title: 'Não foi possível criar sua conta',
        description: getApiErrorMessage(error),
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface-950 grid lg:grid-cols-2">
      <div className="hidden lg:flex flex-col justify-between p-12 relative overflow-hidden border-r border-white/[0.06] bg-gradient-to-br from-surface-900 via-surface-950 to-cyan-950/25">
        <div className="absolute -top-24 -right-24 h-96 w-96 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 text-slate-950 shadow-glow">
            <TrendingUp className="h-5 w-5 stroke-[2.5]" />
          </div>
          <span className="text-xl font-extrabold tracking-tight text-white">
            FinPulse
          </span>
        </div>

        <div className="relative z-10 max-w-md space-y-6">
          <h1 className="text-4xl font-extrabold tracking-tight text-white leading-[1.15]">
            Comece a organizar seu dinheiro em menos de 1 minuto.
          </h1>
          <ul className="space-y-3 text-sm text-slate-300">
            {[
              'Múltiplas contas bancárias e cartões com saldo automático',
              'Categorias personalizáveis de receitas e despesas',
              'Filtros avançados por período e gráficos interativos',
            ].map((item) => (
              <li key={item} className="flex items-start gap-2.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative z-10 text-xs text-slate-500">
          Autenticação JWT • Dados isolados por usuário
        </p>
      </div>

      <div className="flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-md space-y-8">
          <div className="lg:hidden flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500 text-slate-950">
              <TrendingUp className="h-5 w-5 stroke-[2.5]" />
            </div>
            <span className="text-lg font-extrabold text-white">FinPulse</span>
          </div>

          <div>
            <h2 className="text-2xl font-bold tracking-tight text-white">
              Criar nova conta
            </h2>
            <p className="text-sm text-slate-400 mt-1.5">
              Preencha os campos abaixo para iniciar seu controle financeiro.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <FieldLabel htmlFor="name">Nome completo</FieldLabel>
              <Input
                id="name"
                type="text"
                placeholder="Seu nome"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                minLength={2}
              />
            </div>

            <div>
              <FieldLabel htmlFor="email">E-mail</FieldLabel>
              <Input
                id="email"
                type="email"
                placeholder="voce@exemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>

            <div>
              <FieldLabel htmlFor="password">Senha</FieldLabel>
              <Input
                id="password"
                type="password"
                placeholder="Mínimo 6 caracteres"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                autoComplete="new-password"
              />
            </div>

            <Button
              type="submit"
              size="lg"
              className="w-full mt-2"
              disabled={submitting}
            >
              {submitting ? 'Criando conta...' : 'Criar conta'}
              {!submitting && <ArrowRight className="h-4 w-4" />}
            </Button>
          </form>

          <p className="text-center text-sm text-slate-400">
            Já possui uma conta?{' '}
            <Link
              to="/login"
              className="font-semibold text-emerald-400 hover:text-emerald-300 transition-colors"
            >
              Fazer login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
