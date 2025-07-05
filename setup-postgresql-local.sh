#!/bin/bash

# Script para configurar PostgreSQL local en el VPS
# Ejecutar en el VPS después de instalar PostgreSQL

set -e

echo "🗄️ Configurando PostgreSQL local para Solucioning..."

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

# Verificar que estamos ejecutando como root
if [ "$EUID" -ne 0 ]; then
    print_error "Este script debe ejecutarse como root"
    exit 1
fi

print_header "=== CONFIGURACIÓN DE POSTGRESQL LOCAL ==="

# Verificar que PostgreSQL esté instalado
if ! command -v psql &> /dev/null; then
    print_error "PostgreSQL no está instalado"
    exit 1
fi

print_status "PostgreSQL instalado: $(psql --version)"

# Configurar PostgreSQL para aceptar conexiones locales
print_header "=== CONFIGURACIÓN DE CONEXIONES ==="

# Configurar listen_addresses
sed -i "s/#listen_addresses = 'localhost'/listen_addresses = 'localhost'/" /etc/postgresql/15/main/postgresql.conf

print_status "PostgreSQL configurado para escuchar en localhost"

# Configurar autenticación
print_header "=== CONFIGURACIÓN DE AUTENTICACIÓN ==="

# Agregar reglas de autenticación para usuario solucioning
echo "host    employee_management    solucioning        127.0.0.1/32            scram-sha-256" >> /etc/postgresql/15/main/pg_hba.conf
echo "host    employee_management    solucioning        ::1/128                 scram-sha-256" >> /etc/postgresql/15/main/pg_hba.conf

print_status "Reglas de autenticación agregadas"

# Crear usuario y base de datos
print_header "=== CREACIÓN DE USUARIO Y BASE DE DATOS ==="

# Crear base de datos
sudo -u postgres psql -c "CREATE DATABASE employee_management;" 2>/dev/null || print_warning "Base de datos ya existe"

# Crear usuario
sudo -u postgres psql -c "CREATE USER solucioning WITH ENCRYPTED PASSWORD 'SolucioningSecurePass2024!';" 2>/dev/null || print_warning "Usuario ya existe"

# Otorgar privilegios
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE employee_management TO solucioning;"
sudo -u postgres psql -c "ALTER USER solucioning CREATEDB;"

print_status "Usuario solucioning creado con privilegios"

# Reiniciar PostgreSQL
print_header "=== REINICIANDO POSTGRESQL ==="

systemctl restart postgresql
systemctl enable postgresql

print_status "PostgreSQL reiniciado y habilitado"

# Verificar configuración
print_header "=== VERIFICACIÓN DE CONFIGURACIÓN ==="

# Verificar que PostgreSQL esté funcionando
if systemctl is-active --quiet postgresql; then
    print_status "✅ PostgreSQL está funcionando"
else
    print_error "❌ PostgreSQL no está funcionando"
    exit 1
fi

# Verificar conexión
if sudo -u postgres psql -d employee_management -c "SELECT 1;" > /dev/null 2>&1; then
    print_status "✅ Conexión a base de datos exitosa"
else
    print_error "❌ No se puede conectar a la base de datos"
    exit 1
fi

# Verificar usuario solucioning
if sudo -u postgres psql -c "SELECT 1 FROM pg_user WHERE usename = 'solucioning';" | grep -q "1"; then
    print_status "✅ Usuario solucioning existe"
else
    print_error "❌ Usuario solucioning no existe"
    exit 1
fi

print_header "=== CONFIGURACIÓN COMPLETADA ==="

print_status "🎉 PostgreSQL local configurado exitosamente!"
echo ""
echo "📋 Información de configuración:"
echo "   🗄️  Base de datos: employee_management"
echo "   👤 Usuario: solucioning"
echo "   🔐 Contraseña: SolucioningSecurePass2024!"
echo "   🌐 Host: localhost"
echo "   🏷 Puerto: 5432"
echo ""
print_warning "⚠️  IMPORTANTE: Cambia la contraseña por seguridad"
print_warning "⚠️  IMPORTANTE: El puerto 5432 NO está expuesto externamente"
echo ""
print_status "✅ PostgreSQL listo para conectar con contenedores Docker" 