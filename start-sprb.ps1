# Sobe TS1 + TS2 (PostgreSQL, backends e fronts).
#
# Modo local (padrao): abre 4 janelas com uvicorn + vite.
# Modo Docker: usa docker-compose.yml na raiz do repositorio.
#
# Uso:
#   .\start-sprb.ps1
#   .\start-sprb.ps1 -Docker
#   .\start-sprb.ps1 -SkipDb

param(
    [switch]$Docker,
    [switch]$SkipDb
)

$ErrorActionPreference = 'Stop'
$Root = $PSScriptRoot

$Paths = @{
    Ts1Back  = Join-Path $Root 'ts1\ts1-back'
    Ts2Back  = Join-Path $Root 'ts2\ts2-back'
    Ts1Front = Join-Path $Root 'ts1\ts1-front'
    Ts2Front = Join-Path $Root 'ts2\ts2-front'
}

$Ports = @{
    Ts1Api   = 8000
    Ts2Api   = 8001
    Ts1Front = 5173
    Ts2Front = 5174
    Ts1Db    = 5432
    Ts2Db    = 5433
}

function Test-Command {
    param([string]$Name)
    return [bool](Get-Command $Name -ErrorAction SilentlyContinue)
}

function Assert-PathExists {
    param([string]$Path, [string]$Label)
    if (-not (Test-Path $Path)) {
        throw "Pasta nao encontrada ($Label): $Path"
    }
}

function Start-DevWindow {
    param(
        [string]$Title,
        [string]$WorkingDirectory,
        [string]$Command
    )

    $escapedDir = $WorkingDirectory.Replace("'", "''")
    $banner = "Write-Host '=== $Title ===' -ForegroundColor Cyan"
    $scriptBlock = "$banner; Set-Location '$escapedDir'; $Command"

    Start-Process powershell -ArgumentList @(
        '-NoExit',
        '-ExecutionPolicy', 'Bypass',
        '-Command', $scriptBlock
    ) | Out-Null
}

function Start-RootDocker {
    if (-not (Test-Command docker)) {
        throw "Docker nao encontrado. Instale Docker Desktop ou use o modo local (sem -Docker)."
    }

    Push-Location $Root
    try {
        Write-Host "Subindo stack completa via Docker Compose..." -ForegroundColor Yellow
        docker compose up --build
    }
    finally {
        Pop-Location
    }
}

function Start-LocalDatabases {
    if (-not (Test-Command docker)) {
        Write-Warning "Docker nao encontrado. Suba os PostgreSQL manualmente (5432 e 5433)."
        return
    }

    foreach ($item in @(
            @{ Path = $Paths.Ts1Back; Label = "TS1 :$($Ports.Ts1Db)" },
            @{ Path = $Paths.Ts2Back; Label = "TS2 :$($Ports.Ts2Db)" }
        )) {
        Push-Location $item.Path
        try {
            Write-Host "Subindo PostgreSQL ($($item.Label))..." -ForegroundColor Yellow
            docker compose up -d
            if ($LASTEXITCODE -ne 0) {
                throw "Falha ao subir o container de $($item.Label)."
            }
        }
        finally {
            Pop-Location
        }
    }

    Write-Host "Aguardando PostgreSQL inicializar (5s)..." -ForegroundColor DarkGray
    Start-Sleep -Seconds 5
}

function Ensure-BackendDeps {
    param([string]$BackPath, [string]$Label)

    if (-not (Test-Command uv)) {
        throw "Comando 'uv' nao encontrado. Instale: https://github.com/astral-sh/uv"
    }

    $venvPython = Join-Path $BackPath '.venv\Scripts\python.exe'
    if (-not (Test-Path $venvPython)) {
        Write-Host "Sincronizando dependencias Python ($Label)..." -ForegroundColor Yellow
        Push-Location $BackPath
        try {
            uv sync
        }
        finally {
            Pop-Location
        }
    }
}

