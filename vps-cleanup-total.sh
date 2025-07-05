#!/bin/bash

# SCRIPT DE LIMPIEZA TOTAL DEL VPS - SOLUCIONING
# EJECUTAR COMO ROOT EN EL VPS
# ESTE SCRIPT ELIMINA TODO Y DEJA EL VPS LISTO PARA REINSTALACIÃ“N

set -e

echo "INICIANDO LIMPIEZA TOTAL DEL VPS"
echo "================================"
echo "ADVERTENCIA: Esto borrarÃ¡ TODO en el VPS"
echo "Se perderÃ¡n todos los datos existentes"
echo ""

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

print_header "=== LIMPIEZA COMPLETA DEL SISTEMA ==="

# Detener todos los servicios
print_status "Deteniendo todos los servicios..."
systemctl stop postgresql 2>/dev/null || true
systemctl stop docker 2>/dev/null || true

# Detener todos los contenedores Docker
print_status "Deteniendo todos los contenedores Docker..."
docker stop $(docker ps -aq) 2>/dev/null || true
docker rm $(docker ps -aq) 2>/dev/null || true

# Eliminar todas las imÃ¡genes Docker
print_status "Eliminando todas las imÃ¡genes Docker..."
docker rmi $(docker images -aq) 2>/dev/null || true

# Eliminar todos los volÃºmenes Docker
print_status "Eliminando todos los volÃºmenes Docker..."
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
rm -rf /opt/vps-clean-install.sh
rm -rf /opt/vps-clean-install-final.sh

# Desinstalar PostgreSQL completamente
print_status "Desinstalando PostgreSQL..."
apt remove --purge -y postgresql* 2>/dev/null || true
apt autoremove -y
rm -rf /var/lib/postgresql
rm -rf /etc/postgresql
rm -rf /var/log/postgresql

# Limpiar archivos temporales
print_status "Limpiando archivos temporales..."
apt clean
apt autoremove -y

# Limpiar logs del sistema
print_status "Limpiando logs del sistema..."
journalctl --vacuum-time=1s
rm -rf /var/log/*.log
rm -rf /var/log/*.gz

# Limpiar cache
print_status "Limpiando cache..."
rm -rf /var/cache/*
rm -rf /tmp/*

print_header "=== LIMPIEZA COMPLETADA ==="
print_status "VPS completamente limpio y listo para reinstalaciÃ³n"
echo ""
echo "Estado del sistema:"
echo "   Todos los contenedores Docker eliminados"
echo "   Todas las imÃ¡genes Docker eliminadas"
echo "   Todos los volÃºmenes Docker eliminados"
echo "   PostgreSQL completamente desinstalado"
echo "   Directorio del proyecto eliminado"
echo "   Archivos temporales limpiados"
echo "   Cache del sistema limpiado"
echo ""
print_warning "El VPS estÃ¡ listo para una reinstalaciÃ³n limpia desde cero"
echo ""
print_status "Limpieza total completada exitosamente!"
