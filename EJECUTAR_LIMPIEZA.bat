@echo off
echo ==========================================
echo      ORGANIZADOR DE ARCHIVOS DRIVE
echo ==========================================
echo.
echo Este script escaneara tu Google Drive y movera los archivos
echo desordenados a sus carpetas correctas (Area / Mes / Tipo).
echo.
echo Modo actual: EJECUCION REAL (Movera los archivos permanentemente)
echo.
echo ADVERTENCIA: Esta accion organizara tu Google Drive.
echo.
echo Presiona ENTER para iniciar la limpieza...
pause >nul

node scripts/organize-drive-files.js

echo.
echo ==========================================
echo      FIN DEL ESCANEO
echo ==========================================
echo.
pause
