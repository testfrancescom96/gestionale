@echo off
echo ==========================================
echo      SBLOCCO GESTIONALE (RESET)
echo ==========================================
echo.
echo Sto chiudendo tutti i processi Node.js bloccati...
taskkill /F /IM node.exe
echo.
echo Fatto! Ora puoi riprovare ad avviare il sito.
echo.
pause
