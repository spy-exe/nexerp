[CmdletBinding()]
param(
    [ValidateSet("quick", "standard", "full")]
    [string] $Mode = "standard",

    [string] $ReportPath = "",

    [string] $BackendPython = "",

    [switch] $SkipBackend,

    [switch] $SkipFrontend,

    [switch] $NoBuild,

    [switch] $FailOnFindings
)

$ErrorActionPreference = "Stop"

$ScriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$RepoRoot = Resolve-Path (Join-Path $ScriptRoot "..")
$BackendRoot = Join-Path $RepoRoot "backend"
$FrontendRoot = Join-Path $RepoRoot "frontend"
$Timestamp = Get-Date -Format "yyyyMMdd-HHmmss"

if ([string]::IsNullOrWhiteSpace($ReportPath)) {
    $ReportDir = Join-Path $RepoRoot "docs\reports"
    $ReportPath = Join-Path $ReportDir "continuous-polish-$Timestamp.md"
} else {
    $ReportDir = Split-Path -Parent $ReportPath
}

if (-not [string]::IsNullOrWhiteSpace($ReportDir)) {
    New-Item -ItemType Directory -Force -Path $ReportDir | Out-Null
}

$Results = New-Object System.Collections.Generic.List[object]
$Findings = New-Object System.Collections.Generic.List[object]

function Add-Result {
    param(
        [string] $Area,
        [string] $Name,
        [string] $Status,
        [string] $Details,
        [double] $Seconds
    )

    $script:Results.Add([pscustomobject]@{
        Area = $Area
        Name = $Name
        Status = $Status
        Details = $Details
        Seconds = [math]::Round($Seconds, 2)
    }) | Out-Null
}

function Add-Finding {
    param(
        [string] $Severity,
        [string] $Area,
        [string] $Message,
        [string] $Action
    )

    $script:Findings.Add([pscustomobject]@{
        Severity = $Severity
        Area = $Area
        Message = $Message
        Action = $Action
    }) | Out-Null
}

function Invoke-PolishCommand {
    param(
        [string] $Area,
        [string] $Name,
        [string] $WorkingDirectory,
        [string] $FilePath,
        [string[]] $Arguments,
        [switch] $Informational
    )

    $timer = [System.Diagnostics.Stopwatch]::StartNew()
    Push-Location $WorkingDirectory
    try {
        $output = & $FilePath @Arguments 2>&1
        $exitCode = $LASTEXITCODE
        $timer.Stop()
        $tail = (($output | Select-Object -Last 12) -join "`n").Trim()
        if ([string]::IsNullOrWhiteSpace($tail)) {
            $tail = "Sem saída relevante."
        }

        if ($exitCode -eq 0 -or $Informational) {
            $status = if ($exitCode -eq 0) { "pass" } else { "info" }
            Add-Result -Area $Area -Name $Name -Status $status -Details $tail -Seconds $timer.Elapsed.TotalSeconds
        } else {
            Add-Result -Area $Area -Name $Name -Status "fail" -Details $tail -Seconds $timer.Elapsed.TotalSeconds
        }
    } finally {
        Pop-Location
    }
}

function Resolve-BackendPython {
    if (-not [string]::IsNullOrWhiteSpace($BackendPython)) {
        return $BackendPython
    }

    $candidates = @(
        (Join-Path $BackendRoot ".venv\Scripts\python.exe"),
        (Join-Path $RepoRoot ".venv\Scripts\python.exe")
    )

    foreach ($candidate in $candidates) {
        if (Test-Path $candidate) {
            return $candidate
        }
    }

    $pythonCommand = Get-Command python -ErrorAction SilentlyContinue
    if ($pythonCommand) {
        return $pythonCommand.Source
    }

    $pyCommand = Get-Command py -ErrorAction SilentlyContinue
    if ($pyCommand) {
        return $pyCommand.Source
    }

    throw "Python não encontrado. Informe -BackendPython apontando para o python da venv."
}

function Invoke-RipgrepCount {
    param(
        [string] $Pattern,
        [string[]] $Paths,
        [string[]] $Globs = @()
    )

    $rg = Get-Command rg -ErrorAction SilentlyContinue
    if (-not $rg) {
        return $null
    }

    $args = @("--line-number", "--no-heading", $Pattern)
    foreach ($glob in $Globs) {
        $args += "--glob"
        $args += $glob
    }
    $args += $Paths

    Push-Location $RepoRoot
    try {
        $matches = & $rg.Source @args 2>$null
        if ($LASTEXITCODE -eq 1) {
            return 0
        }
        return @($matches).Count
    } finally {
        Pop-Location
    }
}

