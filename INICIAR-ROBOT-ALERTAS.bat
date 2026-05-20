@echo off
title Robot SSOMA - Alertas WhatsApp
color 0A
echo =================================================
echo    ROBOT DE ALERTAS SSOMA - WhatsApp
echo =================================================
echo.
echo Iniciando robot... Por favor espera.
echo Cuando aparezca el QR, escanea con tu WhatsApp:
echo   WhatsApp - Menu - Dispositivos Vinculados - Vincular Dispositivo
echo.
echo NO CIERRES ESTA VENTANA mientras el robot este activo.
echo Para detenerlo presiona Ctrl+C
echo.
cd /d "c:\Users\jlcan\Desktop\Seguimiento de plataforma de seguridad Antigravity\ssoma-platform"
node scripts/robot-alertas.js
pause
