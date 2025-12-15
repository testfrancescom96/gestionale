@echo off
title SUPER AGGIORNAMENTO AUTOMATICO (Passwordless)
color 0A

echo =======================================================
echo      AGGIORNAMENTO TOTALE (GITHUB + SERVER)
echo =======================================================
echo.

:: 1. GITHUB
echo [Fase 1/2] Salvataggio e Invio su GitHub...
git add .
set msg=Aggiornamento %date% %time%
set /p input="Scrivi un commento (o premi INVIO per andare veloce): "
if not "%input%"=="" set msg=%input%
git commit -m "%msg%"
git push

:: 2. SERVER
echo.
echo =======================================================
echo [Fase 2/2] Comando al Server...
echo.
echo Mi collego al server per aggiornare il sito...
echo (Se tutto e' configurato, non ti chiedera' nulla)
echo =======================================================
echo.
ssh root@72.62.91.101 "cd gestionale && git pull origin main && npm install && npx prisma db push && npx prisma generate && rm -rf .next && npm run build && pm2 restart gestionale"

echo.
echo =======================================================
echo  TUTTO FATTO! IL SITO E' AGGIORNATO E ONLINE.
echo =======================================================
pause
