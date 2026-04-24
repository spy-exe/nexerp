# 🏗️ ERP Open Source — Planejamento Completo do Projeto

---

## 1. VISÃO GERAL

**Nome sugerido:** `NexERP`
**Tagline:** *ERP simples, bonito e de verdade — para quem trabalha de verdade.*
**Licença:** MIT
**Público-alvo:** Pequenas e médias empresas brasileiras — mercadinhos, fábricas, prestadores de serviço, comércio em geral.

---

## 2. STACK TECNOLÓGICA

### Backend
- **Runtime:** Python 3.12+
- **Framework:** FastAPI
- **ORM:** SQLAlchemy 2.x + Alembic (migrations)
- **Banco de dados:** PostgreSQL 16
- **Cache:** Redis (sessões, rate limiting, filas)
- **Filas:** Celery + Redis (tarefas assíncronas: NF-e, relatórios, e-mails)
- **Autenticação:** JWT (access token curto + refresh token longo) + bcrypt
- **Validação:** Pydantic v2
- **Testes:** Pytest + httpx

### Frontend
- **Framework:** Next.js 14 (App Router)
- **Linguagem:** TypeScript
- **Estilo:** Tailwind CSS + shadcn/ui customizado
- **Estado global:** Zustand
- **Formulários:** React Hook Form + Zod
- **Gráficos:** Recharts
- **Tabelas:** TanStack Table
- **Requisições:** React Query (TanStack Query)
- **Ícones:** Lucide React

