@echo off
echo ==========================================
echo      DESPLIEGUE DIRECTO A VERCEL
echo ==========================================
echo.
echo Esto sube los archivos DESDE TU PC directamente a la nube.
echo (Ignorando GitHub para evitar problemas de sincronizacion).
echo.
echo -----------------------------------------------------------
echo INSTRUCCIONES SI TE PREGUNTA ALGO:
echo 1. "Set up and deploy?": Escribe Y (Enter)
2. "Which scope?": Selecciona tu usuario (Enter)
3. "Link to existing project?": Escribe Y (Enter)
4. "What's the name?": Escribe ssoma-platform (Enter)
5. "Want to modify settings?": Escribe N (Enter)
echo -----------------------------------------------------------
echo.
echo INICIANDO SUBIDA...
call npx vercel --prod
echo.
echo ==========================================
echo      FIN DEL PROCESO
echo ==========================================
pause
