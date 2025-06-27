#!/bin/bash

# Script de despliegue limpio para VPS - Solucioning
# Ejecutar desde tu máquina local

set -e

echo "🚀 Iniciando despliegue limpio de Solucioning en VPS..."

# Configuración del VPS
VPS_IP="69.62.107.86"
VPS_USER="root"
VPS_SSH_KEY="~/.ssh/id_rsa"

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

# Verificar conexión SSH
print_header "=== VERIFICANDO CONEXIÓN SSH ==="
print_status "Probando conexión SSH al VPS..."
if ! ssh -o ConnectTimeout=10 -o BatchMode=yes $VPS_USER@$VPS_IP "echo 'Conexión SSH exitosa'" 2>/dev/null; then
    print_error "No se puede conectar al VPS. Verifica:"
    print_error "1. La IP del VPS es correcta: $VPS_IP"
    print_error "2. Las credenciales SSH son correctas"
    print_error "3. El puerto SSH (22) está abierto"
    exit 1
fi
print_status "✅ Conexión SSH exitosa"

# Subir script de limpieza al VPS
print_header "=== SUBIENDO SCRIPT DE LIMPIEZA ==="
print_status "Subiendo script vps-clean-install.sh al VPS..."
scp vps-clean-install.sh $VPS_USER@$VPS_IP:/opt/
print_status "✅ Script subido correctamente"

# Dar permisos de ejecución
print_status "Dando permisos de ejecución al script..."
ssh $VPS_USER@$VPS_IP "chmod +x /opt/vps-clean-install.sh"
print_status "✅ Permisos configurados"

# Ejecutar script de limpieza en el VPS
print_header "=== EJECUTANDO LIMPIEZA COMPLETA ==="
print_warning "⚠️  ADVERTENCIA: Esto borrará TODO en el VPS y reinstalará desde cero"
print_warning "⚠️  Se perderán todos los datos existentes"
echo ""
read -p "¿Estás seguro de que quieres continuar? (y/N): " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    print_error "Operación cancelada por el usuario"
    exit 1
fi

print_status "Ejecutando script de limpieza en el VPS..."
print_status "Esto puede tomar varios minutos..."

# Ejecutar el script en modo no interactivo
ssh $VPS_USER@$VPS_IP "cd /opt && ./vps-clean-install.sh"

print_header "=== VERIFICACIÓN FINAL ==="
print_status "Verificando que los servicios estén funcionando..."

# Esperar un poco más para que todo esté listo
sleep 30

# Verificar estado de los contenedores
print_status "Estado de los contenedores:"
ssh $VPS_USER@$VPS_IP "cd /opt/solucioning && docker-compose -f docker-compose.prod.yml ps"

# Verificar logs recientes
print_status "Logs recientes del backend:"
ssh $VPS_USER@$VPS_IP "cd /opt/solucioning && docker-compose -f docker-compose.prod.yml logs backend --tail=10"

print_status "Logs recientes del frontend:"
ssh $VPS_USER@$VPS_IP "cd /opt/solucioning && docker-compose -f docker-compose.prod.yml logs frontend --tail=10"

# Obtener IP del servidor
SERVER_IP=$(ssh $VPS_USER@$VPS_IP "curl -s ifconfig.me")

print_header "=== DESPLIEGUE COMPLETADO ==="
print_status "🎉 ¡Despliegue limpio completado exitosamente!"
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
echo "📝 Comandos útiles para el VPS:"
echo "   Conectar: ssh root@$VPS_IP"
echo "   Ver logs: cd /opt/solucioning && docker-compose -f docker-compose.prod.yml logs -f"
echo "   Reiniciar: cd /opt/solucioning && docker-compose -f docker-compose.prod.yml restart"
echo "   Actualizar: cd /opt/solucioning && git pull && docker-compose -f docker-compose.prod.yml up -d --build"
echo ""
print_warning "⚠️  IMPORTANTE: Cambia las credenciales en /opt/solucioning/.env por seguridad"
print_warning "⚠️  IMPORTANTE: Configura backups automáticos de la base de datos"
echo ""
print_status "✅ Sistema Solucioning reinstalado y funcionando en el VPS!" 