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

REM Inicia el servidor
cmd /c "npm run dev"

pause
