# Script para rodar os 4 projetos simultaneamente

$projectPath = "c:\Users\Elias\Documents\mestrado\disciplinas\2026\1 Semestre\CE-229 Teste de Software\projeto_sprbbd"

Write-Host "🚀 Iniciando os 4 projetos...`n" -ForegroundColor Green

# ts1-back (porta 8000)
Write-Host "📡 ts1-back (porta 8000)..." -ForegroundColor Cyan
Start-Job -ScriptBlock {
    Set-Location "$using:projectPath\ts1\ts1-back"
    Write-Host "Iniciando ts1-back..."
    uv run uvicorn app.main:app --reload --port 8000
} -Name "ts1-back"

# ts1-front (porta 5173)
Write-Host "🎨 ts1-front (porta 5173)..." -ForegroundColor Cyan
Start-Job -ScriptBlock {
    Set-Location "$using:projectPath\ts1\ts1-front"
    Write-Host "Iniciando ts1-front..."
    npm run dev
} -Name "ts1-front"

# ts2-back (porta 8001)
Write-Host "📡 ts2-back (porta 8001)..." -ForegroundColor Cyan
Start-Job -ScriptBlock {
    Set-Location "$using:projectPath\ts2\ts2-back"
    Write-Host "Iniciando ts2-back..."
    uv run uvicorn app.main:app --reload --port 8001
} -Name "ts2-back"

# ts2-front (porta 5174)
Write-Host "🎨 ts2-front (porta 5174)..." -ForegroundColor Cyan
Start-Job -ScriptBlock {
    Set-Location "$using:projectPath\ts2\ts2-front"
    Write-Host "Iniciando ts2-front..."
    npm run dev -- --port 5174
} -Name "ts2-front"

Write-Host "`n✅ Todos os projetos foram iniciados em background!" -ForegroundColor Green
Write-Host "`nPara visualizar os jobs:" -ForegroundColor Yellow
Write-Host "  Get-Job                  # Lista jobs"
Write-Host "  Receive-Job -Name ts1-back    # Vê output"
Write-Host "  Stop-Job -Name ts1-back      # Para um projeto"
Write-Host "  Stop-Job -Name *             # Para todos"
Write-Host "  Remove-Job -Name * -Force    # Limpa jobs`n"
