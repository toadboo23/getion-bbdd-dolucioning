#!/bin/bash

# Script de limpieza completa y reinstalación para VPS - Solucioning
# Ejecutar como root en el VPS

set -e  # Salir si hay algún error

echo "🧹 Iniciando limpieza completa y reinstalación de Solucioning en VPS..."

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Función para imprimir mensajes
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_header() {
    echo -e "${BLUE}[HEADER]${NC} $1"
}

# Verificar que estamos ejecutando como root
if [ "$EUID" -ne 0 ]; then
    print_error "Este script debe ejecutarse como root"
    exit 1
fi

print_header "=== LIMPIEZA COMPLETA DEL SISTEMA ==="

# Detener todos los contenedores Docker
print_status "Deteniendo todos los contenedores Docker..."
docker stop $(docker ps -aq) 2>/dev/null || true
docker rm $(docker ps -aq) 2>/dev/null || true

# Eliminar todas las imágenes Docker
print_status "Eliminando todas las imágenes Docker..."
docker rmi $(docker images -aq) 2>/dev/null || true

# Eliminar todos los volúmenes Docker
print_status "Eliminando todos los volúmenes Docker..."
docker volume rm $(docker volume ls -q) 2>/dev/null || true

# Eliminar todas las redes Docker
print_status "Eliminando todas las redes Docker..."
docker network rm $(docker network ls -q) 2>/dev/null || true

# Limpieza completa del sistema Docker
print_status "Limpieza completa del sistema Docker..."
docker system prune -a -f --volumes

# Eliminar directorio del proyecto
print_status "Eliminando directorio del proyecto..."
rm -rf /opt/solucioning
rm -rf /opt/vps-setup.sh

# Limpiar archivos temporales
print_status "Limpiando archivos temporales..."
apt clean
apt autoremove -y

print_header "=== REINSTALACIÓN COMPLETA ==="

# Actualizar el sistema
print_status "Actualizando sistema..."
apt update && apt upgrade -y

# Instalar dependencias básicas
print_status "Instalando dependencias básicas..."
apt install -y curl wget git ufw software-properties-common apt-transport-https ca-certificates gnupg lsb-release

# Verificar si Docker está instalado
print_header "=== INSTALACIÓN DE DOCKER ==="
if ! command -v docker &> /dev/null; then
    print_status "Docker no está instalado. Instalando Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    usermod -aG docker $USER
    rm get-docker.sh
    print_status "Docker instalado correctamente"
else
    print_status "Docker ya está instalado: $(docker --version)"
fi

# Verificar si Docker Compose está instalado
if ! command -v docker-compose &> /dev/null; then
    print_status "Docker Compose no está instalado. Instalando..."
    curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
    print_status "Docker Compose instalado correctamente"
else
    print_status "Docker Compose ya está instalado: $(docker-compose --version)"
fi

# Crear directorio del proyecto
print_header "=== CONFIGURACIÓN DEL PROYECTO ==="
PROJECT_DIR="/opt/solucioning"
print_status "Creando directorio del proyecto en $PROJECT_DIR"
mkdir -p $PROJECT_DIR
cd $PROJECT_DIR

# Clonar el repositorio
print_status "Clonando repositorio de Solucioning..."
git clone https://github.com/toadboo23/db_local.git .
git checkout Develop
print_status "Repositorio clonado correctamente"

# Configurar archivo .env
print_header "=== CONFIGURACIÓN DE VARIABLES DE ENTORNO ==="
print_warning "Creando archivo .env desde cero..."

# Obtener IP del servidor
SERVER_IP=$(curl -s ifconfig.me)

cat > .env << EOF
# Variables de Entorno para Producción - Solucioning
# Configura estos valores según tu VPS

# Base de Datos PostgreSQL
POSTGRES_PASSWORD=SolucioningSecurePass2024!
POSTGRES_EXTERNAL_PORT=5432

# Backend API
SESSION_SECRET=super-long-random-string-for-solucioning-session-security-2024
BACKEND_PORT=5173

