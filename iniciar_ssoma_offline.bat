@echo off
chcp 65001 > nul
title PLATAFORMA SSOMA - MODO LOCAL OFFLINE

echo ======================================================================
echo           PLATAFORMA SSOMA - SERVIDOR AUTONOMO DE CAMPAMENTO
echo                        MODO 100%% OFFLINE (SIN INTERNET)
echo ======================================================================
echo.

:: 1. Verificar si Node.js está instalado
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] No se encontró Node.js instalado en este equipo.
    echo Por favor instale Node.js para poder ejecutar el servidor local.
    pause
    exit /b
)

:: 2. Crear carpetas locales de almacenamiento de datos si no existen
if not exist ".data" mkdir ".data"
if not exist ".data\reports" mkdir ".data\reports"
if not exist "public\uploads" mkdir "public\uploads"

:: 3. Obtener la dirección IP local de esta máquina
set LOCAL_IP=localhost
for /f "tokens=4" %%a in ('route print ^| findstr 0.0.0.0.*0.0.0.0') do (
    set LOCAL_IP=%%a
    goto :ip_found
)
:ip_found

:: 4. Forzar modo SQLite local y configurar host para la red local
set POSTGRES_URL=
set PORT=3000
set HOSTNAME=0.0.0.0

echo [OK] Base de datos local : SQLite (.data\ssoma.db)
echo [OK] Plantillas Excel     : 15 formatos oficiales listos en disco
echo [OK] Acceso en esta PC   : http://localhost:3000
echo [OK] Acceso en red WiFi  : http://%LOCAL_IP%:3000
echo.
echo ======================================================================
echo  Los inspectores con celulares o tablets conectados al WiFi de obra
echo  pueden ingresar directamente a: http://%LOCAL_IP%:3000
echo ======================================================================
echo.
echo Iniciando servidor SSOMA... Presione Ctrl+C en cualquier momento para detener.
echo.

:: 5. Abrir navegador en 5 segundos automáticamente
start "" /b cmd /c "timeout /t 5 >nul && start http://localhost:3000"

:: 6. Iniciar aplicación Next.js
npm run dev
pause
