#!/bin/bash
# Scripts de Administración para VPS
# Comandos útiles para gestionar el proyecto en producción

echo "=== Scripts de Administración DVV5 ==="

# 1. DESPLIEGUE EN PRODUCCIÓN
deploy_production() {
    echo "🚀 Desplegando en producción..."
    
    # Detener servicios actuales
    docker-compose -f docker-compose.yml down
    
    # Limpiar contenedores antiguos
    docker system prune -f
    
    # Construir y levantar en modo producción
    docker-compose -f docker-compose.yml up -d --build
    
    echo "✅ Despliegue completado"
}

# 2. BACKUP DE BASE DE DATOS
backup_database() {
    echo "💾 Creando backup de base de datos..."
    
    BACKUP_FILE="backup_$(date +%Y%m%d_%H%M%S).sql"
    
    docker exec employee_management_db pg_dump -U postgres employee_management > "$BACKUP_FILE"
    
    echo "✅ Backup creado: $BACKUP_FILE"
}

# 3. RESTAURAR BASE DE DATOS
restore_database() {
    if [ -z "$1" ]; then
        echo "❌ Uso: restore_database backup_file.sql"
        return 1
    fi
    
    echo "🔄 Restaurando base de datos desde $1..."
    
    docker exec -i employee_management_db psql -U postgres employee_management < "$1"
    
    echo "✅ Base de datos restaurada"
}

# 4. VER LOGS
view_logs() {
    SERVICE=${1:-all}
    
    case $SERVICE in
        "backend")
            docker-compose logs -f backend
            ;;
        "frontend")
            docker-compose logs -f frontend
            ;;
        "db"|"database")
            docker-compose logs -f postgres
            ;;
        *)
            docker-compose logs -f
            ;;
    esac
}

# 5. ACCESO A BASE DE DATOS
db_console() {
    echo "🔗 Conectando a PostgreSQL..."
    docker exec -it employee_management_db psql -U postgres -d employee_management
}

# 6. ACTUALIZAR CÓDIGO
update_code() {
    echo "🔄 Actualizando código desde Git..."
    
    git pull origin main
    
    echo "🔨 Reconstruyendo servicios..."
    docker-compose -f docker-compose.yml up -d --build
    
    echo "✅ Código actualizado"
}

# 7. VERIFICAR ESTADO
check_status() {
    echo "📊 Estado de los servicios:"
    docker-compose ps
    
    echo -e "\n🐳 Uso de Docker:"
    docker system df
    
    echo -e "\n💾 Espacio en disco:"
    df -h
}

# 8. LIMPIAR SISTEMA
cleanup() {
    echo "🧹 Limpiando sistema..."
    
    # Eliminar contenedores parados
    docker container prune -f
    
    # Eliminar imágenes no utilizadas
    docker image prune -f
    
    # Eliminar volúmenes no utilizados
    docker volume prune -f
    
    # Eliminar redes no utilizadas
    docker network prune -f
    
    echo "✅ Limpieza completada"
}

# 9. CONFIGURAR FIREWALL (Ubuntu/Debian)
setup_firewall() {
    echo "🔥 Configurando firewall..."
    
    # Permitir SSH
    sudo ufw allow 22/tcp
    
    # Permitir HTTP/HTTPS
    sudo ufw allow 80/tcp
    sudo ufw allow 443/tcp
    
    # Permitir servicios de la aplicación
    sudo ufw allow 3000/tcp  # Frontend
    sudo ufw allow 5173/tcp  # Backend
    sudo ufw allow 5432/tcp  # PostgreSQL (solo si necesitas acceso externo)
    
    # Activar firewall
    sudo ufw --force enable
    
    echo "✅ Firewall configurado"
}

# 10. MONITOREO
monitor() {
    while true; do
        clear
        echo "=== MONITOR DVV5 ==="
        echo "$(date)"
        echo ""
        
        echo "📊 Estado de contenedores:"
        docker-compose ps
        
        echo -e "\n💻 Uso de CPU y memoria:"
        docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}"
        
        echo -e "\n🌐 Conexiones de red:"
        netstat -tuln | grep -E ':(3000|5173|5432)'
        
        sleep 5
    done
}

# Menú principal
show_menu() {
    echo ""
    echo "=== COMANDOS DISPONIBLES ==="
    echo "1.  deploy_production     - Desplegar en producción"
    echo "2.  backup_database       - Backup de base de datos"
    echo "3.  restore_database      - Restaurar base de datos"
    echo "4.  view_logs [service]   - Ver logs (backend/frontend/db)"
    echo "5.  db_console           - Consola de PostgreSQL"
    echo "6.  update_code          - Actualizar desde Git"
    echo "7.  check_status         - Verificar estado"
    echo "8.  cleanup              - Limpiar sistema Docker"
    echo "9.  setup_firewall       - Configurar firewall"
    echo "10. monitor              - Monitor en tiempo real"
    echo ""
    echo "Uso: source vps-admin-scripts.sh && [comando]"
}

# Mostrar menú al cargar
show_menu 