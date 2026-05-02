# Continuous Polish

Use este script como rotina de melhoria continua antes de abrir, atualizar ou revisar PRs.

```powershell
pwsh -File .\scripts\continuous-polish.ps1 -Mode standard
```

Modos:

- `quick`: snapshot Git, scans estaticos, `ruff`, `npm run lint` e `npm run type-check`.
- `standard`: tudo do `quick`, mais `pytest` e `npm run build`.
- `full`: tudo do `standard`, mais `npm audit` informativo.

Opcoes uteis:

- `-BackendPython C:\path\to\python.exe`: usa uma venv especifica.
- `-SkipBackend` ou `-SkipFrontend`: isola uma faixa de trabalho.
- `-NoBuild`: mantem `standard`, mas pula o build frontend.
- `-FailOnFindings`: falha tambem quando scans estaticos acharem severidade `high` ou `medium`.

O script gera um relatorio Markdown em `docs/reports/`, ignorado pelo Git. O relatorio inclui checks executados, saidas resumidas e achados acionaveis de polimento visual, acessibilidade, resiliencia e codigo.
