@echo off
title Forzar Prueba de Alertas
color 0E
echo =================================================
echo    PRUEBA FORZADA DE ALERTAS WHATSAPP
echo =================================================
echo.
echo Esto enviara los mensajes AHORA MISMO a todos.
echo Asegurate de haber cerrado el robot principal primero (Ctrl+C).
echo.
pause
cd /d "c:\Users\jlcan\Desktop\Seguimiento de plataforma de seguridad Antigravity\ssoma-platform"
node scripts/test-alerta.js
echo.
echo Prueba terminada.
pause
