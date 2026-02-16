@echo off
setlocal
echo ==========================================
echo      DESPLEGANDO CORRECCION DE CARPETAS
echo ==========================================

REM Check if git exists
where git >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERROR CRITICO]
    echo No se encontro el comando 'git' en tu sistema.
    echo.
    echo Para subir los cambios a la nube, necesitas Git instalado.
    echo Por favor instala Git desde: https://git-scm.com/download/win
    echo O asegurate de usar 'Git Bash' si ya lo tienes.
    echo.
    echo NOTA: El codigo YA esta arreglado en tu maquina local. 
    echo Si corres 'npm run dev', funcionara. Pero no podras subirlo sin Git.
    pause
    exit /b 1
)

echo 0. Sincronizando repositorio...
git pull origin main --rebase

echo.
echo 1. Agregando archivos al control de versiones...
git add .

echo.
echo 2. Guardando cambios (Commit)...
git commit -m "FIX CRITICO: Habilitar Fallback si falla Quota Robot"

echo.
echo 3. Subiendo cambios a la nube (Push)...
git push origin main

echo.
echo ==========================================
echo      DESPLIEGUE COMPLETADO
echo ==========================================
pause
