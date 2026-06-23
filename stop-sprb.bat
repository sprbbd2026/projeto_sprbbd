@echo off
setlocal
cd /d "%~dp0"

echo.
echo  SPRB-BD - Parando TS1 e TS2
echo.

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0stop-sprb.ps1" %*
if errorlevel 1 (
    echo.
    echo Falha ao parar os servicos.
    pause
    exit /b 1
)

echo.
pause
