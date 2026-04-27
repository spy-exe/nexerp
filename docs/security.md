# Segurança

## Controles Implementados

- JWT access token curto e refresh token rotativo.
- Refresh token em cookie `HttpOnly`.
- Rate limit por endpoint sensível e limite global por IP.
- Headers: `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy` e `Permissions-Policy`.
- HSTS automático em `staging` e `production`.
- CORS configurável via `ALLOWED_ORIGINS`.
- Auditoria em ações críticas de autenticação, cadastro, estoque, financeiro, fiscal e permissões.
- Validação de produção bloqueia `SECRET_KEY` padrão e wildcard em CORS.

## Variáveis Relevantes

```env
ALLOWED_ORIGINS=https://app.exemplo.com
GLOBAL_RATE_LIMIT_PER_MINUTE=300
SECURITY_HEADERS_ENABLED=true
SECRET_KEY=gere_com_openssl_rand_hex_32
```

## Pendências Antes de Produção Real

- Configurar certificado A1/A3 para envio SOAP real da NF-e.
- Configurar SMTP real para reset de senha.
- Definir backup, retenção e rotação de logs.
- Executar teste de carga contra infraestrutura equivalente à produção.
