@echo off
setlocal
cd /d "%~dp0"

echo.
echo  SPRB-BD - Iniciando TS1 e TS2
echo.

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0start-sprb.ps1" %*
if errorlevel 1 (
    echo.
    echo Falha ao iniciar os servicos.
    pause
    exit /b 1
)

if /I not "%~1"=="-Docker" (
    echo.
    pause
)
