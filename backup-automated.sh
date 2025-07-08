#!/bin/bash

# Script de Backup Automatizado para el VPS
# Uso: ./backup-automated.sh [--full] [--upload]

set -e

# Configuración
BACKUP_DIR="/root/backups"
DB_NAME="solucioning"
DB_USER="postgres"
CONTAINER_NAME="solucioning-db-1"
RETENTION_DAYS=30
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_NAME="backup_$DATE"

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Función para logging
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

error() {
    echo -e "${RED}[ERROR] $1${NC}" >&2
}

warning() {
    echo -e "${YELLOW}[WARNING] $1${NC}"
}

info() {
    echo -e "${BLUE}[INFO] $1${NC}"
}

# Verificar argumentos
FULL_BACKUP=false
UPLOAD_BACKUP=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --full)
            FULL_BACKUP=true
            shift
            ;;
        --upload)
            UPLOAD_BACKUP=true
            shift
            ;;
        *)
            error "Argumento desconocido: $1"
            echo "Uso: $0 [--full] [--upload]"
            exit 1
            ;;
    esac
done

# Función principal de backup
main() {
    log "🚀 Iniciando backup automatizado..."
    
    # Crear directorio de backup si no existe
    if [ ! -d "$BACKUP_DIR" ]; then
        log "📁 Creando directorio de backup: $BACKUP_DIR"
        mkdir -p "$BACKUP_DIR"
    fi
    
    # Backup de base de datos
    backup_database
    
    # Backup completo si se solicita
    if [ "$FULL_BACKUP" = true ]; then
        backup_config_files
        backup_logs
        backup_docker_images
    fi
    
    # Limpiar backups antiguos
    cleanup_old_backups
    
    # Subir a almacenamiento externo si se solicita
    if [ "$UPLOAD_BACKUP" = true ]; then
        upload_backup
    fi
    
    log "✅ Backup completado exitosamente!"
    log "📁 Ubicación: $BACKUP_DIR/$BACKUP_NAME"
}

# Función para backup de base de datos
backup_database() {
    log "🗄️ Iniciando backup de base de datos..."
    
    # Verificar que el contenedor esté corriendo
    if ! docker ps | grep -q "$CONTAINER_NAME"; then
        error "Contenedor de base de datos no está corriendo: $CONTAINER_NAME"
        return 1
    fi
    
    # Crear backup de PostgreSQL
    local db_backup_file="$BACKUP_DIR/${BACKUP_NAME}_database.sql"
    
    if docker exec "$CONTAINER_NAME" pg_dump -U "$DB_USER" "$DB_NAME" > "$db_backup_file"; then
        log "✅ Backup de base de datos creado: $db_backup_file"
        
        # Comprimir backup
        gzip "$db_backup_file"
        log "📦 Backup comprimido: ${db_backup_file}.gz"
        
        # Verificar integridad del backup
        if gzip -t "${db_backup_file}.gz"; then
            log "✅ Integridad del backup verificada"
        else
            error "❌ Backup corrupto detectado"
            return 1
        fi
    else
        error "❌ Error al crear backup de base de datos"
        return 1
    fi
}

# Función para backup de archivos de configuración
backup_config_files() {
    log "📄 Iniciando backup de archivos de configuración..."
    
    local config_backup_file="$BACKUP_DIR/${BACKUP_NAME}_config.tar.gz"
    
    # Crear backup de archivos importantes
    tar -czf "$config_backup_file" \
        --exclude='node_modules' \
        --exclude='.git' \
        --exclude='backups' \
        --exclude='*.log' \
        -C /root/solucioning-deploy . 2>/dev/null || {
        warning "No se pudo crear backup de archivos de configuración"
        return 1
    }
    
    log "✅ Backup de configuración creado: $config_backup_file"
}

# Función para backup de logs
backup_logs() {
    log "📋 Iniciando backup de logs..."
    
    local logs_backup_file="$BACKUP_DIR/${BACKUP_NAME}_logs.tar.gz"
    
    # Crear backup de logs de Docker
    docker-compose logs --no-color > "$BACKUP_DIR/${BACKUP_NAME}_docker.logs" 2>/dev/null || {
        warning "No se pudieron obtener logs de Docker"
    }
    
    # Comprimir logs
    tar -czf "$logs_backup_file" \
        -C "$BACKUP_DIR" "${BACKUP_NAME}_docker.logs" 2>/dev/null || {
        warning "No se pudo comprimir logs"
        return 1
    }
    
    # Limpiar archivo temporal
    rm -f "$BACKUP_DIR/${BACKUP_NAME}_docker.logs"
    
    log "✅ Backup de logs creado: $logs_backup_file"
}

