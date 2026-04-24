# Contribuindo

## Fluxo

1. Parta de `develop`.
2. Crie uma branch `feature/*`, `fix/*` ou `refactor/*`.
3. Rode validações locais antes de abrir PR.
4. Use Conventional Commits.

## Backend

```bash
cd backend
.venv\Scripts\python.exe -m ruff check .
.venv\Scripts\python.exe -m pytest
```

## Frontend

```bash
cd frontend
npm run type-check
npm run lint
npm run build
```

## Regras

- Nunca commite `.env`
- Nunca faça push direto em `main`
- Toda feature deve respeitar `company_id`
- Auditoria é obrigatória para ações críticas
