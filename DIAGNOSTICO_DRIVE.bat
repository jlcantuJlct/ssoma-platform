@echo off
echo ==========================================
echo   EJECUTANDO DIAGNOSTICO DE DRIVE
echo ==========================================
cd /d "%~dp0"
node scripts/diagnostico_completo.js
echo.
echo ==========================================
echo   FIN DEL DIAGNOSTICO
echo   Por favor, copia todo el texto de arriba y pegalo en el chat.
echo ==========================================
pause
