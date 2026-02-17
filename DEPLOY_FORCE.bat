@echo off
echo ==========================================
echo      FORZANDO ACTUALIZACION WEB
echo ==========================================

echo 1. Guardando cambios de version...
git add .
git commit -m "Deploy: Force Update v2.1 (Drive Folder Fix)"

echo.
echo 2. Subiendo a Vercel/GitHub...
git push origin main

echo.
echo =========================================================
echo      ENVIADO.
echo =========================================================
echo Por favor, espera 2 minutos.
echo Luego entra a tu web y busca el texto chiquito abajo:
echo "v2.1 - FIX DRIVE FOLDER (VERIFICADO)"
echo.
echo Si ves ese texto, SIGNIFICA QUE YA SE ACTUALIZO.
echo Si NO lo ves, presiona CTRL + F5 para limpiar la cache.
echo =========================================================
pause