# Función para backup de imágenes Docker
backup_docker_images() {
    log "🐳 Iniciando backup de imágenes Docker..."
    
    local images_backup_file="$BACKUP_DIR/${BACKUP_NAME}_images.tar"
    
    # Obtener lista de imágenes utilizadas
    local images=$(docker-compose images -q | tr '\n' ' ')
    
    if [ -n "$images" ]; then
        docker save $images > "$images_backup_file" 2>/dev/null || {
            warning "No se pudieron guardar imágenes Docker"
            return 1
        }
        
        log "✅ Backup de imágenes Docker creado: $images_backup_file"
    else
        warning "No se encontraron imágenes Docker para backup"
    fi
}

# Función para limpiar backups antiguos
cleanup_old_backups() {
    log "🧹 Limpiando backups antiguos (más de $RETENTION_DAYS días)..."
    
    local deleted_count=0
    
    # Encontrar y eliminar backups antiguos
    while IFS= read -r -d '' file; do
        if [ -f "$file" ]; then
            rm -f "$file"
            ((deleted_count++))
        fi
    done < <(find "$BACKUP_DIR" -name "backup_*" -type f -mtime +$RETENTION_DAYS -print0 2>/dev/null)
    
    if [ $deleted_count -gt 0 ]; then
        log "🗑️ Eliminados $deleted_count backups antiguos"
    else
        log "📦 No se encontraron backups antiguos para eliminar"
    fi
}

# Función para subir backup a almacenamiento externo
upload_backup() {
    log "☁️ Iniciando subida de backup..."
    
    # Verificar si AWS CLI está instalado
    if ! command -v aws &> /dev/null; then
        warning "AWS CLI no está instalado. Instalando..."
        curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
        unzip awscliv2.zip
        ./aws/install
        rm -rf awscliv2.zip aws
    fi
    
    # Configurar AWS (requiere configuración previa)
    if [ -z "$AWS_ACCESS_KEY_ID" ] || [ -z "$AWS_SECRET_ACCESS_KEY" ]; then
        warning "Credenciales AWS no configuradas. Saltando subida."
        return 1
    fi
    
    # Subir a S3 (ejemplo)
    local s3_bucket="your-backup-bucket"
    local s3_path="backups/$BACKUP_NAME"
    
    for backup_file in "$BACKUP_DIR/${BACKUP_NAME}"*; do
        if [ -f "$backup_file" ]; then
            aws s3 cp "$backup_file" "s3://$s3_bucket/$s3_path/" --quiet && {
                log "✅ Subido: $(basename "$backup_file")"
            } || {
                error "❌ Error al subir: $(basename "$backup_file")"
            }
        fi
    done
}

# Función para mostrar estadísticas
show_stats() {
    log "📊 Estadísticas del backup:"
    
    local total_size=0
    local file_count=0
    
    for backup_file in "$BACKUP_DIR/${BACKUP_NAME}"*; do
        if [ -f "$backup_file" ]; then
            local size=$(stat -c%s "$backup_file" 2>/dev/null || echo "0")
            total_size=$((total_size + size))
            ((file_count++))
            log "   📄 $(basename "$backup_file") - $(numfmt --to=iec $size)"
        fi
    done
    
    log "   📦 Total: $file_count archivos, $(numfmt --to=iec $total_size)"
    
    # Mostrar espacio disponible
    local available_space=$(df "$BACKUP_DIR" | awk 'NR==2 {print $4}')
    log "   💾 Espacio disponible: $(numfmt --to=iec $((available_space * 1024)))"
}

# Función para restaurar backup (opcional)
restore_backup() {
    local backup_date=$1
    
    if [ -z "$backup_date" ]; then
        error "Debe especificar la fecha del backup (YYYYMMDD_HHMMSS)"
        return 1
    fi
    
    log "🔄 Iniciando restauración del backup: $backup_date"
    
    local backup_file="$BACKUP_DIR/backup_${backup_date}_database.sql.gz"
    
    if [ ! -f "$backup_file" ]; then
        error "Backup no encontrado: $backup_file"
        return 1
    fi
    
    # Restaurar base de datos
    log "🗄️ Restaurando base de datos..."
    
    gunzip -c "$backup_file" | docker exec -i "$CONTAINER_NAME" psql -U "$DB_USER" "$DB_NAME" && {
        log "✅ Restauración completada exitosamente"
    } || {
        error "❌ Error durante la restauración"
        return 1
    }
}

# Manejo de argumentos especiales
case "${1:-}" in
    "restore")
        restore_backup "$2"
        exit 0
        ;;
    "stats")
        show_stats
        exit 0
        ;;
    "list")
        log "📋 Lista de backups disponibles:"
        ls -la "$BACKUP_DIR"/backup_* 2>/dev/null | while read -r line; do
            echo "   $line"
        done
        exit 0
        ;;
esac

# Ejecutar función principal
main "$@"
show_stats

log "🎉 Proceso de backup finalizado!" 