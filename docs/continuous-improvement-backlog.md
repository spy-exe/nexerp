# Continuous Improvement Backlog

Este backlog consolida as proximas rodadas depois da infraestrutura SaaS. Ele deve ser revisado a cada PR de polimento ou melhoria continua.

## Rodada 1 - Em andamento

Objetivo: institucionalizar uma rotina de qualidade e reduzir atritos rapidos encontrados pelo script de polimento.

- [x] Criar script `scripts/continuous-polish.ps1`.
- [x] Documentar uso do script em `docs/continuous-polish.md`.
- [x] Corrigir botao icon-only sem `aria-label` encontrado pelo scan.
- [ ] Rodar o script no CI em modo `quick`.
- [ ] Corrigir `catch` silencioso do logout.
- [ ] Normalizar tokens visuais base para reduzir radius excessivo em telas operacionais.

## Pendencias Principais

### 1. Corrigir achados do script

Escopo:

- Reduzir gradualmente `rounded-[24px]`, `rounded-[28px]` e `rounded-3xl` em superficies operacionais.
- Manter excecoes apenas em landing/auth quando a composicao visual justificar.
- Eliminar catches silenciosos em fluxos criticos.
- Garantir `aria-label` em botoes icon-only.

Resultado esperado:

- `scripts/continuous-polish.ps1 -Mode standard` sem achados `high` ou `medium`.
- UI com escala visual mais densa e consistente para ERP/SaaS.

### 2. Transformar o script em rotina de CI

Escopo:

- Adicionar job dedicado para executar `continuous-polish.ps1 -Mode quick`.
- Manter jobs existentes de backend e frontend.
- Avaliar `-Mode standard` para pipelines de release ou merges em `develop`.

Resultado esperado:

- PRs recebem validacao automatica de lint, type-check, testes e scans de polimento.

### 3. Polir UX de limites SaaS

Escopo:

- Mostrar alertas preventivos quando uso chegar perto de 80% do limite.
- Exibir limites nos fluxos de criacao de produto, venda e usuario.
- Melhorar mensagens de erro de `LimitExceededException` no frontend.

Resultado esperado:

- Usuario entende o limite antes de falhar no submit.

### 4. Fechar lacunas SaaS reais

Escopo:

- Criar endpoint e tela para gerenciamento de usuarios da empresa.
- Usar `UserService.create()` como caminho oficial de criacao.
- Validar `max_users` com UI e testes.
- Evoluir billing history com acoes administrativas ou simulacao de cobranca.

Resultado esperado:

- Limite de usuarios deixa de ser apenas servico interno e vira fluxo operacional completo.

### 5. Melhorar feedback continuo

Escopo:

- Adicionar status: `new`, `reviewing`, `resolved`.
- Adicionar prioridade e notas internas.
- Filtrar feedbacks por empresa, nota, status e periodo.
- Permitir marcar feedback como resolvido no painel admin.

Resultado esperado:

- Feedback vira fila de produto, nao apenas lista de mensagens.

### 6. Hardening tecnico

Escopo:

- Testar migrations com Alembic `upgrade` e `downgrade`.
- Validar superadmin e RLS em PostgreSQL real.
- Adicionar testes explicitos para middleware bloqueando `suspended` e `expired`.
- Revisar politicas RLS para tabelas SaaS e admin global.

Resultado esperado:

- Menos risco de regressao em ambiente real multi-tenant.

## Proxima Rodada Recomendada

Depois da Rodada 1, priorizar:

1. Usuarios da empresa + limite `max_users`.
2. Alertas preventivos de limite em produtos e vendas.
3. Status/prioridade para feedbacks.
