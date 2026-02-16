
@echo off
echo Instalando dotenv...
call npm install dotenv
echo.
echo Ejecutando prueba de base de datos...
node scripts/test-db.js
echo.
pause
