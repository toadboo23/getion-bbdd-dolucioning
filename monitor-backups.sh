#!/bin/bash

# Script de monitoreo de backups
# Uso: ./monitor-backups.sh

BACKUP_DIR="/root/backups"
LOG_DIR="/var/log/backup"

echo "📊 Estado de los backups:"
echo "=========================="

# Verificar backups recientes
echo "🕒 Backups de las últimas 24 horas:"
find "$BACKUP_DIR" -name "backup_*" -type f -mtime -1 2>/dev/null | while read -r file; do
    size=$(stat -c%s "$file" 2>/dev/null || echo "0")
    date=$(stat -c%y "$file" 2>/dev/null || echo "N/A")
    echo "   📄 $(basename "$file") - $(numfmt --to=iec $size) - $date"
done

# Verificar logs de cron
echo ""
echo "📋 Logs de cron recientes:"
for log_file in "$LOG_DIR"/*.log; do
    if [ -f "$log_file" ]; then
        echo "   📄 $(basename "$log_file"):"
        tail -5 "$log_file" 2>/dev/null | sed 's/^/      /'
        echo ""
    fi
done

# Verificar espacio en disco
echo "💾 Espacio en disco:"
df -h "$BACKUP_DIR" 2>/dev/null || echo "   No se puede verificar espacio en disco"

# Verificar estado de los servicios
echo ""
echo "🐳 Estado de los servicios Docker:"
cd /root/solucioning-deploy && docker-compose ps 2>/dev/null || echo "   No se puede verificar servicios Docker"
