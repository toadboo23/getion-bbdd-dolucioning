#!/bin/bash

# Script para generar contraseñas seguras para producción
# Ejecutar este script para generar credenciales seguras

set -e

echo "�� Generando contraseñas seguras para Solucioning..."

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

print_status "Contraseñas generadas exitosamente:"
echo "   PostgreSQL: ${POSTGRES_PASSWORD:0:10}..."
echo "   Session Secret: ${SESSION_SECRET:0:10}..."

# Crear archivo .env seguro
print_header "=== CREANDO ARCHIVO .ENV SEGURO ==="

cat > .env.secure << EOF
# Variables de Entorno Seguras para Solucioning
# Generado automáticamente el $(date)
# IMPORTANTE: Guarda este archivo en un lugar seguro

# Base de Datos PostgreSQL (instalado directamente en VPS)
POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=employee_management
POSTGRES_USER=solucioning

# Backend API
SESSION_SECRET=${SESSION_SECRET}
BACKEND_PORT=5173

# Frontend
API_URL=http://localhost:5173
FRONTEND_PORT=3000

# Configuración adicional
NODE_ENV=development
EOF

print_status "Archivo .env.secure creado"

# Crear archivo .env.production seguro
cat > .env.production.secure << EOF
# Variables de Entorno Seguras para Producción - Solucioning
# Generado automáticamente el $(date)
# IMPORTANTE: Guarda este archivo en un lugar seguro

# Base de Datos PostgreSQL (instalado directamente en VPS)
POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=employee_management
POSTGRES_USER=solucioning

# Backend API
SESSION_SECRET=${SESSION_SECRET}
BACKEND_PORT=5173

# Frontend
API_URL=http://TU_IP_VPS:5173
FRONTEND_PORT=3000

# Configuración adicional para producción
NODE_ENV=production
EOF

print_status "Archivo .env.production.secure creado"

print_header "=== INFORMACIÓN DE SEGURIDAD ==="
echo ""
echo "Contraseñas generadas:"
echo "   PostgreSQL: ${POSTGRES_PASSWORD}"
echo "   Session Secret: ${SESSION_SECRET}"
echo ""
echo "Archivos creados:"
echo "   .env.secure (para desarrollo)"
echo "   .env.production.secure (para producción)"
echo ""
print_warning "IMPORTANTE:"
echo "   1. Guarda estas contraseñas en un lugar seguro"
echo "   2. NO las subas al repositorio"
echo "   3. Cambia las contraseñas regularmente"
echo "   4. Usa diferentes contraseñas para cada entorno"
echo ""
print_status "✅ Contraseñas seguras generadas exitosamente!" 