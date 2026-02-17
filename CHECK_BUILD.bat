@echo off
echo ==========================================
echo      VERIFICANDO CONSTRUCCION (BUILD)
echo ==========================================
echo Este proceso simula lo que hace Vercel.
echo Si falla aqui, tambien falla en la nube.
echo.

call npm run build

if %errorlevel% neq 0 (
    echo.
    echo [ERROR] La construccion FALLO.
    echo Revisa los errores rojos arriba.
    echo Vercel NO actualizara la web hasta arreglar esto.
) else (
    echo.
    echo [EXITO] La construccion paso correctamente.
    echo El codigo es valido para despliegue.
)

echo.
echo ==========================================
echo      FIN DE VERIFICACION
echo ==========================================
pause
