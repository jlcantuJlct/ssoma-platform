@echo off
echo ==========================================
echo      DIAGNOSTICO DE DESPLIEGUE
echo ==========================================
echo.
echo 1. Verificando repositorio...
git remote -v
echo.
echo 2. Verificando rama actual...
git branch --show-current
echo.
echo 3. Probando conexion a GitHub...
echo    (Saltando chequeo SSH porque usas HTTPS)

echo.
echo 4. Guardando cambios (Commit)...
git add .
git commit -m "Deploy: FIX FINAL v2026.2 (Credentials + Sidebar)"

echo.
echo 5. SUBIENDO A GITHUB (PUSH)...
echo    Si pide credenciales, ingresalas.
echo    Si sale ERROR rojo, avisame.
echo.
git push origin main
if %errorlevel% neq 0 (
    echo.
    echo ==========================================
    echo ERROR: FALLO LA SUBIDA (GIT PUSH FAILED)
    echo ==========================================
    echo.
) else (
    echo.
    echo ==========================================
    echo      EXITO: CODIGO ENVIADO CORRECTAMENTE
    echo ==========================================
    echo.
    echo La plataforma deberia actualizarse en 2 minutos.
    echo Version esperada: "v2026.2 - FIXED"
)
pause