function Ensure-FrontendDeps {
    param([string]$FrontPath, [string]$Label)

    if (-not (Test-Command npm)) {
        throw "Comando 'npm' nao encontrado. Instale Node.js: https://nodejs.org/"
    }

    $nodeModules = Join-Path $FrontPath 'node_modules'
    $lockFile = Join-Path $FrontPath 'package-lock.json'
    $needsInstall = -not (Test-Path $nodeModules)

    if (-not $needsInstall -and (Test-Path $lockFile)) {
        $lockTime = (Get-Item $lockFile).LastWriteTime
        $modulesTime = (Get-Item $nodeModules).LastWriteTime
        if ($lockTime -gt $modulesTime) {
            $needsInstall = $true
        }
    }

    if ($needsInstall) {
        Write-Host "Instalando/atualizando dependencias npm ($Label)..." -ForegroundColor Yellow
        Push-Location $FrontPath
        try {
            npm install
        }
        finally {
            Pop-Location
        }
    }
}

foreach ($entry in $Paths.GetEnumerator()) {
    Assert-PathExists -Path $entry.Value -Label $entry.Key
}

if ($Docker) {
    Start-RootDocker
    exit 0
}

# Evita portas presas por instancias antigas (uvicorn --reload no Windows).
$stopScript = Join-Path $Root 'stop-sprb.ps1'
if (Test-Path $stopScript) {
    Write-Host "Encerrando instancias antigas nas portas 8000/8001/5173/5174..." -ForegroundColor DarkGray
    & $stopScript -SkipDocker | Out-Null
}

if (-not $SkipDb) {
    Start-LocalDatabases
}

Ensure-BackendDeps -BackPath $Paths.Ts1Back -Label 'TS1'
Ensure-BackendDeps -BackPath $Paths.Ts2Back -Label 'TS2'
Ensure-FrontendDeps -FrontPath $Paths.Ts1Front -Label 'TS1'
Ensure-FrontendDeps -FrontPath $Paths.Ts2Front -Label 'TS2'

Write-Host ""
Write-Host "Abrindo servicos em novas janelas..." -ForegroundColor Green
Write-Host "  TS1 API   -> http://127.0.0.1:$($Ports.Ts1Api)/docs"
Write-Host "  TS2 API   -> http://127.0.0.1:$($Ports.Ts2Api)/docs"
Write-Host "  TS1 Front -> http://127.0.0.1:$($Ports.Ts1Front)"
Write-Host "  TS2 Front -> http://127.0.0.1:$($Ports.Ts2Front)"
Write-Host ""
Write-Host "Para encerrar: .\stop-sprb.bat" -ForegroundColor DarkGray
Write-Host "Modo Docker:  .\start-sprb.bat -Docker" -ForegroundColor DarkGray
Write-Host ""

Start-DevWindow `
    -Title "TS1 Backend :$($Ports.Ts1Api)" `
    -WorkingDirectory $Paths.Ts1Back `
    -Command "uv run uvicorn app.main:app --reload --host 127.0.0.1 --port $($Ports.Ts1Api)"

Start-Sleep -Milliseconds 500

Start-DevWindow `
    -Title "TS2 Backend :$($Ports.Ts2Api)" `
    -WorkingDirectory $Paths.Ts2Back `
    -Command "uv run uvicorn app.main:app --reload --host 127.0.0.1 --port $($Ports.Ts2Api)"

Start-Sleep -Milliseconds 500

Start-DevWindow `
    -Title "TS1 Frontend :$($Ports.Ts1Front)" `
    -WorkingDirectory $Paths.Ts1Front `
    -Command "npm run dev -- --host 127.0.0.1 --port $($Ports.Ts1Front)"

Start-Sleep -Milliseconds 500

Start-DevWindow `
    -Title "TS2 Frontend :$($Ports.Ts2Front)" `
    -WorkingDirectory $Paths.Ts2Front `
    -Command "npm run dev -- --host 127.0.0.1 --port $($Ports.Ts2Front)"

Write-Host "Servicos iniciados." -ForegroundColor Green
