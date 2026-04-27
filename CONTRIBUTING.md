# Contribuindo com o NexERP

NexERP segue disciplina de produto: mudanças pequenas, testáveis e auditáveis.

## Fluxo de Branches

1. Atualize `develop`.
2. Crie `feature/nome`, `fix/nome` ou `refactor/nome`.
3. Faça commits atômicos usando Conventional Commits.
4. Rode validações locais.
5. Abra PR para `develop`.
6. Use squash merge após CI verde.

## Conventional Commits

Use:

```text
feat(auth): implement refresh token rotation
fix(stock): correct balance after purchase
docs(api): document fiscal endpoints
security(api): harden response headers
```

Não use mensagens genéricas como `update`, `fix things` ou `wip`.

## Validação Local

Backend:

```bash
cd backend
.venv\Scripts\python.exe -m ruff check .
.venv\Scripts\python.exe -m pytest
```

Frontend:

```bash
cd frontend
npm run type-check
npm run lint
npm run build
```

## Regras Técnicas

- Nunca commite `.env`, certificados, chaves ou dumps de banco.
- Toda query de negócio deve filtrar por `company_id`.
- Dados sensíveis nunca entram em responses.
- Exclusão de domínio deve ser soft delete.
- Ações críticas exigem auditoria.
- Novas rotas precisam de `summary`, `response_model` e permissão explícita quando autenticadas.
- Frontend deve permanecer 100% em português.
- Dependências novas precisam de justificativa e versão controlada.

## Testes de Carga

Veja [docs/load-testing.md](docs/load-testing.md).

## Segurança

Veja [docs/security.md](docs/security.md).
