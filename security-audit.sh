#!/bin/bash

# Script de auditoría de seguridad completa para Solucioning
# Verifica todos los aspectos críticos de seguridad antes del despliegue

set -e

echo "🔒 Auditoría de Seguridad Completa - Solucioning"
echo "================================================"

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() {
    echo -e "${GREEN}[✅]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[⚠️]${NC} $1"
}

print_error() {
    echo -e "${RED}[❌]${NC} $1"
}

print_header() {
    echo -e "${BLUE}[🔍]${NC} $1"
}

# Contador de problemas
CRITICAL_ISSUES=0
WARNINGS=0

print_header "=== VERIFICACIÓN DE CONFIGURACIÓN DOCKER ==="

# Verificar docker-compose.prod.yml
print_status "Verificando docker-compose.prod.yml..."

if [ -f "docker-compose.prod.yml" ]; then
    # Verificar que NO incluya PostgreSQL
    if grep -q "postgres:" docker-compose.prod.yml; then
        print_error "CRÍTICO: docker-compose.prod.yml incluye PostgreSQL en Docker"
        print_error "   PostgreSQL debe estar instalado localmente en el VPS"
        CRITICAL_ISSUES=$((CRITICAL_ISSUES + 1))
    else
        print_status "✅ docker-compose.prod.yml NO incluye PostgreSQL"
    fi
    
    # Verificar que use host.docker.internal
    if grep -q "host.docker.internal" docker-compose.prod.yml; then
        print_status "✅ docker-compose.prod.yml usa host.docker.internal"
    else
        print_error "CRÍTICO: docker-compose.prod.yml no usa host.docker.internal"
        CRITICAL_ISSUE
    fi
else
    print_error "CRÍTICO: docker-compose.prod.yml no existe"
    CRITICAL_ISSUES=$((CRITICAL_ISSUES + 1))
fi

print_header "=== VERIFICACIÓN DE CONFIGURACIÓN ENVIRONMENT ==="

# Verificar env.production
print_status "Verificando env.production..."

if [ -f "env.production" ]; then
    # Verificar que use usuario correcto
    if grep -q "POSTGRES_USER=solucioning" env.production; then
        print_status "✅ env.production usa usuario correcto"
    else
        print_error "CRÍTICO: env.production no usa usuario correcto"
        CRITICAL_ISSUES=$((CRITICAL_ISSUES + 1))
    fi
    
    # Verificar que use contraseña correcta
    if grep -q "POSTGRES_PASSWORD=SolucioningSecurePass2024!" env.production; then
        print_status "✅ env.production usa contraseña correcta"
    else
        print_error "CRÍTICO: env.production no usa contraseña correcta"
        CRITICAL_ISSUES=$((CRITICAL_ISSUES + 1))
    fi
else
    print_error "CRÍTICO: env.production no existe"
    CRITICAL_ISSUES=$((CRITICAL_ISSUES + 1))
fi

print_header "=== VERIFICACIÓN DE CONFIGURACIÓN INIT.SQL ==="

# Verificar init.sql
print_status "Verificando init.sql..."

if [ -f "init.sql" ]; then
    # Verificar que use contraseñas hasheadas
    if grep -q "password varchar(255) NOT NULL" init.sql; then
        print_status "✅ init.sql usa contraseñas hasheadas"
    else
        print_error "CRÍTICO: init.sql no usa contraseñas hasheadas"
        CRITICAL_ISSUES=$((CRITICAL_ISSUES + 1))
    fi
else
    print_error "CRÍTICO: init.sql no existe"
    CRITICAL_ISSUES=$((CRITICAL_ISSUES + 1))
fi

print_header "=== VERIFICACIÓN DE SEGURIDAD COMPLETA ==="

if [ $CRITICAL_ISSUES -eq 0 ]; then
    print_status "✅ Seguridad Completa - Solucioning"
else
    print_error "❌ Seguridad Completa - Solucioning"
    print_error "Se encontraron $CRITICAL_ISSUES problemas críticos y $WARNINGS advertencias"
fi 