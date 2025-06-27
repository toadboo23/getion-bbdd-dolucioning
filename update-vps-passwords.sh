#!/bin/bash

# Script para actualizar contraseñas en el VPS - Solucioning
# Ejecutar desde tu máquina local

set -e

echo "🔐 Actualizando contraseñas del VPS..."

# Configuración del VPS
VPS_IP="69.62.107.86"
VPS_USER="root"

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

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

# Generar contraseñas seguras
print_header "=== GENERANDO CONTRASEÑAS SEGURAS ==="

# Generar contraseña para PostgreSQL (32 caracteres)
POSTGRES_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-32)
POSTGRES_PASSWORD="${POSTGRES_PASSWORD}!"

# Generar session secret (64 caracteres)
SESSION_SECRET=$(openssl rand -base64 64 | tr -d "=+/" | cut -c1-64)

print_status "Contraseñas generadas:"
echo "   PostgreSQL: ${POSTGRES_PASSWORD:0:10}..."
echo "   Session Secret: ${SESSION_SECRET:0:10}..."

# Crear nuevo archivo .env
print_header "=== CREANDO NUEVO ARCHIVO .ENV ==="

# Obtener IP del servidor
SERVER_IP=$(ssh $VPS_USER@$VPS_IP "curl -s ifconfig.me")

# Crear archivo .env temporal
cat > .env.new << EOF
# Variables de Entorno para Producción - Solucioning
# Configura estos valores según tu VPS
# Última actualización: $(date)

# Base de Datos PostgreSQL
POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
POSTGRES_EXTERNAL_PORT=5432

# Backend API
SESSION_SECRET=${SESSION_SECRET}
BACKEND_PORT=5173

# Frontend
API_URL=http://${SERVER_IP}:5173
FRONTEND_PORT=3000

# Configuración adicional para producción
NODE_ENV=production
EOF

print_status "Archivo .env temporal creado"

# Subir archivo al VPS
print_header "=== SUBIENDO ARCHIVO AL VPS ==="
scp .env.new $VPS_USER@$VPS_IP:/opt/solucioning/.env.new
print_status "Archivo subido al VPS"

# Hacer backup del archivo actual y aplicar el nuevo
print_header "=== APLICANDO CAMBIOS ==="
ssh $VPS_USER@$VPS_IP "cd /opt/solucioning && cp .env .env.backup.$(date +%Y%m%d_%H%M%S) && mv .env.new .env"
print_status "Backup creado y nuevo archivo aplicado"

# Reiniciar servicios para aplicar cambios
print_header "=== REINICIANDO SERVICIOS ==="
ssh $VPS_USER@$VPS_IP "cd /opt/solucioning && docker-compose -f docker-compose.prod.yml down && docker-compose -f docker-compose.prod.yml up -d"
print_status "Servicios reiniciados"

# Verificar que los servicios estén funcionando
print_header "=== VERIFICANDO SERVICIOS ==="
sleep 10
ssh $VPS_USER@$VPS_IP "cd /opt/solucioning && docker-compose -f docker-compose.prod.yml ps"

# Limpiar archivo temporal
rm -f .env.new

print_header "=== ACTUALIZACIÓN COMPLETADA ==="
print_status "✅ Contraseñas actualizadas exitosamente!"
echo ""
echo "📋 Información de las nuevas contraseñas:"
echo "   PostgreSQL: ${POSTGRES_PASSWORD}"
echo "   Session Secret: ${SESSION_SECRET}"
echo ""
echo "📁 Backup creado en: /opt/solucioning/.env.backup.*"
echo ""
print_warning "⚠️  IMPORTANTE: Guarda estas contraseñas en un lugar seguro"
print_warning "⚠️  IMPORTANTE: No las compartas ni las subas al repositorio"
echo ""
print_status "🔐 Sistema Solucioning actualizado con contraseñas seguras!" 