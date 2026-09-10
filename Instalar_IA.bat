@echo off
chcp 65001 >nul
echo ========================================================
echo   Instalador de IA Local para SSOMA (Ollama + Qwen 2.5)
echo ========================================================
echo.
echo 1. Descargando el motor Ollama...
curl -L https://ollama.com/download/OllamaSetup.exe -o "%TEMP%\OllamaSetup.exe"

echo.
echo 2. Abriendo el instalador de Ollama...
echo *** POR FAVOR: Haz clic en "Install" en la ventana que va a aparecer ***
"%TEMP%\OllamaSetup.exe"

echo.
echo ========================================================
echo IMPORTANTE: Espera a que Ollama termine de instalarse.
echo Una vez que termine y veas el icono de la llama en tu barra de tareas,
echo presiona cualquier tecla para continuar y descargar la IA.
echo ========================================================
pause

echo.
echo 3. Descargando el cerebro (Qwen 2.5 Coder - 7B)...
echo (Esto puede tardar varios minutos dependiendo de tu velocidad de internet, son ~4.7 GB)
echo.
ollama run qwen2.5-coder:7b

echo.
echo ========================================================
echo ¡Felicidades! La IA ya esta instalada en tu PC.
echo Ya puedes cerrar esta ventana.
echo ========================================================
pause
