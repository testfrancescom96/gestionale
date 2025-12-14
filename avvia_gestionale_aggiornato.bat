@echo off
echo ==========================================
echo    AGGIORNAMENTO E AVVIO GESTIONALE
echo ==========================================
echo.
echo 1. Aggiornamento Database in corso (Attendere)...
call npx prisma generate
echo.
echo 2. Avvio del Server...
echo.
call npm run dev
pause
