@echo off
echo Iniciando el servidor de la Plataforma SSOMA...
cd /d "C:\Users\jlcan\Desktop\Seguimiento de plataforma de seguridad Antigravity\ssoma-platform"

echo Limpiando el puerto 3000 (cerrando procesos anteriores)...
for /f "tokens=5" %%a in ('netstat -aon ^| find ":3000" ^| find "LISTENING"') do (
    taskkill /F /PID %%a >nul 2>&1
)

start http://localhost:3000
npm run dev
