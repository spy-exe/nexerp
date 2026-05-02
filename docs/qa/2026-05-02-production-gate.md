# QA Gate - 2026-05-02

Branch avaliada: `feature/branding-ui`

Destino `production`: bloqueado operacionalmente. Nao existe branch local `production` nem remoto `origin/production` neste checkout.

## Resultado

Status: aprovado para o escopo validado; release completo ainda depende da definicao do destino de producao (`main` ou uma branch `production` criada/protegida).

## Evidencias

Screenshots Playwright: `.qa/cycle-2026-05-02-04/`

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
- `purchases-light.png`
- `dashboard-mobile.png`
- `products-mobile.png`
- `purchases-mobile.png`

## Validacoes executadas

- `npm run type-check` em `frontend`: passou.
- `npm run lint` em `frontend`: passou.
- `npm run build` em `frontend`: passou.
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
- Compras exibem toggle "Gerar despesa no financeiro" com botao de informacao em dark, light e mobile.

## Decisoes registradas

- Rate limit de login `5 -> 50` foi aceito como decisao de produto para evitar bloqueio operacional durante testes.
- Venda cria transacao financeira de receita na primeira conta ativa, vinculada ao cliente quando houver.
- Compra pode criar transacao financeira de despesa quando `create_financial_transaction` estiver ativo, vinculada ao fornecedor.
- Artefatos locais foram bloqueados no `.gitignore`: `backend/*.db`, `backend/run_seed.py`, `backend/seed.py`, `frontend/frontend/`.

## Bloqueios para production

- Nao existe branch local/remota `production`; definir se producao sera `main` ou criar `production`.
- Antes do merge final, confirmar se `feature/branding-ui` sera promovida inteira ou se o release sera fatiado por PRs menores.

## Decisao QA

Nao fazer merge direto sem branch alvo e PR/gate final.

Liberavel: escopo validado nesta rodada.

Nao liberavel sem decisao: destino de producao e politica de promocao da branch.
