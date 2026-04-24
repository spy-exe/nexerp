# Arquitetura NexERP

## Visão Geral

O NexERP foi estruturado como uma aplicação multi-tenant com separação clara entre frontend, backend e infraestrutura auxiliar.

```text
Next.js 14 (App Router)
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
- `app/services`: regras de negócio de autenticação, onboarding, catálogo e estoque.
- `app/models`: entidades SQLAlchemy com `company_id` nas tabelas multi-tenant.
- `app/core`: configuração, banco, segurança, dependências, rate limit e token store.
- `migrations`: baseline Alembic com RLS habilitado para PostgreSQL.

## Frontend

- `app/(auth)`: login, registro, recuperação e reset de senha.
- `app/(app)`: shell autenticado com dashboard, produtos, categorias, estoque e configurações iniciais.
- `app/onboarding`: conclusão operacional da empresa logo após o primeiro acesso.
- `lib`: cliente HTTP, validações Zod e helpers de autenticação.
- `stores`: sessão em Zustand com persistência local do access token.

## Segurança

- Access token JWT curto e refresh token rotativo.
- Refresh token em cookie HttpOnly e trilha de revogação.
- Rate limit no backend com Redis e fallback em memória para desenvolvimento/teste.
- Auditoria para registro, login, reset de senha, onboarding, categorias, produtos e estoque.

## Multi-Tenant

- `company_id` em tabelas de escopo empresarial.
- Serviços sempre consultam por `company_id`.
- Migration inicial já habilita Row Level Security no PostgreSQL para as principais tabelas.

## Estado da Fase 1

Já implementado:

- Base FastAPI com health check
- Base Next.js com Tailwind e shell autenticado
- Models SQLAlchemy e migration Alembic inicial
- Registro da empresa + primeiro usuário admin
- Login, refresh, logout, forgot/reset password
- Onboarding de empresa
- CRUD base de categorias e produtos
- Controle básico de estoque com movimentação e saldo

Próxima expansão natural:

- middleware de permissões mais granular no frontend
- wizard de onboarding multi-etapas
- edição/arquivamento via UI
- dashboards com KPIs reais
