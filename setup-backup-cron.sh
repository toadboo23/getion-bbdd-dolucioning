#!/bin/bash

# Script para configurar backup automatizado con cron
# Uso: ./setup-backup-cron.sh

set -e

# Colores para output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

error() {
    echo -e "${RED}[ERROR] $1${NC}" >&2
}

warning() {
    echo -e "${YELLOW}[WARNING] $1${NC}"
}

# Verificar que estamos como root
if [ "$EUID" -ne 0 ]; then
    error "Este script debe ejecutarse como root"
    exit 1
fi

log "🔧 Configurando backup automatizado..."

# Verificar que el script de backup existe
if [ ! -f "/root/solucioning-deploy/backup-automated.sh" ]; then
    error "Script de backup no encontrado en /root/solucioning-deploy/backup-automated.sh"
    exit 1
fi

# Hacer el script ejecutable
chmod +x /root/solucioning-deploy/backup-automated.sh

# Crear directorio de logs para cron
mkdir -p /var/log/backup

# Crear archivo de configuración de cron
log "📅 Configurando cron jobs..."

# Backup diario a las 2:00 AM (solo base de datos)
DAILY_CRON="0 2 * * * /root/solucioning-deploy/backup-automated.sh >> /var/log/backup/daily.log 2>&1"

# Backup semanal completo (domingo a las 3:00 AM)
WEEKLY_CRON="0 3 * * 0 /root/solucioning-deploy/backup-automated.sh --full >> /var/log/backup/weekly.log 2>&1"

# Backup mensual con upload (primer día del mes a las 4:00 AM)
MONTHLY_CRON="0 4 1 * * /root/solucioning-deploy/backup-automated.sh --full --upload >> /var/log/backup/monthly.log 2>&1"

# Crear archivo temporal con los cron jobs
cat > /tmp/backup_cron << EOF
# Backup Automatizado - Solucioning
# Backup diario (solo base de datos)
$DAILY_CRON

# Backup semanal completo
$WEEKLY_CRON

# Backup mensual con upload a almacenamiento externo
$MONTHLY_CRON
EOF

# Instalar cron jobs
crontab /tmp/backup_cron

# Limpiar archivo temporal
rm -f /tmp/backup_cron

# Verificar que los cron jobs se instalaron correctamente
log "📋 Cron jobs instalados:"
crontab -l | grep backup-automated || {
    error "❌ Error al instalar cron jobs"
    exit 1
}

# Crear script de monitoreo de backups
log "📊 Creando script de monitoreo..."

cat > /root/solucioning-deploy/monitor-backups.sh << 'EOF'
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
EOF

chmod +x /root/solucioning-deploy/monitor-backups.sh

# Crear script de limpieza de logs
log "🧹 Creando script de limpieza de logs..."

cat > /root/solucioning-deploy/cleanup-logs.sh << 'EOF'
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
EOF

chmod +x /root/solucioning-deploy/cleanup-logs.sh

# Crear script de prueba de backup
log "🧪 Creando script de prueba..."

cat > /root/solucioning-deploy/test-backup.sh << 'EOF'
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
EOF

chmod +x /root/solucioning-deploy/test-backup.sh

# Mostrar información de configuración
log "✅ Configuración completada!"
echo ""
echo "📋 Información de configuración:"
echo "   📁 Directorio de backups: /root/backups"
echo "   📁 Directorio de logs: /var/log/backup"
echo "   ⏰ Backup diario: 2:00 AM (solo BD)"
echo "   ⏰ Backup semanal: Domingo 3:00 AM (completo)"
echo "   ⏰ Backup mensual: Día 1, 4:00 AM (con upload)"
echo ""
echo "🔧 Comandos útiles:"
echo "   📊 Monitoreo: ./monitor-backups.sh"
echo "   🧪 Prueba: ./test-backup.sh"
echo "   🧹 Limpieza: ./cleanup-logs.sh"
echo "   📋 Listar backups: ./backup-automated.sh list"
echo "   📊 Estadísticas: ./backup-automated.sh stats"
echo ""
echo "⚠️  Nota: Para subir backups a almacenamiento externo,"
echo "   configura las variables de entorno AWS_ACCESS_KEY_ID y AWS_SECRET_ACCESS_KEY"

log "🎉 Configuración de backup automatizado finalizada!" 