# Script para generar el archivo de limpieza bash
# Este script genera un archivo bash que se ejecutará en el VPS

$VPS_IP = "69.62.107.86"
$VPS_USER = "root"
$VPS_PASSWORD = "Patoloco2323@@"

Write-Host "Generando script de limpieza total para el VPS..." -ForegroundColor Green
Write-Host ""

# Crear el script de limpieza bash
$cleanupScript = @'
#!/bin/bash

# SCRIPT DE LIMPIEZA TOTAL DEL VPS - SOLUCIONING
# EJECUTAR COMO ROOT EN EL VPS
# ESTE SCRIPT ELIMINA TODO Y DEJA EL VPS LISTO PARA REINSTALACIÓN

set -e

echo "INICIANDO LIMPIEZA TOTAL DEL VPS"
echo "================================"
echo "ADVERTENCIA: Esto borrará TODO en el VPS"
echo "Se perderán todos los datos existentes"
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
print_status "VPS completamente limpio y listo para reinstalación"
echo ""
echo "Estado del sistema:"
echo "   Todos los contenedores Docker eliminados"
echo "   Todas las imágenes Docker eliminadas"
echo "   Todos los volúmenes Docker eliminados"
echo "   PostgreSQL completamente desinstalado"
echo "   Directorio del proyecto eliminado"
echo "   Archivos temporales limpiados"
echo "   Cache del sistema limpiado"
echo ""
print_warning "El VPS está listo para una reinstalación limpia desde cero"
echo ""
print_status "Limpieza total completada exitosamente!"
'@

# Guardar el script bash
$cleanupScript | Out-File -FilePath "vps-cleanup-total.sh" -Encoding UTF8

Write-Host "Script de limpieza total generado: vps-cleanup-total.sh" -ForegroundColor Green
Write-Host ""
Write-Host "INSTRUCCIONES PARA EJECUTAR LA LIMPIEZA:" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Conéctate al VPS:" -ForegroundColor White
Write-Host "   ssh root@${VPS_IP}" -ForegroundColor Yellow
Write-Host ""
Write-Host "2. Copia el script al VPS:" -ForegroundColor White
Write-Host "   scp vps-cleanup-total.sh root@${VPS_IP}:/opt/" -ForegroundColor Yellow
Write-Host ""
Write-Host "3. Ejecuta la limpieza total:" -ForegroundColor White
Write-Host "   ssh root@${VPS_IP} 'chmod +x /opt/vps-cleanup-total.sh && /opt/vps-cleanup-total.sh'" -ForegroundColor Yellow
Write-Host ""
Write-Host "ADVERTENCIA: Esto borrará TODO en el VPS" -ForegroundColor Red
Write-Host "Se perderán todos los datos existentes" -ForegroundColor Red
Write-Host ""
Write-Host "¿Quieres que proceda con la copia y ejecución automática?" -ForegroundColor Green
$confirmation = Read-Host "Escribe 'SI' para continuar: "
if ($confirmation -eq "SI") {
    Write-Host ""
    Write-Host "Procediendo con la limpieza automática..." -ForegroundColor Green
    
    # Copiar script al VPS
    Write-Host "Copiando script al VPS..." -ForegroundColor Yellow
    scp -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null "vps-cleanup-total.sh" "${VPS_USER}@${VPS_IP}:/opt/"
    
    # Ejecutar limpieza
    Write-Host "Ejecutando limpieza total..." -ForegroundColor Yellow
    ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null "${VPS_USER}@${VPS_IP}" "chmod +x /opt/vps-cleanup-total.sh && /opt/vps-cleanup-total.sh"
    
    Write-Host ""
    Write-Host "Limpieza total completada!" -ForegroundColor Green
    Write-Host "El VPS está listo para una reinstalación limpia desde cero." -ForegroundColor Green
} else {
    Write-Host "Operación cancelada por el usuario." -ForegroundColor Red
    Write-Host "El script vps-cleanup-total.sh está listo para usar manualmente." -ForegroundColor Yellow
} 