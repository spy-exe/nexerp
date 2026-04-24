# NexERP

> ERP open source para pequenas e médias empresas brasileiras.

## ✨ Características

- 100% em português
- Setup em um comando
- Segurança de produção desde o primeiro dia
- Multi-tenant nativo
- NF-e integrada
- Dashboard com KPIs em tempo real
- Gestão financeira completa
- Relatórios exportáveis (PDF e Excel)

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Backend | FastAPI + Python 3.12 |
| Frontend | Next.js 14 + TypeScript |
| Banco de dados | PostgreSQL 16 |
| Cache/Filas | Redis + Celery |
| Proxy | Caddy (SSL automático) |
| Container | Docker + Docker Compose |

## Início Rápido

```bash
# Clone o repositório
git clone https://github.com/SEU_USUARIO/nexerp.git
cd nexerp

# Configure as variáveis de ambiente
cp .env.example .env
# Edite o .env com suas configurações

# Suba o ambiente
docker compose up -d

# Acesse
# Frontend: http://localhost:3000
# API docs: http://localhost:8000/docs
```

## Documentação

- [Arquitetura](docs/architecture.md)
- [API Reference](http://localhost:8000/docs)
- [Contribuindo](CONTRIBUTING.md)

## Licença

MIT License - veja [LICENSE](LICENSE) para detalhes.
