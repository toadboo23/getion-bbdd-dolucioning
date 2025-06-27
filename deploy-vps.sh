#!/bin/bash

# Script de despliegue para VPS - Solucioning
# Ejecutar como root o con sudo

set -e  # Salir si hay algún error

echo "🚀 Iniciando despliegue de Solucioning en VPS..."

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
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

# Verificar si Docker está instalado
if ! command -v docker &> /dev/null; then
    print_error "Docker no está instalado. Instalando Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    usermod -aG docker $USER
    rm get-docker.sh
    print_status "Docker instalado correctamente"
else
    print_status "Docker ya está instalado"
fi

# Verificar si Docker Compose está instalado
if ! command -v docker-compose &> /dev/null; then
    print_error "Docker Compose no está instalado. Instalando..."
    curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
    print_status "Docker Compose instalado correctamente"
else
    print_status "Docker Compose ya está instalado"
fi

# Crear directorio del proyecto
PROJECT_DIR="/opt/solucioning"
print_status "Creando directorio del proyecto en $PROJECT_DIR"
mkdir -p $PROJECT_DIR
cd $PROJECT_DIR

# Verificar si el archivo .env existe
if [ ! -f ".env" ]; then
    print_warning "Archivo .env no encontrado. Creando desde template..."
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
API_URL=http://$(curl -s ifconfig.me):5173
FRONTEND_PORT=3000

# Configuración adicional para producción
NODE_ENV=production
EOF
    print_status "Archivo .env creado. Por favor, revisa y modifica las credenciales"
else
    print_status "Archivo .env encontrado"
fi

# Detener contenedores existentes si los hay
print_status "Deteniendo contenedores existentes..."
docker-compose -f docker-compose.prod.yml down 2>/dev/null || true

# Limpiar imágenes antiguas
print_status "Limpiando imágenes antiguas..."
docker system prune -f

# Construir y levantar contenedores
print_status "Construyendo y levantando contenedores..."
docker-compose -f docker-compose.prod.yml build --no-cache
docker-compose -f docker-compose.prod.yml up -d

# Esperar a que los servicios estén listos
print_status "Esperando a que los servicios estén listos..."
sleep 30

# Verificar estado de los contenedores
print_status "Verificando estado de los contenedores..."
docker-compose -f docker-compose.prod.yml ps

# Verificar logs
print_status "Verificando logs del backend..."
docker-compose -f docker-compose.prod.yml logs backend --tail=20

print_status "Verificando logs del frontend..."
docker-compose -f docker-compose.prod.yml logs frontend --tail=10

# Configurar firewall (si está disponible)
if command -v ufw &> /dev/null; then
    print_status "Configurando firewall..."
    ufw allow 22/tcp    # SSH
    ufw allow 80/tcp    # HTTP
    ufw allow 443/tcp   # HTTPS
    ufw allow 3000/tcp  # Frontend
    ufw allow 5173/tcp  # Backend
    ufw allow 5432/tcp  # PostgreSQL (solo si necesitas acceso externo)
    ufw --force enable
    print_status "Firewall configurado"
fi

# Obtener IP del servidor
SERVER_IP=$(curl -s ifconfig.me)

print_status "🎉 Despliegue completado!"
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