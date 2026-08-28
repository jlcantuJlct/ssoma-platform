@echo off
title SERVIDOR LOCAL SSOMA
color 0A

echo ==================================================
echo      ENCENDIENDO LA PLATAFORMA LOCAL SSOMA
echo ==================================================
echo.
echo Por favor espera unos segundos mientras carga...
echo (NO CIERRES ESTA VENTANA NEGRA mientras trabajes)
echo.

REM Libera el puerto 3000 por si se quedo pegado
echo Limpiando el puerto 3000 (cerrando procesos anteriores)...
for /f "tokens=5" %%a in ('netstat -aon ^| find ":3000" ^| find "LISTENING"') do (
    taskkill /F /PID %%a >nul 2>&1
)

REM Inicia el servidor
cmd /c "npm run dev"

pause