function Invoke-StaticScans {
    $timer = [System.Diagnostics.Stopwatch]::StartNew()

    $todoCount = Invoke-RipgrepCount -Pattern "TODO|FIXME|HACK|console\.log" -Paths @("backend", "frontend") -Globs @("*.py", "*.ts", "*.tsx")
    if ($null -ne $todoCount -and $todoCount -gt 0) {
        Add-Finding -Severity "medium" -Area "code" -Message "$todoCount marcações TODO/FIXME/HACK ou console.log encontradas." -Action "Triar itens e converter os que forem reais em issues ou remover ruído."
    }

    $largeRadiusCount = Invoke-RipgrepCount -Pattern "rounded-\[2[48]px\]|rounded-3xl" -Paths @("frontend/app", "frontend/components") -Globs @("*.tsx")
    if ($null -ne $largeRadiusCount -and $largeRadiusCount -gt 0) {
        Add-Finding -Severity "low" -Area "visual" -Message "$largeRadiusCount ocorrências de radius grande em superfícies de app." -Action "Reduzir gradualmente para uma escala mais operacional, priorizando dashboards e formulários densos."
    }

    $iconButtonsWithoutAria = 0
    foreach ($file in Get-ChildItem -Path (Join-Path $RepoRoot "frontend\app"), (Join-Path $RepoRoot "frontend\components") -Recurse -Filter "*.tsx") {
        foreach ($line in Get-Content -LiteralPath $file.FullName) {
            if ($line -like '*size="icon"*' -and $line -notlike '*aria-label*') {
                $iconButtonsWithoutAria += 1
            }
        }
    }
    if ($null -ne $iconButtonsWithoutAria -and $iconButtonsWithoutAria -gt 0) {
        Add-Finding -Severity "medium" -Area "accessibility" -Message "$iconButtonsWithoutAria botões icon-only podem estar sem aria-label na mesma linha." -Action "Adicionar aria-label explícito nos botões de ícone."
    }

    $emptyCatchCount = Invoke-RipgrepCount -Pattern "catch\s*\([^)]*\)\s*=>\s*undefined|catch\s*\{[^}]*undefined" -Paths @("frontend", "backend") -Globs @("*.py", "*.ts", "*.tsx")
    if ($null -ne $emptyCatchCount -and $emptyCatchCount -gt 0) {
        Add-Finding -Severity "low" -Area "resilience" -Message "$emptyCatchCount catches silenciosos detectados." -Action "Confirmar se são intencionais e registrar falhas relevantes em fluxos críticos."
    }

    $requiredFiles = @(
        "backend/app/services/subscription_service.py",
        "backend/app/core/subscription_middleware.py",
        "frontend/app/(app)/admin/page.tsx",
        "frontend/app/(app)/settings/subscription/page.tsx",
        "frontend/app/(app)/settings/feedback/page.tsx"
    )

    foreach ($file in $requiredFiles) {
        if (-not (Test-Path (Join-Path $RepoRoot $file))) {
            Add-Finding -Severity "high" -Area "product" -Message "Arquivo esperado ausente: $file" -Action "Restaurar a superfície SaaS antes do próximo release."
        }
    }

    $timer.Stop()
    Add-Result -Area "static" -Name "polish scans" -Status "pass" -Details "Scans concluídos. Findings: $($Findings.Count)." -Seconds $timer.Elapsed.TotalSeconds
}

function Invoke-GitSnapshot {
    $timer = [System.Diagnostics.Stopwatch]::StartNew()
    Push-Location $RepoRoot
    try {
        $branch = (& git branch --show-current 2>&1) -join "`n"
        $status = (& git status --short 2>&1) -join "`n"
        if ([string]::IsNullOrWhiteSpace($status)) {
            $status = "Worktree limpo."
        }
        Add-Result -Area "git" -Name "snapshot" -Status "info" -Details "Branch: $branch`n$status" -Seconds $timer.Elapsed.TotalSeconds
    } finally {
        Pop-Location
    }
}

