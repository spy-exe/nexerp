# QA Gate - 2026-05-02

Branch avaliada: `feature/branding-ui`

Destino `production`: bloqueado operacionalmente. Nao existe branch local `production` nem remoto `origin/production` neste checkout.

## Resultado

Status: aprovado para o escopo visual validado; bloqueado para release completo ate revisar riscos de backend e higiene do worktree.

## Evidencias

Screenshots Playwright: `.qa/cycle-2026-05-02-03/`

Capturas concluídas sem falha:

- `landing.png`
- `login.png`
- `register.png`
- `forgot-password.png`
- `terms.png`
- `privacy.png`
- `dashboard-dark.png`
- `products-dark.png`
- `categories-dark.png`
- `pos-dark.png`
- `stock-dark.png`
- `customers-dark.png`
- `suppliers-dark.png`
- `finance-dark.png`
- `purchases-dark.png`
- `reports-dark.png`
- `settings-dark.png`
- `dashboard-light.png`
- `products-light.png`
- `categories-light.png`
- `dashboard-mobile.png`
- `products-mobile.png`

## Validacoes executadas

- `npm run type-check` em `frontend`: passou.
- `npm run lint` em `frontend`: passou.
- `docker compose exec backend pytest -q`: passou, `11 passed`.
- QA visual automatizado com Chromium headless: passou.
- Console do browser: sem erros.
- Page errors: sem erros.
- Respostas HTTP >= 400 durante o fluxo validado: nenhuma.
- Detector de blocos claros indevidos no dark mode: sem achados na ultima rodada.

## Aprovado no visual

- Tela de recuperacao de senha corrigida: o titulo saiu do azul escuro sem contraste e agora esta legivel no fundo escuro.
- Telas de Termos de Uso e Politica de Privacidade existem, carregam e mantem contraste adequado.
- Dashboard em dark mode, light mode e mobile carregou sem regressao visual evidente.
- Paginas de produtos, categorias, PDV, estoque, clientes, fornecedores, financeiro, compras, relatorios e configuracoes carregaram em dark mode sem blocos brancos indevidos.
- Toggle de tema aparece no app autenticado e alterna entre dark/light.

## Bloqueios para production

- `backend/app/api/v1/auth.py`: limite de login mudou de `5` para `50` tentativas em 15 minutos. Isso reduz protecao contra brute force e precisa de justificativa explicita antes de release.
- `backend/app/services/sale_service.py`: venda agora cria transacao financeira automaticamente na primeira conta ativa. Precisa de teste cobrindo idempotencia, conta escolhida, saldo, conciliacao e compatibilidade com multiplos meios de pagamento.
- O fluxo de compra nao cria despesa financeira equivalente, entao o comportamento financeiro ficou assimetrico entre venda e compra.
- Existem arquivos nao rastreados que nao devem ir para production sem revisao: `backend/nexerp.db`, `backend/run_seed.py`, `backend/seed.py`, `frontend/frontend/`.

## Decisao QA

Nao liberar a branch inteira como production neste estado.

Liberavel: escopo visual validado nesta rodada.

Nao liberavel sem revisao: alteracoes de seguranca/autenticacao, lancamento financeiro automatico e arquivos nao rastreados de ambiente/seed.
