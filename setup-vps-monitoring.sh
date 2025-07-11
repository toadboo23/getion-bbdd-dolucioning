#!/bin/bash

# Script para configurar el monitoreo automático del VPS

echo "🤖 Configurando monitoreo automático del VPS..."

# Hacer el script ejecutable
chmod +x monitor-vps-telegram.sh

# Crear el cron job para ejecutar cada hora
CRON_JOB="0 * * * * /root/monitor-vps-telegram.sh >> /var/log/vps-monitoring.log 2>&1"

# Agregar al crontab
(crontab -l 2>/dev/null; echo "$CRON_JOB") | crontab -

echo "✅ Cron job configurado para ejecutar cada hora"
echo "📝 Logs disponibles en: /var/log/vps-monitoring.log"

# Probar el script inmediatamente
echo "�� Probando el script de monitoreo..."
./monitor-vps-telegram.sh

echo "✅ Configuración completada" 