@echo off
echo ===================================================
echo   REPARANDO DEPENDENCIAS (Limpieza profunda)
echo ===================================================

echo 1. Eliminando carpeta node_modules...
rmdir /s /q node_modules
if exist node_modules (
    echo    ⚠️ No se pudo borrar node_modules completamente.
) else (
    echo    ✅ node_modules eliminado.
)

echo 2. Eliminando package-lock.json...
del package-lock.json
if exist package-lock.json (
    echo    ⚠️ No se pudo borrar package-lock.json.
) else (
    echo    ✅ package-lock.json eliminado.
)

echo 3. Limpiando Cache de NPM...
call npm cache clean --force

echo 4. Instalando dependencias desde cero...
echo    (Esto puede tardar unos minutos, ten paciencia...)
call npm install

if %errorlevel% neq 0 (
    echo    ❌ Error en npm install. Intentando con --force...
    call npm install --force
)

echo.
echo ===================================================
echo   VERIFICANDO IDENTIDAD DEL ROBOT (Intento 2)
echo ===================================================
node scripts/verify-bot-access.js

echo.
echo ===================================================
echo   COMPLETADO. Revisa los resultados arriba.
echo ===================================================
pause
