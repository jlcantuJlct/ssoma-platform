@echo off
echo ==========================================
echo      SUBIENDO CORRECCION DRIVE A LA WEB
echo ==========================================

echo 1. Guardando cambios locales...
git add .
git commit -m "Fix: Corrected Drive Bot Identity and Folder ID"

echo.
echo 2. Subiendo a Vercel/GitHub...
git push origin main

echo.
echo =========================================================
echo      PROCESO FINALIZADO
echo =========================================================
echo Si viste "Everything up-to-date" o mensajes de exito,
echo los cambios ya se estan desplegando en Vercel.
echo.
echo Espera unos 2-3 minutos y recarga tu pagina web.
echo =========================================================
pause
