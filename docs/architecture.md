# Arquitetura NexERP

## Visão Geral

O NexERP foi estruturado como uma aplicação multi-tenant com separação clara entre frontend, backend e infraestrutura auxiliar.

```text
Next.js 15 (App Router)
        |
        v
FastAPI + Service Layer + SQLAlchemy 2.x
        |
        +--> PostgreSQL 16
        +--> Redis
        +--> Celery
```

## Backend

- `app/api/v1`: superfície HTTP versionada.
- `app/services`: regras de negócio de autenticação, comercial, estoque, financeiro, fiscal, permissões e relatórios.
- `app/models`: entidades SQLAlchemy com `company_id` nas tabelas multi-tenant.
- `app/core`: configuração, banco, segurança, dependências, rate limit e token store.
- `migrations`: baseline Alembic com RLS habilitado para PostgreSQL.

## Frontend

- `app/(auth)`: login, registro, recuperação e reset de senha.
- `app/(app)`: shell autenticado com dashboard, comercial, estoque, financeiro, fiscal, relatórios e configurações.
- `app/onboarding`: conclusão operacional da empresa logo após o primeiro acesso.
- `lib`: cliente HTTP, validações Zod e helpers de autenticação.
- `stores`: sessão em Zustand com persistência local do access token.

## Segurança

- Access token JWT curto e refresh token rotativo.
- Refresh token em cookie HttpOnly e trilha de revogação.
- Rate limit no backend com Redis e fallback em memória para desenvolvimento/teste.
- Auditoria para registro, login, reset de senha, onboarding, categorias, produtos, estoque, financeiro, fiscal e permissões.
- Headers de segurança e limite global por IP no middleware HTTP.

## Multi-Tenant

- `company_id` em tabelas de escopo empresarial.
- Serviços sempre consultam por `company_id`.
- Migration inicial já habilita Row Level Security no PostgreSQL para as principais tabelas.

## Estado v1.0.0

Já implementado:

- Base FastAPI com health check
- Base Next.js com Tailwind e shell autenticado
- Models SQLAlchemy e migration Alembic inicial
- Registro da empresa + primeiro usuário admin
- Login, refresh, logout, forgot/reset password
- Onboarding de empresa
- CRUD base de categorias e produtos
- Controle básico de estoque com movimentação e saldo
- Clientes, fornecedores, vendas, compras e PDV
- Financeiro com contas, transações, contas a pagar/receber, fluxo de caixa e exportações
- Fiscal com NF-e modelo 55 em homologação
- Relatórios avançados
- Permissões granulares e auditoria consultável
- Landing page, documentação e testes de carga básicos

Próxima expansão natural:

- cliente SOAP real da SEFAZ com certificado A1/A3
- emissão NFC-e e contingência fiscal
- multi-filiais e centros de custo
- suíte E2E browser com dados seed
