#!/bin/bash

# Script de instalación limpia para VPS - Solucioning
# Este script instala Docker, clona el proyecto desde GitHub y lo despliega

set -e

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

# Configuración
VPS_IP="69.62.107.86"
PROJECT_DIR="/opt/solucioning"
GITHUB_REPO="https://github.com/tu-usuario/solucioning.git"  # Cambiar por tu repo

print_status "=== INSTALACIÓN LIMPIA DE SOLUCIONING ==="
print_status "VPS IP: $VPS_IP"
print_status "Directorio: $PROJECT_DIR"

# Verificar si estamos como root
if [ "$EUID" -ne 0 ]; then
    print_error "Este script debe ejecutarse como root"
    exit 1
fi

# Actualizar sistema
print_status "Actualizando sistema..."
apt update && apt upgrade -y

# Instalar dependencias
print_status "Instalando dependencias..."
apt install -y curl wget git unzip software-properties-common apt-transport-https ca-certificates gnupg lsb-release

# Instalar Docker
print_status "Instalando Docker..."
if ! command -v docker &> /dev/null; then
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
    apt update
    apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
    systemctl enable docker
    systemctl start docker
    print_success "Docker instalado correctamente"
else
    print_warning "Docker ya está instalado"
fi

# Instalar Docker Compose
print_status "Instalando Docker Compose..."
if ! command -v docker-compose &> /dev/null; then
    curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
    print_success "Docker Compose instalado correctamente"
else
    print_warning "Docker Compose ya está instalado"
fi

# Limpiar instalaciones anteriores
print_status "Limpiando instalaciones anteriores..."
if [ -d "$PROJECT_DIR" ]; then
    rm -rf "$PROJECT_DIR"
    print_success "Directorio anterior eliminado"
fi

# Limpiar Docker
print_status "Limpiando Docker..."
docker system prune -af --volumes

# Crear directorio del proyecto
print_status "Creando directorio del proyecto..."
mkdir -p "$PROJECT_DIR"
cd "$PROJECT_DIR"

# Clonar proyecto desde GitHub
print_status "Clonando proyecto desde GitHub..."
if [ -n "$GITHUB_REPO" ] && [ "$GITHUB_REPO" != "https://github.com/tu-usuario/solucioning.git" ]; then
    git clone "$GITHUB_REPO" .
    print_success "Proyecto clonado correctamente"
else
    print_error "Por favor, configura la URL del repositorio GitHub en el script"
    exit 1
fi

# Configurar variables de entorno
print_status "Configurando variables de entorno..."
if [ -f "env.production" ]; then
    cp env.production .env
    # Actualizar API_URL con la IP del VPS
    sed -i "s|API_URL=http://localhost:5173|API_URL=http://$VPS_IP:5173|g" .env
    sed -i "s|API_URL=http://69.62.107.86:5173|API_URL=http://$VPS_IP:5173|g" .env
    print_success "Variables de entorno configuradas"
else
    print_error "Archivo env.production no encontrado"
    exit 1
fi

# Dar permisos al script de entrada
if [ -f "docker-entrypoint.sh" ]; then
    chmod +x docker-entrypoint.sh
fi

# Construir y ejecutar contenedores
print_status "Construyendo contenedores..."
docker-compose -f docker-compose.prod.yml build --no-cache

print_status "Iniciando servicios..."
docker-compose -f docker-compose.prod.yml up -d

# Esperar a que los servicios estén listos
print_status "Esperando a que los servicios estén listos..."
sleep 30

# Verificar estado de los servicios
print_status "Verificando estado de los servicios..."
docker-compose -f docker-compose.prod.yml ps

# Verificar logs
print_status "Verificando logs del backend..."
docker logs solucioning_backend --tail 10

print_status "Verificando logs del frontend..."
docker logs solucioning_frontend --tail 5

# Información final
print_success "=== INSTALACIÓN COMPLETADA ==="
print_status "URLs de acceso:"
print_status "  Frontend: http://$VPS_IP:3000"
print_status "  Backend API: http://$VPS_IP:5173"
print_status ""
print_status "Credenciales de acceso:"
print_status "  Super Admin: superadmin@glovo.com / superadmin123"
print_status "  Admin: admin@glovo.com / admin123"
print_status "  User: user@glovo.com / user123"
print_status ""
print_status "Comandos útiles:"
print_status "  Ver logs: docker-compose -f docker-compose.prod.yml logs -f"
print_status "  Reiniciar: docker-compose -f docker-compose.prod.yml restart"
print_status "  Detener: docker-compose -f docker-compose.prod.yml down"
print_status ""
print_success "¡Solucioning está listo para usar!" 