@echo off
title Actualizar en Vercel
echo ==============================================
echo ENVIANDO ACTUALIZACIONES A VERCEL
echo ==============================================
cd /d "C:\Users\jlcan\Desktop\Seguimiento de plataforma de seguridad Antigravity\ssoma-platform"
echo Guardando cambios...
git add .
git commit -m "Actualizacion rapida"
echo Subiendo cambios a GitHub/Vercel...
git push origin main
echo.
echo ==============================================
echo ¡ACTUALIZACION ENVIADA CON EXITO!
echo Vercel tardara alrededor de 1 a 2 minutos en aplicar los cambios.
echo Ya puedes cerrar esta ventana.
echo ==============================================
pause
