#!/bin/bash

# Script de limpieza de logs
# Uso: ./cleanup-logs.sh

LOG_DIR="/var/log/backup"
RETENTION_DAYS=30

echo "🧹 Limpiando logs antiguos (más de $RETENTION_DAYS días)..."

deleted_count=0
while IFS= read -r -d '' file; do
    if [ -f "$file" ]; then
        rm -f "$file"
        ((deleted_count++))
    fi
done < <(find "$LOG_DIR" -name "*.log" -type f -mtime +$RETENTION_DAYS -print0 2>/dev/null)

if [ $deleted_count -gt 0 ]; then
    echo "🗑️ Eliminados $deleted_count archivos de log antiguos"
else
    echo "📦 No se encontraron logs antiguos para eliminar"
fi
