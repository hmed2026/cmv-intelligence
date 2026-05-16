# CMV Intelligence — SaaS Financeiro Enterprise

Sistema SaaS de gestão financeira com IA integrada para controle de CMV, fluxo de caixa, DRE e análise automatizada de documentos financeiros.

---

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Frontend | Next.js 14, TypeScript, Tailwind CSS, Framer Motion, Recharts |
| Backend | Node.js, Express, TypeScript, Prisma ORM |
| Banco | PostgreSQL 16 |
| Cache | Redis 7 |
| IA | Anthropic Claude (claude-sonnet-4-6) |
| Infra | Docker, Docker Compose |

---

## Início Rápido

### Pré-requisitos
- [Docker Desktop](https://www.docker.com/products/docker-desktop/)
- [Node.js 20+](https://nodejs.org/) (para desenvolvimento local)

### 1. Configurar variáveis de ambiente

```bash
cp .env.example .env
```

Edite `.env` e preencha:
```
ANTHROPIC_API_KEY=sua_chave_aqui   # obrigatório para IA
JWT_SECRET=troque_em_producao
JWT_REFRESH_SECRET=troque_em_producao
```

### 2. Subir com Docker (recomendado)

```bash
docker-compose up -d
```

Aguarde os containers subirem (~30s), depois execute as migrations:

```bash
docker-compose exec backend npx prisma migrate deploy
docker-compose exec backend npm run prisma:seed
```

Acesse:
- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:3001/api/v1
- **Health check:** http://localhost:3001/health

### 3. Login demo

```
Email:    admin@cmv.com
Senha:    Demo@123
```

---

## Desenvolvimento Local

### Backend

```bash
cd backend
npm install
cp .env.example .env          # configure DATABASE_URL e ANTHROPIC_API_KEY
npx prisma migrate dev --name init
npx prisma generate
npm run prisma:seed
npm run dev
```

O backend sobe em `http://localhost:3001`.

### Frontend

```bash
cd frontend
npm install
cp .env.local.example .env.local
npm run dev
```

O frontend sobe em `http://localhost:3000`.

---

## Estrutura do Projeto

```
cmv-saas/
├── docker-compose.yml          # Orquestração de containers
├── .env.example                # Template de variáveis
│
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma       # Schema do banco (8 modelos)
│   │   └── seed.ts             # Dados de demonstração
│   └── src/
│       ├── config/             # DB, Redis, Logger
│       ├── controllers/        # Handlers HTTP (auth, company, transaction, upload, report, ai)
│       ├── middleware/         # Auth JWT, Validação, Upload
│       ├── routes/             # Roteamento Express
│       └── services/
│           ├── ai.service.ts       # Classificação via Claude API
│           ├── parser.service.ts   # Parser CSV/XLSX/PDF/TXT
│           ├── import.service.ts   # Orquestração de importações
│           ├── transaction.service.ts
│           ├── report.service.ts   # DRE, CMV, Fluxo de Caixa
│           └── auth.service.ts
│
└── frontend/
    └── src/
        ├── app/
        │   ├── (auth)/             # Login, Registro
        │   └── (dashboard)/        # Dashboard, Transações, Relatórios,
        │                           # Importar, Empresas, Configurações
        ├── components/
        │   ├── charts/             # Recharts (Revenue, Categories, CashFlow)
        │   ├── layout/             # Sidebar, Header
        │   ├── tables/             # TransactionTable
        │   └── ui/                 # Button, Input, KPICard, Badge, Modal, Select
        ├── contexts/               # AuthContext, CompanyContext
        ├── lib/                    # api.ts, auth.ts, utils.ts
        └── types/                  # Tipos TypeScript completos
```

---

## API Endpoints

### Autenticação
```
POST   /api/v1/auth/register
POST   /api/v1/auth/login
POST   /api/v1/auth/refresh
POST   /api/v1/auth/logout
GET    /api/v1/auth/me
```

### Empresas
```
GET    /api/v1/companies
POST   /api/v1/companies
GET    /api/v1/companies/:id
PUT    /api/v1/companies/:id
POST   /api/v1/companies/:id/logo
GET    /api/v1/companies/:id/stats
```

### Transações
```
GET    /api/v1/transactions          # com filtros: startDate, endDate, type, category, search
POST   /api/v1/transactions
GET    /api/v1/transactions/:id
PUT    /api/v1/transactions/:id
DELETE /api/v1/transactions/:id
GET    /api/v1/transactions/summary
GET    /api/v1/transactions/chart/monthly
GET    /api/v1/transactions/chart/categories
```

### Importação
```
POST   /api/v1/upload                # multipart/form-data, campo: file
GET    /api/v1/upload/history
GET    /api/v1/upload/:id
```

### Relatórios
```
GET    /api/v1/reports/dre
GET    /api/v1/reports/cmv
GET    /api/v1/reports/fluxo-caixa
GET    /api/v1/reports/top-expenses
GET    /api/v1/reports/revenue-growth
GET    /api/v1/reports/export
```

### IA
```
POST   /api/v1/ai/classify
POST   /api/v1/ai/insights
POST   /api/v1/ai/analyze-document
POST   /api/v1/ai/anomalies
```

---

## Funcionalidades

### IA Financeira (Claude claude-sonnet-4-6)
- Classificação automática de transações (REVENUE, EXPENSE, TAX, WITHDRAWAL, TRANSFER, CMV)
- Contexto brasileiro: PIX, boleto, maquininha, DAS, DARF, etc.
- Parsing inteligente de extratos bancários
- Geração de insights e recomendações
- Detecção de anomalias financeiras

### Parser Inteligente
- **CSV:** suporte a delimitadores vírgula e ponto-e-vírgula
- **XLSX:** leitura via biblioteca xlsx
- **PDF:** extração de texto via pdf-parse
- **TXT:** parsing linha a linha
- Normalização de valores: `R$ 1.234,56` → `1234.56`
- Normalização de datas: `DD/MM/YYYY`, `YYYY-MM-DD`, `DD/MM/YY`
- Detecção automática de colunas (data, descrição, valor, tipo)

### Dashboard Premium
- KPIs: Receita, Despesas, Lucro Líquido, CMV
- Gráfico de área: Receita vs Despesas (6 meses)
- Gráfico de pizza: Categorias de despesas
- Gráfico de barras: Fluxo de caixa mensal
- Painel de indicadores CMV com metas
- Tabela de transações recentes
- Painel de insights da IA

### Multiempresa
- Dados completamente isolados por empresa
- Permissões: OWNER, ADMIN, EDITOR, VIEWER
- Logo e cores personalizáveis por empresa
- Switch de empresa no sidebar

---

## Modelos do Banco

| Modelo | Descrição |
|--------|-----------|
| `User` | Usuários do sistema |
| `Company` | Empresas (multiempresa) |
| `UserCompany` | Relação N:N com roles |
| `Transaction` | Movimentações financeiras (centavos) |
| `Category` | Categorias por empresa |
| `BankAccount` | Contas bancárias |
| `ImportHistory` | Histórico de importações |
| `FinancialReport` | Relatórios mensais consolidados |

---

## Produção

### Variáveis obrigatórias para produção
```bash
JWT_SECRET=<string longa e aleatória>
JWT_REFRESH_SECRET=<string longa e aleatória>
ANTHROPIC_API_KEY=<chave da Anthropic>
POSTGRES_PASSWORD=<senha forte>
NEXT_PUBLIC_API_URL=https://api.seudominio.com
```

### Build
```bash
docker-compose -f docker-compose.yml up -d --build
```

---

## Licença
Propriedade privada. Todos os direitos reservados.
