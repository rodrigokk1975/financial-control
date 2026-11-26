# FinPulse — Controle de Finanças Pessoais

Aplicação full-stack de **controle de finanças pessoais** construída com **React + TypeScript** no frontend e **Python + Django + Django REST Framework (DRF) + SimpleJWT** no backend, com suporte a **PostgreSQL 16** (produção/Docker) e **SQLite local** (desenvolvimento/demo sem Docker), gestão de contas, categorias, transações com filtros por período e dashboard analítico interativo com **Recharts**.

> Planejamento original de produto e modelagem disponível em [PRD.md](./PRD.md).

---

## Principais Funcionalidades

- **Autenticação JWT Segura (SimpleJWT):** Cadastro (com criação automática de 6 categorias iniciais), login, hash de senha nativo do Django, proteção de rotas via `Bearer` token e isolamento estrito de dados por usuário.
- **Gestão de Contas e Carteiras:** CRUD completo de contas (Conta Corrente, Poupança, Cartão de Crédito, Dinheiro, Investimento) com **saldo atual calculado dinamicamente** (`saldo inicial + receitas - despesas`).
- **Categorias Personalizáveis:** Separação entre Receitas (`INCOME`) e Despesas (`EXPENSE`), com cores identificadoras refletidas nas badges e nos gráficos.
- **Transações com Filtros Combináveis:** CRUD completo com validação de integridade relacional, filtros por **mês/ano** ou **intervalo personalizado (`startDate`/`endDate`)**, tipo, conta, categoria, busca textual e paginação.
- **Dashboard Analítico (Recharts):**
  - Cards de KPIs (Saldo Consolidado, Receitas, Despesas, Balanço e Taxa de Economia).
  - Gráfico de barras **Receitas vs. Despesas** dos últimos 6 meses.
  - Gráfico donut **Despesas por Categoria** com barras proporcionais e percentuais.
  - Lista de transações recentes e resumo rápido das contas.

---

## Stack Tecnológica

| Camada | Tecnologias |
| :--- | :--- |
| **Frontend** | React 19, Vite, TypeScript, Tailwind CSS, Recharts, Lucide Icons, Axios, React Router |
| **Backend** | Python 3.12+, Django 5.2, Django REST Framework (DRF), SimpleJWT, `django-cors-headers` |
| **Banco & ORM** | PostgreSQL 16 (Docker Compose + `psycopg` v3) **ou** SQLite local (sem Docker), Django ORM + Migrations + `seed_demo` |
| **Testes** | `pytest` + `pytest-django` |

---

## Arquitetura do Projeto

```mermaid
flowchart LR
    Web["Frontend (React + TS + Recharts :5173)"] -->|"REST JSON + Bearer JWT"| API["Backend (Django + DRF + SimpleJWT :3333)"]
    API -->|"DATABASE_URL=postgresql://..."| PG[("PostgreSQL 16 (Docker)")]
    API -->|"Fallback local sem Docker"| SQLite[("SQLite (db.sqlite3)")]
```

```text
financial-control/
├── PRD.md                    # Product Requirements Document original
├── docker-compose.yml        # PostgreSQL 16 com volume persistente e healthcheck
├── backend/
│   ├── manage.py
│   ├── requirements.txt
│   ├── pytest.ini
│   ├── config/               # settings.py (dual PG/SQLite), urls.py e wsgi.py
│   ├── core/                 # exceptions.py, utils/period.py e management command seed_demo
│   ├── apps/
│   │   ├── users/            # Custom User (UUID + email) e /api/auth/*
│   │   ├── accounts/         # Contas e cálculo de saldo dinâmico
│   │   ├── categories/       # Categorias INCOME/EXPENSE
│   │   ├── transactions/     # Transações com filtros combináveis e paginação
│   │   └── dashboard/        # Agregações analíticas de KPIs e gráficos
│   └── tests/                # Suíte pytest + pytest-django
└── frontend/
    └── src/
        ├── components/       # UI (shadcn-style), layout responsivo e modais
        ├── contexts/         # AuthContext e ToastContext
        ├── pages/            # Login, Register, Dashboard, Transactions, Accounts, Categories
        └── services/         # Cliente Axios com interceptors JWT
```

---

## Como Executar Localmente

### Pré-requisitos
- Python 3.12+ e Node.js 20+
- *(Opcional)* Docker Desktop caso deseje usar **PostgreSQL 16** em vez do modo **SQLite local**

### Opção A — Modo Rápido Local com SQLite + Demo (sem Docker)

#### 1. Configurar e rodar o Backend Django
```bash
cd backend
python -m venv .venv

# Windows (PowerShell):
.\.venv\Scripts\Activate.ps1
# Linux / macOS:
# source .venv/bin/activate

pip install -r requirements.txt
python manage.py migrate
python manage.py seed_demo
python manage.py runserver 3333
```
Sem `DATABASE_URL` definida, o Django usa automaticamente `backend/db.sqlite3`.
A API iniciará em `http://localhost:3333/api` (healthcheck em `GET /api/health`).

> **Credenciais do seed de demonstração:** `demo@finpulse.dev` / `123456` (com 3 contas, 8 categorias e 6 meses de movimentações realistas).

#### 2. Configurar e rodar o Frontend
Em outro terminal:
```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```
Acesse a interface em `http://localhost:5173`.

---

### Opção B — Com PostgreSQL 16 (Docker Compose)

1. Suba o banco PostgreSQL na raiz do projeto:
   ```bash
   docker compose up -d
   ```
2. Em `backend/`, copie `.env.example` para `.env` e descomente `DATABASE_URL`:
   ```env
   DATABASE_URL=postgresql://postgres:postgres@localhost:5432/financial_control
   ```
3. Execute as migrations, o seed e o servidor:
   ```bash
   python manage.py migrate
   python manage.py seed_demo
   python manage.py runserver 3333
   ```

---

## Testes e Build de Produção

```bash
# Testes automatizados do backend (pytest + pytest-django, roda sem Docker)
cd backend && .\.venv\Scripts\pytest.exe

# Verificação do projeto Django
cd backend && .\.venv\Scripts\python.exe manage.py check

# Build de produção do frontend
npm --prefix frontend run build
```

---

## Resumo dos Endpoints da API

- `GET /api/health` — Status da API
- `POST /api/auth/register` | `POST /api/auth/login` | `GET /api/auth/me`
- `GET|POST /api/accounts` | `PUT|DELETE /api/accounts/:id`
- `GET|POST /api/categories` | `PUT|DELETE /api/categories/:id`
- `GET|POST /api/transactions` | `PUT|DELETE /api/transactions/:id`
- `GET /api/dashboard/summary?month=11&year=2026`