### Infraestrutura
- **Containerização:** Docker + Docker Compose
- **Proxy reverso:** Caddy (SSL automático via Let's Encrypt)
- **Monitoramento:** Zabbix agent (opcional) ou Uptime Kuma embutido
- **Backup:** Script automatizado PostgreSQL dump + rotação
- **CI/CD:** GitHub Actions

---

## 3. ARQUITETURA DO SISTEMA

```
┌─────────────────────────────────────────────────┐
│                   CADDY (SSL)                   │
└────────────────────┬────────────────────────────┘
                     │
        ┌────────────┴────────────┐
        │                         │
   ┌────▼────┐              ┌─────▼─────┐
   │ Next.js │              │  FastAPI  │
   │ (front) │◄────────────►│ (backend) │
   └─────────┘   REST/JSON  └─────┬─────┘
                                  │
                     ┌────────────┼────────────┐
                     │            │            │
               ┌─────▼───┐  ┌────▼───┐  ┌────▼───┐
               │Postgres │  │ Redis  │  │Celery  │
               └─────────┘  └────────┘  └────────┘
```

### Multi-tenancy
Cada empresa é um **tenant** isolado. Isolamento via `company_id` em todas as tabelas + Row Level Security (RLS) no PostgreSQL. Uma instalação serve múltiplas empresas.

---

## 4. SEGURANÇA

### Autenticação e Sessão
- JWT com access token de 15 minutos e refresh token de 7 dias (rotativo)
- Refresh tokens armazenados no Redis com possibilidade de revogação imediata
- Logout invalida o refresh token no Redis
- Cookie HttpOnly + Secure para o refresh token (não exposto ao JS)
- CSRF protection em todas as rotas mutáveis

### Senhas
- Hash com bcrypt (custo 12)
- Validador de força no frontend E no backend:
  - Mínimo 8 caracteres
  - Pelo menos 1 maiúscula, 1 minúscula, 1 número, 1 especial
  - Bloqueio de senhas comuns (lista de top 10k senhas)
  - Medidor visual de força (muito fraca / fraca / média / forte / muito forte)
- Sem limitação artificial de caracteres especiais
- Reset de senha via token de uso único com expiração de 1 hora

### Rate Limiting
- Login: máximo 5 tentativas por IP em 15 minutos → bloqueio temporário
- API geral: 100 req/min por usuário autenticado
- Endpoints públicos: 20 req/min por IP
- Implementado no Redis via sliding window

### Validação de Dados
- Pydantic v2 no backend — nenhum dado não validado entra no banco
- Zod no frontend — validação em tempo real nos formulários
- Sanitização de inputs (strip HTML, prevenção de XSS)
- Proteção contra SQL Injection via ORM (sem queries raw)
- Validação de CPF, CNPJ, CEP, telefone em campos específicos

### Outros
- HTTPS obrigatório (Caddy força redirect)
- Headers de segurança: HSTS, X-Frame-Options, CSP, X-Content-Type-Options
- CORS configurado explicitamente (sem wildcard em produção)
- Logs de auditoria para ações críticas (login, exclusão, alteração de permissões)
- Variáveis sensíveis apenas em `.env` (nunca no código)

---

## 5. ESTRUTURA DO BANCO DE DADOS

### Módulo: Empresa e Usuários
```sql
companies (id, name, cnpj, email, phone, address, logo_url, plan, created_at)
users (id, company_id, name, email, password_hash, role, is_active, last_login)
roles (id, company_id, name, permissions[])
refresh_tokens (id, user_id, token_hash, expires_at, revoked)
audit_logs (id, company_id, user_id, action, table, record_id, old_data, new_data, ip, created_at)
```

### Módulo: Produtos e Estoque
```sql
categories (id, company_id, name, parent_id)
products (id, company_id, sku, barcode, name, description, category_id, unit, cost_price, sale_price, min_stock, is_active)
stock_movements (id, company_id, product_id, type, quantity, balance_after, reference_id, reference_type, notes, user_id, created_at)
warehouses (id, company_id, name, location)
stock_balance (id, company_id, product_id, warehouse_id, quantity)
```

### Módulo: Pessoas (Clientes e Fornecedores)
```sql
people (id, company_id, type[customer/supplier/both], name, document, email, phone, address, notes, credit_limit, is_active)
```

### Módulo: Financeiro
```sql
accounts (id, company_id, name, type[bank/cash], balance, bank_name, agency, account_number)
transactions (id, company_id, account_id, type[income/expense], amount, date, description, category_id, person_id, reference_id, reference_type, reconciled)
financial_categories (id, company_id, name, type, parent_id)
installments (id, company_id, person_id, total_amount, paid_amount, due_date, status, reference_id)
```

### Módulo: Vendas
```sql
sales (id, company_id, person_id, user_id, status, subtotal, discount, total, payment_method, notes, created_at)
sale_items (id, sale_id, product_id, quantity, unit_price, discount, total)
sale_payments (id, sale_id, method, amount, installments, created_at)
```

### Módulo: Compras
```sql
purchases (id, company_id, supplier_id, user_id, status, subtotal, discount, total, invoice_number, created_at)
purchase_items (id, purchase_id, product_id, quantity, unit_cost, total)
```

### Módulo: NF-e
```sql
invoices (id, company_id, sale_id, number, series, key, status, xml, pdf_url, issued_at, canceled_at)
company_fiscal (id, company_id, regime, cnae, crt, certificate_path, certificate_password_enc, environment)
```

---

## 6. PÁGINAS DO SISTEMA

### Públicas (sem login)
| Rota | Descrição |
|------|-----------|
| `/` | Landing page — apresentação do produto |
| `/login` | Login com e-mail e senha |
| `/register` | Cadastro da empresa + primeiro usuário admin |
| `/forgot-password` | Solicitar reset de senha |
| `/reset-password/[token]` | Definir nova senha |

### Onboarding (após primeiro login)
| Rota | Descrição |
|------|-----------|
| `/onboarding` | Wizard de configuração inicial da empresa |
| `/onboarding/company` | Dados da empresa (CNPJ, endereço, logo) |
| `/onboarding/fiscal` | Configuração fiscal (regime, certificado) |
| `/onboarding/team` | Convidar usuários iniciais |

### Dashboard
| Rota | Descrição |
|------|-----------|
| `/dashboard` | Visão geral — KPIs, gráficos, alertas |

### Produtos e Estoque
| Rota | Descrição |
|------|-----------|
| `/products` | Listagem com busca, filtro e paginação |
| `/products/new` | Cadastro de produto |
| `/products/[id]` | Detalhes + histórico de movimentações |
| `/products/[id]/edit` | Edição de produto |
| `/categories` | Gerenciamento de categorias |
| `/stock` | Painel de estoque atual por produto/depósito |
| `/stock/movements` | Histórico de movimentações |
| `/stock/adjustment` | Ajuste manual de estoque |
| `/stock/transfer` | Transferência entre depósitos |

### Pessoas
| Rota | Descrição |
|------|-----------|
| `/customers` | Listagem de clientes |
| `/customers/new` | Cadastro de cliente |
| `/customers/[id]` | Perfil do cliente + histórico |
| `/suppliers` | Listagem de fornecedores |
| `/suppliers/new` | Cadastro de fornecedor |
| `/suppliers/[id]` | Perfil do fornecedor + histórico |

### Vendas
| Rota | Descrição |
|------|-----------|
| `/sales` | Listagem de vendas |
| `/sales/new` | Nova venda (PDV simplificado) |
| `/sales/[id]` | Detalhes da venda |
| `/sales/[id]/invoice` | NF-e da venda |
| `/pos` | PDV completo (modo tela cheia) |

### Compras
| Rota | Descrição |
|------|-----------|
| `/purchases` | Listagem de compras |
| `/purchases/new` | Registrar compra |
| `/purchases/[id]` | Detalhes da compra |

### Financeiro
| Rota | Descrição |
|------|-----------|
| `/finance` | Visão geral financeira |
| `/finance/cashflow` | Fluxo de caixa |
| `/finance/accounts` | Contas bancárias e caixa |
| `/finance/transactions` | Todas as transações |
| `/finance/receivables` | Contas a receber |
| `/finance/payables` | Contas a pagar |
| `/finance/categories` | Categorias financeiras |

### Fiscal
| Rota | Descrição |
|------|-----------|
| `/fiscal` | Painel fiscal |
| `/fiscal/invoices` | Notas fiscais emitidas |
| `/fiscal/settings` | Configurações fiscais e certificado |

### Relatórios
| Rota | Descrição |
|------|-----------|
| `/reports` | Hub de relatórios |
| `/reports/sales` | Relatório de vendas |
| `/reports/stock` | Relatório de estoque |
| `/reports/financial` | DRE simplificado |
| `/reports/customers` | Análise de clientes |

### Configurações
| Rota | Descrição |
|------|-----------|
| `/settings` | Configurações gerais da empresa |
| `/settings/users` | Gerenciar usuários |
| `/settings/roles` | Permissões e papéis |
| `/settings/integrations` | Integrações externas |
| `/settings/audit` | Log de auditoria |
| `/settings/backup` | Backup e exportação de dados |

---

## 7. FUNCIONALIDADES DETALHADAS

### Cadastro de Empresa (Onboarding)
- Nome fantasia e razão social
- CNPJ com validação e consulta automática na Receita Federal (API pública)
- Endereço com preenchimento automático via CEP (ViaCEP)
- Logotipo (upload com crop)
- Regime tributário (Simples Nacional, Lucro Presumido, Lucro Real)
- Setor de atividade (CNAE)
- Dados bancários opcionais
- Configuração de moeda e fuso horário

### Análise da Empresa (Dashboard Inteligente)
- KPIs em tempo real: faturamento do dia/mês/ano, ticket médio, produtos mais vendidos
- Alertas automáticos: estoque abaixo do mínimo, contas vencendo hoje, vendas abaixo da média
- Gráfico de faturamento dos últimos 12 meses
- Gráfico de categorias de produtos mais vendidas
- Fluxo de caixa dos próximos 30 dias (projeção)
- Ranking de clientes por volume de compras
- Indicadores: margem bruta, giro de estoque, inadimplência

### PDV (Ponto de Venda)
- Busca de produto por nome ou código de barras
- Suporte a leitor USB de código de barras (input automático)
- Carrinho com edição de quantidade e desconto por item
- Desconto global na venda
- Múltiplas formas de pagamento (dinheiro, cartão, PIX, crediário)
- Troco calculado automaticamente
- Impressão de cupom (ESC/POS e PDF)
- Emissão de NF-e integrada

### Controle de Estoque
- Entrada por compra ou ajuste manual
- Saída por venda ou ajuste manual
- Múltiplos depósitos/almoxarifados
- Alerta de estoque mínimo (notificação + e-mail)
- Inventário: contagem física com comparação e ajuste
- Histórico completo de movimentações com rastreabilidade

### NF-e
- Emissão de NF-e via SEFAZ (biblioteca PyNFe ou sped-extractor)
- Ambientes homologação e produção
- Upload de certificado digital A1 (PFX)
- Armazenamento do XML e PDF (DANFE)
- Cancelamento de NF-e com justificativa
- Carta de Correção Eletrônica (CC-e)
- Download em lote

### Relatórios
- Exportação em PDF e Excel para todos os relatórios
- Filtros por período, categoria, produto, cliente, usuário
- Agendamento de relatórios por e-mail (semanal/mensal)
- DRE simplificado (receitas - despesas = resultado)

### Permissões
- Papéis pré-definidos: Admin, Gerente, Vendedor, Estoquista, Financeiro, Visualizador
- Papéis customizados por empresa
- Permissões granulares por módulo (criar/ler/editar/deletar)
- Usuários podem ter múltiplos papéis

---

## 8. ESTRUTURA DE PASTAS

```
nexerp/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   └── v1/
│   │   │       ├── auth.py
│   │   │       ├── companies.py
│   │   │       ├── products.py
│   │   │       ├── stock.py
│   │   │       ├── people.py
│   │   │       ├── sales.py
│   │   │       ├── purchases.py
│   │   │       ├── finance.py
│   │   │       ├── fiscal.py
│   │   │       └── reports.py
│   │   ├── core/
│   │   │   ├── config.py
│   │   │   ├── security.py
│   │   │   ├── database.py
│   │   │   └── dependencies.py
│   │   ├── models/         # SQLAlchemy models
│   │   ├── schemas/        # Pydantic schemas
│   │   ├── services/       # Business logic
│   │   ├── tasks/          # Celery tasks
│   │   └── utils/
│   ├── migrations/         # Alembic
│   ├── tests/
│   ├── Dockerfile
│   └── requirements.txt
│
├── frontend/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/
│   │   │   ├── register/
│   │   │   └── forgot-password/
│   │   ├── (app)/
│   │   │   ├── dashboard/
│   │   │   ├── products/
│   │   │   ├── stock/
│   │   │   ├── sales/
│   │   │   ├── purchases/
│   │   │   ├── finance/
│   │   │   ├── fiscal/
│   │   │   ├── reports/
│   │   │   └── settings/
│   │   └── onboarding/
│   ├── components/
│   │   ├── ui/             # shadcn base components
│   │   ├── forms/          # Form components
│   │   ├── tables/         # Table components
│   │   ├── charts/         # Chart components
│   │   └── layout/         # Sidebar, header, etc.
│   ├── lib/
│   │   ├── api.ts          # API client
│   │   ├── auth.ts         # Auth helpers
│   │   └── validations.ts  # Zod schemas
│   ├── stores/             # Zustand stores
│   ├── hooks/              # Custom hooks
│   ├── Dockerfile
│   └── package.json
│
├── docker-compose.yml
├── docker-compose.prod.yml
├── Caddyfile
├── .env.example
└── README.md
```

---

## 9. BOAS PRÁTICAS DE PROGRAMAÇÃO

### Backend
- **Repository Pattern** — separação entre acesso a dados e lógica de negócio
- **Service Layer** — toda regra de negócio em services, nunca nos endpoints
- **Dependency Injection** via FastAPI Depends
- **Migrations versionadas** com Alembic — nunca ALTER TABLE manual
- **Testes unitários e de integração** com cobertura mínima de 80%
- **Type hints** em tudo — sem `Any` desnecessário
- **Linting:** Ruff + Black + isort
- **Erros tratados** com HTTPException padronizado (nunca 500 genérico)
- **Logging estruturado** com contexto (user_id, company_id, request_id)
- **Soft delete** — nunca deletar dados, apenas marcar como inativo

### Frontend
- **Componentes pequenos e focados** — Single Responsibility
- **Custom hooks** para lógica reutilizável
- **React Query** para cache e sincronização de dados do servidor
- **Error Boundaries** em todos os módulos
- **Loading states** e **skeleton loaders** em todo fetch
- **Otimistic updates** onde faz sentido (melhor UX)
- **Acessibilidade:** aria-labels, navegação por teclado, contraste adequado
- **TypeScript strict mode** — sem `as any`
- **Linting:** ESLint + Prettier

### Geral
- **Conventional Commits** (feat, fix, docs, refactor, test)
- **Pull Requests** com template descritivo
- **Changelog** automático
- **Variáveis de ambiente** documentadas no `.env.example`
- **Docker** para desenvolvimento e produção — mesma imagem, config diferente
- **README** completo: instalação em 5 minutos, screenshots, documentação da API

---

## 10. DOCKER COMPOSE (desenvolvimento)

```yaml
services:
  db:
    image: postgres:16
    environment:
      POSTGRES_DB: nexerp
      POSTGRES_USER: nexerp
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - pgdata:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  backend:
    build: ./backend
    volumes:
      - ./backend:/app
    environment:
      - DATABASE_URL=postgresql://nexerp:${DB_PASSWORD}@db/nexerp
      - REDIS_URL=redis://redis:6379
      - SECRET_KEY=${SECRET_KEY}
    ports:
      - "8000:8000"
    depends_on:
      - db
      - redis

  celery:
    build: ./backend
    command: celery -A app.tasks worker --loglevel=info
    volumes:
      - ./backend:/app
    depends_on:
      - redis

  frontend:
    build: ./frontend
    volumes:
      - ./frontend:/app
    environment:
      - NEXT_PUBLIC_API_URL=http://localhost:8000
    ports:
      - "3000:3000"
    depends_on:
      - backend

volumes:
  pgdata:
```

---

## 11. ROADMAP DE DESENVOLVIMENTO

### Fase 1 — Foundation (4 semanas)
- Setup do projeto, Docker, CI/CD
- Autenticação completa (login, registro, refresh, logout, reset senha)
- Onboarding da empresa
- CRUD de produtos e categorias
- Controle de estoque básico

### Fase 2 — Core Comercial (4 semanas)
- CRUD de clientes e fornecedores
- Módulo de vendas completo
- Módulo de compras
- PDV básico
- Dashboard com KPIs

### Fase 3 — Financeiro (3 semanas)
- Contas a pagar e receber
- Fluxo de caixa
- Contas bancárias
- Relatórios financeiros básicos

### Fase 4 — Fiscal e Avançado (4 semanas)
- Integração NF-e
- PDV completo com leitor de barras
- Relatórios avançados com exportação
- Sistema de permissões granular
- Log de auditoria

### Fase 5 — Polimento e Launch (2 semanas)
- Testes de carga
- Documentação completa
- README com screenshots
- Landing page
- Publicação no GitHub

**Total estimado: ~17 semanas em ritmo paralelo ao trabalho**

---

## 12. DIFERENCIAIS DO PROJETO

- **Setup em um comando** — `docker compose up` e está funcionando
- **100% em português** — interface, documentação, mensagens de erro
- **Validação de dados brasileiros** — CPF, CNPJ, CEP, telefone, NF-e
- **Design profissional** — não parece sistema dos anos 2000
- **Multi-tenant nativo** — uma instalação, várias empresas
- **Open source MIT** — pode hospedar onde quiser, sem licença
- **Sem vendor lock-in** — exportação completa dos dados a qualquer momento
- **Primeiro cliente real:** ConcreArte — validação no mundo real antes do launch

---

*Documento gerado como planejamento inicial. Sujeito a revisão conforme o projeto evolui.*
