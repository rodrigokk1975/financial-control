import { ArrowRight, Eye, EyeOff, Lock, ShieldCheck, TrendingUp } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { FieldLabel, Input } from '@/components/ui/Input';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { getApiErrorMessage } from '@/lib/utils';

export function LoginPage() {
  const { login } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await login(email, password);
      toast({
        variant: 'success',
        title: 'Bem-vindo de volta!',
        description: 'Sessão autenticada com sucesso.',
      });
      navigate('/');
    } catch (error) {
      toast({
        variant: 'error',
        title: 'Falha no login',
        description: getApiErrorMessage(error, 'Verifique seu e-mail e senha.'),
      });
    } finally {
      setSubmitting(false);
    }
  };

  const fillDemo = () => {
    setEmail('demo@finpulse.dev');
    setPassword('123456');
  };

  return (
    <div className="min-h-screen bg-surface-950 grid lg:grid-cols-2">
      {/* Left Showcase Panel */}
      <div className="hidden lg:flex flex-col justify-between p-12 relative overflow-hidden border-r border-white/[0.06] bg-gradient-to-br from-surface-900 via-surface-950 to-emerald-950/30">
        <div className="absolute -top-24 -left-24 h-96 w-96 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -right-24 h-96 w-96 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 text-slate-950 shadow-glow">
            <TrendingUp className="h-5 w-5 stroke-[2.5]" />
          </div>
          <span className="text-xl font-extrabold tracking-tight text-white">
            FinPulse
          </span>
        </div>

        <div className="relative z-10 space-y-8 max-w-md">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-300 mb-5">
              <ShieldCheck className="h-3.5 w-3.5" />
              Controle financeiro inteligente
            </span>
            <h1 className="text-4xl font-extrabold tracking-tight text-white leading-[1.15]">
              Clareza total sobre cada real que entra e sai.
            </h1>
            <p className="mt-4 text-sm text-slate-400 leading-relaxed">
              Consolide contas bancárias, categorize gastos com precisão e
              acompanhe sua evolução mensal em gráficos interativos.
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-surface-900/80 backdrop-blur-md p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400">
                Patrimônio consolidado
              </span>
              <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                +14,8% este mês
              </span>
            </div>
            <p className="text-3xl font-bold text-white tabular-nums-mono">
              R$ 48.920,50
            </p>
            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-white/[0.06]">
              <div>
                <p className="text-[11px] text-slate-400">Receitas</p>
                <p className="text-sm font-semibold text-emerald-400 tabular-nums-mono">
                  + R$ 9.795,50
                </p>
              </div>
              <div>
                <p className="text-[11px] text-slate-400">Despesas</p>
                <p className="text-sm font-semibold text-rose-400 tabular-nums-mono">
                  - R$ 4.360,00
                </p>
              </div>
            </div>
          </div>
        </div>

        <p className="relative z-10 text-xs text-slate-500">
          React + TypeScript • Express + Prisma ORM • PostgreSQL
        </p>
      </div>

      {/* Right Form Panel */}
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
              Entrar na sua conta
            </h2>
            <p className="text-sm text-slate-400 mt-1.5">
              Informe suas credenciais para acessar seu painel financeiro.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
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
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                  aria-label="Mostrar ou ocultar senha"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              size="lg"
              className="w-full mt-2"
              disabled={submitting}
            >
              {submitting ? 'Entrando...' : 'Entrar'}
              {!submitting && <ArrowRight className="h-4 w-4" />}
            </Button>
          </form>

          <div className="rounded-xl border border-white/[0.08] bg-surface-900/70 p-3.5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <Lock className="h-4 w-4 text-emerald-400 shrink-0" />
              <div className="min-w-0">
                <p className="text-xs font-medium text-slate-200">
                  Conta de demonstração (seed)
                </p>
                <p className="text-[11px] text-slate-400 truncate">
                  demo@finpulse.dev • 123456
                </p>
              </div>
            </div>
            <Button type="button" variant="secondary" size="sm" onClick={fillDemo}>
              Preencher
            </Button>
          </div>

          <p className="text-center text-sm text-slate-400">
            Ainda não tem conta?{' '}
            <Link
              to="/register"
              className="font-semibold text-emerald-400 hover:text-emerald-300 transition-colors"
            >
              Criar conta grátis
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
