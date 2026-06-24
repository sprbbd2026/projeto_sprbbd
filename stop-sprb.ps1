# Encerra processos nas portas dos fronts/back e para containers PostgreSQL.

param(
    [switch]$SkipDocker,
    [switch]$Docker
)

$ErrorActionPreference = 'SilentlyContinue'
$Root = $PSScriptRoot

$Ports = @(8000, 8001, 5173, 5174)

function Stop-ListenersOnPort {
    param([int]$Port)

    $pids = @(
        Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue |
            Select-Object -ExpandProperty OwningProcess -Unique
    )

    foreach ($procId in $pids) {
        if ($procId -and $procId -ne 0) {
            Stop-Process -Id $procId -Force -ErrorAction SilentlyContinue
            Write-Host "Porta $Port -> processo $procId encerrado." -ForegroundColor Yellow
        }
    }
}

function Stop-UvicornOrphans {
    # Workers do uvicorn --reload ficam orfaos no Windows quando a janela e fechada.
    $patterns = @('uvicorn app.main', 'multiprocessing.spawn', 'spawn_main')
    Get-CimInstance Win32_Process -Filter "Name='python.exe'" -ErrorAction SilentlyContinue |
        Where-Object {
            $cmd = $_.CommandLine
            if (-not $cmd) { return $false }
            foreach ($pattern in $patterns) {
                if ($cmd -like "*$pattern*") { return $true }
            }
            return $false
        } |
        ForEach-Object {
            Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue
            Write-Host "Worker uvicorn $($_.ProcessId) encerrado." -ForegroundColor DarkYellow
        }
}

Write-Host "Encerrando servicos SPRB-BD..." -ForegroundColor Cyan

foreach ($port in $Ports) {
    Stop-ListenersOnPort -Port $port
}

Stop-UvicornOrphans

foreach ($port in $Ports) {
    Stop-ListenersOnPort -Port $port
}

if (-not $SkipDocker -and (Get-Command docker -ErrorAction SilentlyContinue)) {
    if ($Docker -or (Test-Path (Join-Path $Root 'docker-compose.yml'))) {
        Push-Location $Root
        docker compose down | Out-Null
        Pop-Location
        Write-Host "Stack Docker da raiz parada." -ForegroundColor Yellow
    }

    foreach ($back in @('ts1\ts1-back', 'ts2\ts2-back')) {
        $path = Join-Path $Root $back
        if (Test-Path $path) {
            Push-Location $path
            docker compose down | Out-Null
            Pop-Location
        }
    }

    Write-Host "Containers PostgreSQL parados." -ForegroundColor Yellow
}

Write-Host "Concluido." -ForegroundColor Green