function Write-Report {
    $failed = @($Results | Where-Object { $_.Status -eq "fail" }).Count
    $warnings = @($Findings | Where-Object { $_.Severity -in @("high", "medium") }).Count

    $lines = New-Object System.Collections.Generic.List[string]
    $lines.Add("# Continuous Polish Report") | Out-Null
    $lines.Add("") | Out-Null
    $generatedAt = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $lines.Add("- Generated: $generatedAt") | Out-Null
    $lines.Add("- Mode: ``" + $Mode + "``") | Out-Null
    $lines.Add("- Failed checks: $failed") | Out-Null
    $lines.Add("- Actionable findings: $warnings") | Out-Null
    $lines.Add("") | Out-Null
    $lines.Add("## Checks") | Out-Null
    $lines.Add("") | Out-Null
    $lines.Add("| Area | Check | Status | Seconds |") | Out-Null
    $lines.Add("| --- | --- | --- | ---: |") | Out-Null
    foreach ($result in $Results) {
        $lines.Add("| $($result.Area) | $($result.Name) | $($result.Status) | $($result.Seconds) |") | Out-Null
    }
    $lines.Add("") | Out-Null
    $lines.Add("## Findings") | Out-Null
    $lines.Add("") | Out-Null
    if ($Findings.Count -eq 0) {
        $lines.Add("No static findings detected.") | Out-Null
    } else {
        $lines.Add("| Severity | Area | Finding | Suggested action |") | Out-Null
        $lines.Add("| --- | --- | --- | --- |") | Out-Null
        foreach ($finding in $Findings) {
            $lines.Add("| $($finding.Severity) | $($finding.Area) | $($finding.Message) | $($finding.Action) |") | Out-Null
        }
    }
    $lines.Add("") | Out-Null
    $lines.Add("## Command Details") | Out-Null
    foreach ($result in $Results) {
        $lines.Add("") | Out-Null
        $lines.Add("### $($result.Area): $($result.Name)") | Out-Null
        $lines.Add("") | Out-Null
        $lines.Add("Status: ``" + $result.Status + "``") | Out-Null
        $lines.Add("") | Out-Null
        $lines.Add("``````text") | Out-Null
        $lines.Add($result.Details) | Out-Null
        $lines.Add("``````") | Out-Null
    }

    Set-Content -Path $ReportPath -Value $lines -Encoding UTF8
    Write-Host "Continuous polish report: $ReportPath"
}

Invoke-GitSnapshot
Invoke-StaticScans

if (-not $SkipBackend) {
    $python = Resolve-BackendPython
    Invoke-PolishCommand -Area "backend" -Name "ruff" -WorkingDirectory $BackendRoot -FilePath $python -Arguments @("-m", "ruff", "check", ".")

    if ($Mode -in @("standard", "full")) {
        $pytestTemp = Join-Path $BackendRoot ".tmp\pytest-continuous-polish-$Timestamp"
        New-Item -ItemType Directory -Force -Path (Split-Path -Parent $pytestTemp) | Out-Null
        Invoke-PolishCommand -Area "backend" -Name "pytest" -WorkingDirectory $BackendRoot -FilePath $python -Arguments @("-m", "pytest", "-p", "no:cacheprovider", "--basetemp", $pytestTemp)
    }
}

if (-not $SkipFrontend) {
    $npm = Get-Command npm.cmd -ErrorAction SilentlyContinue
    if (-not $npm) {
        $npm = Get-Command npm -ErrorAction SilentlyContinue
    }
    if (-not $npm) {
        throw "npm não encontrado."
    }

    Invoke-PolishCommand -Area "frontend" -Name "lint" -WorkingDirectory $FrontendRoot -FilePath $npm.Source -Arguments @("run", "lint")
    Invoke-PolishCommand -Area "frontend" -Name "type-check" -WorkingDirectory $FrontendRoot -FilePath $npm.Source -Arguments @("run", "type-check")

    if (($Mode -in @("standard", "full")) -and -not $NoBuild) {
        Invoke-PolishCommand -Area "frontend" -Name "build" -WorkingDirectory $FrontendRoot -FilePath $npm.Source -Arguments @("run", "build")
    }

    if ($Mode -eq "full") {
        Invoke-PolishCommand -Area "frontend" -Name "npm audit" -WorkingDirectory $FrontendRoot -FilePath $npm.Source -Arguments @("audit", "--audit-level=moderate") -Informational
    }
}

Write-Report

$hasFailures = @($Results | Where-Object { $_.Status -eq "fail" }).Count -gt 0
$hasBlockingFindings = $FailOnFindings -and (@($Findings | Where-Object { $_.Severity -in @("high", "medium") }).Count -gt 0)
if ($hasFailures -or $hasBlockingFindings) {
    exit 1
}
