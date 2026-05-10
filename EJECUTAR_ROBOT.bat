@echo off
title ROBOT LOCAL SSOMA - EXPORTADOR
echo ==========================================
echo    INICIANDO ROBOT DE EXPORTACION
echo ==========================================
echo.
echo Este robot se conectara con la plataforma en la nube,
echo detectara solicitudes de exportacion y descargara
echo los archivos directamente a tu escritorio.
echo.
echo IMPORTANTE: Manten esta ventana abierta.
echo.

node scripts\robot-local.js

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ------------------------------------------
    echo [ERROR] El robot se ha detenido.
    echo Asegurate de tener instalado Node.js
    echo y que el servidor este en linea.
    echo ------------------------------------------
    pause
)
