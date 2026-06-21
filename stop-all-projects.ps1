# Script para parar todos os projetos iniciados via Start-Job

$jobNames = @("ts1-back", "ts1-front", "ts2-back", "ts2-front")

Write-Host "Parando jobs dos projetos..." -ForegroundColor Yellow

foreach ($name in $jobNames) {
    $job = Get-Job -Name $name -ErrorAction SilentlyContinue
    if ($job) {
        Stop-Job -Name $name -ErrorAction SilentlyContinue
        Remove-Job -Name $name -Force -ErrorAction SilentlyContinue
        Write-Host "Parado e removido: $name" -ForegroundColor Green
    } else {
        Write-Host "Nao encontrado: $name" -ForegroundColor DarkGray
    }
}

Write-Host "Concluido." -ForegroundColor Cyan
