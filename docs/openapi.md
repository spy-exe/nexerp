# OpenAPI NexERP

A API expõe documentação interativa automaticamente pelo FastAPI:

- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`
- Especificação JSON: `http://localhost:8000/openapi.json`

## Grupos de Endpoints

| Tag | Escopo |
| --- | --- |
| `auth` | Registro, login, refresh token, logout, reset e sessão atual |
| `companies` | Dados da empresa e onboarding |
| `dashboard` | KPIs operacionais |
| `customers` / `suppliers` | Cadastros comerciais |
| `products` / `categories` | Catálogo |
| `sales` / `purchases` | Operação comercial e PDV |
| `stock` | Saldos e movimentações |
| `finance` | Contas, categorias, transações, fluxo de caixa e exportações |
| `fiscal` | NF-e modelo 55 em homologação |
| `reports` | Relatórios avançados |
| `audit` | Logs de ações críticas |
| `permissions` | Permissões granulares por módulo |

## Exportar Contrato

```bash
curl http://localhost:8000/openapi.json -o docs/openapi.json
```

O arquivo exportado pode ser usado por geradores de clientes HTTP, ferramentas de QA ou portais de documentação.
