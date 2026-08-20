@echo off
echo Iniciando el servidor de la Plataforma SSOMA...
cd /d "C:\Users\jlcan\Desktop\Seguimiento de plataforma de seguridad Antigravity\ssoma-platform"
start http://localhost:3000
npm run dev