# Frontend
API_URL=http://$SERVER_IP:5173
FRONTEND_PORT=3000

# Configuración adicional para producción
NODE_ENV=production
EOF
print_status "Archivo .env creado con IP: $SERVER_IP"
print_warning "IMPORTANTE: Cambia las credenciales por defecto por seguridad"

# Configurar firewall
print_header "=== CONFIGURACIÓN DE FIREWALL ==="
print_status "Configurando firewall UFW..."
ufw --force reset
ufw allow 22/tcp    # SSH
ufw allow 80/tcp    # HTTP
ufw allow 443/tcp   # HTTPS
ufw allow 3000/tcp  # Frontend
ufw allow 5173/tcp  # Backend
# ufw allow 5432/tcp  # PostgreSQL (comentado por seguridad)
ufw --force enable
print_status "Firewall configurado y habilitado"

# Construir y levantar contenedores
print_header "=== DESPLIEGUE DE LA APLICACIÓN ==="
print_status "Construyendo contenedores desde cero..."
docker-compose -f docker-compose.prod.yml build --no-cache
print_status "Levantando contenedores..."
docker-compose -f docker-compose.prod.yml up -d

# Esperar a que los servicios estén listos
print_status "Esperando a que los servicios estén listos..."
sleep 45

# Verificar estado de los contenedores
print_header "=== VERIFICACIÓN DE SERVICIOS ==="
print_status "Verificando estado de los contenedores..."
docker-compose -f docker-compose.prod.yml ps

# Verificar logs
print_status "Verificando logs del backend..."
docker-compose -f docker-compose.prod.yml logs backend --tail=30

print_status "Verificando logs del frontend..."
docker-compose -f docker-compose.prod.yml logs frontend --tail=20

print_status "Verificando logs de PostgreSQL..."
docker-compose -f docker-compose.prod.yml logs postgres --tail=10

# Verificar que los servicios estén respondiendo
print_status "Verificando que los servicios estén respondiendo..."
sleep 10

# Probar endpoints
print_status "Probando endpoints..."
if curl -s http://localhost:3000 > /dev/null; then
    print_status "✅ Frontend respondiendo en puerto 3000"
else
    print_warning "⚠️  Frontend no responde en puerto 3000"
fi

if curl -s http://localhost:5173/api/health > /dev/null; then
    print_status "✅ Backend respondiendo en puerto 5173"
else
    print_warning "⚠️  Backend no responde en puerto 5173"
fi

# Obtener IP del servidor
SERVER_IP=$(curl -s ifconfig.me)

print_header "=== REINSTALACIÓN COMPLETADA ==="
print_status "🎉 Reinstalación completada exitosamente!"
echo ""
echo "📋 Información del despliegue:"
echo "   🌐 Frontend: http://$SERVER_IP:3000"
echo "   🔧 Backend API: http://$SERVER_IP:5173"
echo "   🗄️  Base de datos: $SERVER_IP:5432"
echo ""
echo "👥 Usuarios disponibles:"
echo "   Super Admin: admin@dvv5.com / admin123"
echo "   Super Admin: lvega@solucioning.net / 84739265"
echo "   Super Admin: superadmin@solucioning.net / 39284756"
echo ""
echo "📝 Comandos útiles:"
echo "   Ver logs: docker-compose -f docker-compose.prod.yml logs -f"
echo "   Reiniciar: docker-compose -f docker-compose.prod.yml restart"
echo "   Detener: docker-compose -f docker-compose.prod.yml down"
echo "   Actualizar: git pull && docker-compose -f docker-compose.prod.yml up -d --build"
echo ""
print_warning "⚠️  IMPORTANTE: Cambia las credenciales en el archivo .env por seguridad"
print_warning "⚠️  IMPORTANTE: Configura backups automáticos de la base de datos"
echo ""
print_status "✅ Sistema Solucioning reinstalado y funcionando en el VPS!" 