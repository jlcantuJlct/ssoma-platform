@echo off
echo ===================================================
echo   INSTALANDO DEPENDENCIAS (Esto puede tardar...)
echo ===================================================
call npm install
if %errorlevel% neq 0 (
    echo.
    echo ⚠️ Error ejecutando npm install directo. Intentando metodo alternativo...
    call "C:\Program Files\nodejs\npm.cmd" install
)

echo.
echo ===================================================
echo   VERIFICANDO IDENTIDAD DEL ROBOT
echo ===================================================
node scripts/verify-bot-access.js

echo.
echo ===================================================
echo   COMPLETADO. Revisa los resultados arriba.
echo ===================================================
pause
