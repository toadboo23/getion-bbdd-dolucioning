#!/bin/bash

# Script de instalación limpia para VPS - Solucioning
# Ejecutar como root en el VPS

set -e

echo "🚀 Iniciando instalación limpia de Solucioning en VPS..."

# Variables
VPS_IP="69.62.107.86"
PROJECT_DIR="/opt/solucioning"
DOCKER_COMPOSE_FILE="docker-compose.prod.yml"

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Función para imprimir mensajes
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Función para limpiar Docker completamente
clean_docker() {
    print_status "Limpiando Docker completamente..."
    
    # Detener y eliminar todos los contenedores
    docker stop $(docker ps -aq) 2>/dev/null || true
    docker rm $(docker ps -aq) 2>/dev/null || true
    
    # Eliminar todas las imágenes
    docker rmi $(docker images -aq) 2>/dev/null || true
    
    # Limpiar sistema Docker
    docker system prune -af
    
    # Eliminar volúmenes no utilizados
    docker volume prune -f
    
    print_success "Docker limpiado completamente"
}

# Función para verificar Docker
check_docker() {
    print_status "Verificando instalación de Docker..."
    
    if ! command -v docker &> /dev/null; then
        print_error "Docker no está instalado"
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose no está instalado"
        exit 1
    fi
    
    print_success "Docker y Docker Compose están instalados"
    docker --version
    docker-compose --version
}

# Función para preparar directorio del proyecto
prepare_project_directory() {
    print_status "Preparando directorio del proyecto..."
    
    # Eliminar directorio si existe
    if [ -d "$PROJECT_DIR" ]; then
        rm -rf "$PROJECT_DIR"
        print_status "Directorio anterior eliminado"
    fi
    
    # Crear directorio
    mkdir -p "$PROJECT_DIR"
    cd "$PROJECT_DIR"
    
    print_success "Directorio del proyecto preparado: $PROJECT_DIR"
}

# Función para crear archivo .env
create_env_file() {
    print_status "Creando archivo de configuración .env..."
    
    cat > "$PROJECT_DIR/.env" << EOF
# Variables de Entorno para Producción - Solucioning
# Configura estos valores según tu VPS
# Última actualización: $(date)

# Base de Datos PostgreSQL
POSTGRES_PASSWORD=SolucioningSecurePass2024!
POSTGRES_EXTERNAL_PORT=5432

# Backend API
SESSION_SECRET=super-long-random-string-for-solucioning-session-security-2024
BACKEND_PORT=5173

# Frontend
API_URL=http://$VPS_IP:5173
FRONTEND_PORT=3000

# Configuración adicional para producción
NODE_ENV=production
EOF
    
    print_success "Archivo .env creado con configuración para $VPS_IP"
}

# Función para construir y ejecutar servicios
build_and_run() {
    print_status "Construyendo imágenes Docker..."
    
    cd "$PROJECT_DIR"
    
    # Construir imágenes sin caché
    docker-compose -f "$DOCKER_COMPOSE_FILE" build --no-cache
    
    print_success "Imágenes construidas correctamente"
    
    print_status "Iniciando servicios..."
    
    # Ejecutar servicios
    docker-compose -f "$DOCKER_COMPOSE_FILE" up -d
    
    print_success "Servicios iniciados"
}

# Función para verificar servicios
verify_services() {
    print_status "Verificando servicios..."
    
    # Esperar a que los servicios se inicialicen
    sleep 15
    
    # Verificar contenedores
    print_status "Estado de contenedores:"
    docker ps
    
    # Verificar puertos
    print_status "Verificando puertos..."
    
    if netstat -tlnp | grep -q ":3000"; then
        print_success "Puerto 3000 (Frontend) está abierto"
    else
        print_error "Puerto 3000 (Frontend) no está abierto"
    fi
    
    if netstat -tlnp | grep -q ":5173"; then
        print_success "Puerto 5173 (Backend) está abierto"
    else
        print_error "Puerto 5173 (Backend) no está abierto"
    fi
    
    if netstat -tlnp | grep -q ":5432"; then
        print_success "Puerto 5432 (PostgreSQL) está abierto"
    else
        print_error "Puerto 5432 (PostgreSQL) no está abierto"
    fi
}

# Función para mostrar información final
show_final_info() {
    echo ""
    echo "🎉 ¡Instalación completada!"
    echo ""
    echo "📋 Información del sistema:"
    echo "   Frontend: http://$VPS_IP:3000"
    echo "   Backend API: http://$VPS_IP:5173"
    echo "   PostgreSQL: $VPS_IP:5432"
    echo ""
    echo "👥 Usuarios por defecto:"
    echo "   Super Admin: superadmin@glovo.com / superadmin123"
    echo "   Admin: admin@glovo.com / admin123"
    echo "   User: user@glovo.com / user123"
    echo ""
    echo "🔧 Comandos útiles:"
    echo "   Ver logs: docker-compose -f $DOCKER_COMPOSE_FILE logs -f"
    echo "   Reiniciar: docker-compose -f $DOCKER_COMPOSE_FILE restart"
    echo "   Detener: docker-compose -f $DOCKER_COMPOSE_FILE down"
    echo ""
    echo "📁 Directorio del proyecto: $PROJECT_DIR"
    echo ""
}

# Función principal
main() {
    echo "=========================================="
    echo "   INSTALACIÓN LIMPIA - SOLUCIONING"
    echo "=========================================="
    echo ""
    
    # Verificar que se ejecute como root
    if [ "$EUID" -ne 0 ]; then
        print_error "Este script debe ejecutarse como root"
        exit 1
    fi
    
    # Ejecutar pasos de instalación
    check_docker
    clean_docker
    prepare_project_directory
    create_env_file
    
    print_warning "IMPORTANTE: Ahora debes subir los archivos del proyecto al VPS"
    print_warning "Ejecuta desde tu máquina local:"
    echo "scp -r . root@$VPS_IP:$PROJECT_DIR/"
    echo ""
    
    read -p "¿Has subido los archivos? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        build_and_run
        verify_services
        show_final_info
    else
        print_warning "Instalación pausada. Sube los archivos y ejecuta el script nuevamente."
        exit 0
    fi
}

# Ejecutar función principal
main "$@" 