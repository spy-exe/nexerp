# Testes de Carga

O arquivo `backend/locustfile.py` cobre cenários básicos de leitura autenticada:

- Login de usuário demo
- Dashboard
- Produtos
- Vendas
- Documentos fiscais

## Preparar Usuário Demo

Crie no ambiente alvo um usuário com:

- E-mail: `admin@demo.nexerp.local`
- Senha: `Senha@123`

## Executar

```bash
cd backend
locust -f locustfile.py --host http://localhost:8000
```

Para smoke test headless:

```bash
locust -f locustfile.py --host http://localhost:8000 --headless -u 10 -r 2 -t 1m
```
