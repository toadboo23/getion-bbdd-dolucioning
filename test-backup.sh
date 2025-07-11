#!/bin/bash

# Script de prueba de backup
# Uso: ./test-backup.sh

echo "🧪 Ejecutando prueba de backup..."

# Ejecutar backup de prueba
/root/solucioning-deploy/backup-automated.sh

# Verificar que se creó el backup
BACKUP_DIR="/root/backups"
LATEST_BACKUP=$(find "$BACKUP_DIR" -name "backup_*" -type f -printf '%T@ %p\n' | sort -n | tail -1 | cut -d' ' -f2-)

if [ -n "$LATEST_BACKUP" ]; then
    echo "✅ Backup de prueba creado exitosamente:"
    echo "   📄 $(basename "$LATEST_BACKUP")"
    echo "   📦 Tamaño: $(stat -c%s "$LATEST_BACKUP" | numfmt --to=iec)"
else
    echo "❌ Error: No se pudo crear el backup de prueba"
    exit 1
fi
