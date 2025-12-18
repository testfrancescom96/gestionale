#!/bin/bash
# Script per backup automatico via cron
# Da eseguire ogni 30 minuti (o come configurato)
# Aggiungere a crontab: */30 * * * * /root/gestionale/scripts/cron-backup.sh

cd /root/gestionale

# Chiama l'API di backup
curl -s -X POST http://localhost:3000/api/backup > /dev/null 2>&1

echo "Backup executed at $(date)"
