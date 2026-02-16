@echo off
echo ==========================================
echo      CONECTANDO CON LA NUBE (GITHUB)
echo ==========================================

REM 1. Inicializar Git si no existe
if not exist .git (
    echo Iniciando repositorio Git...
    git init
)

REM 2. Configurar la Nube (Remote)
echo Configurando direccion de la nube...
git remote remove origin 2>nul
git remote add origin https://github.com/jlcantujlct/ssoma-platform.git

REM 2.5 Configurar Identidad (Para evitar error "Who are you?")
git config user.email "admin@ssoma.platform"
git config user.name "SSOMA Admin"

REM 3. Preparar archivos
echo Preparando archivos...
git branch -M main
git add .

REM 4. Guardar cambios
echo Guardando version inicial...
git commit -m "Despliegue Inicial: Plataforma SSOMA con Correcciones Drive"

REM 5. Subir
echo.
echo SUBIENDO A LA NUBE...
echo (Esto puede tardar un poco si hay muchos archivos)
git push -u origin main --force

echo.
echo ==========================================
echo      CONEXION COMPLETADA EXITOSAMENTE
echo ==========================================
pause
