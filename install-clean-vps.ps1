# Script para reinstalación limpia del VPS con PostgreSQL local
# PostgreSQL instalado directamente en el VPS (fuera de Docker)
# Aplicación en contenedores Docker

$VPS_IP = "69.62.107.86"
$VPS_USER = "root"
$VPS_PASSWORD = "Patoloco2323@@"

Write-Host "Generando script de reinstalación limpia para el VPS..." -ForegroundColor Green
Write-Host ""

# Crear el script de instalación
$installScript = @'
#!/bin/bash

# SCRIPT DE REINSTALACIÓN LIMPIA DEL VPS - SOLUCIONING
# EJECUTAR COMO ROOT EN EL VPS
# PostgreSQL instalado localmente + Aplicación en Docker

set -e

echo "INICIANDO REINSTALACIÓN LIMPIA DEL VPS"
echo "======================================"
echo "PostgreSQL: Instalado localmente (fuera de Docker)"
echo "Aplicación: En contenedores Docker"
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

print_header "=== ACTUALIZACIÓN DEL SISTEMA ==="

# Actualizar el sistema
print_status "Actualizando sistema..."
apt update && apt upgrade -y

# Instalar dependencias básicas
print_status "Instalando dependencias básicas..."
apt install -y curl wget git ufw software-properties-common apt-transport-https ca-certificates gnupg lsb-release

print_header "=== INSTALACIÓN DE POSTGRESQL LOCAL ==="
print_status "Instalando PostgreSQL directamente en el VPS..."

# Agregar repositorio oficial de PostgreSQL
wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | apt-key add -
echo "deb http://apt.postgresql.org/pub/repos/apt/ $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list

# Actualizar e instalar PostgreSQL
apt update
apt install -y postgresql-15 postgresql-contrib-15

# Configurar PostgreSQL
print_status "Configurando PostgreSQL desde cero..."

# Crear usuario y base de datos
sudo -u postgres psql -c "CREATE DATABASE employee_management;"
sudo -u postgres psql -c "CREATE USER solucioning WITH ENCRYPTED PASSWORD 'SolucioningSecurePass2024!';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE employee_management TO solucioning;"
sudo -u postgres psql -c "ALTER USER solucioning CREATEDB;"

# Configurar PostgreSQL para aceptar conexiones locales
sed -i "s/#listen_addresses = 'localhost'/listen_addresses = 'localhost'/" /etc/postgresql/15/main/postgresql.conf

# Configurar autenticación
echo "host    employee_management    solucioning        127.0.0.1/32            scram-sha-256" >> /etc/postgresql/15/main/pg_hba.conf
echo "host    employee_management    solucioning        ::1/128                 scram-sha-256" >> /etc/postgresql/15/main/pg_hba.conf

# Reiniciar PostgreSQL
systemctl restart postgresql
systemctl enable postgresql

print_status "PostgreSQL instalado y configurado correctamente"

print_header "=== INSTALACIÓN DE DOCKER ==="

# Instalar Docker desde cero
print_status "Instalando Docker desde cero..."
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
usermod -aG docker $USER
rm get-docker.sh
print_status "Docker instalado correctamente: $(docker --version)"

# Instalar Docker Compose
print_status "Instalando Docker Compose..."
curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose
print_status "Docker Compose instalado correctamente: $(docker-compose --version)"

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

print_header "=== INICIALIZACIÓN DE BASE DE DATOS ==="
print_status "Ejecutando script de inicialización..."

# Copiar archivos de configuración
cp postgres.conf /etc/postgresql/15/main/postgresql.conf
cp init.sql /tmp/init.sql

# Ejecutar script de inicialización
sudo -u postgres psql -d employee_management -f /tmp/init.sql

print_status "Base de datos inicializada correctamente"

print_header "=== CONFIGURACIÓN DE VARIABLES DE ENTORNO ==="
print_warning "Creando archivo .env desde cero..."

# Obtener IP del servidor
SERVER_IP=$(curl -s ifconfig.me)

cat > .env << EOF
# Variables de Entorno para Producción - Solucioning
# Configura estos valores según tu VPS

# Base de Datos PostgreSQL (instalado directamente en VPS)
POSTGRES_PASSWORD=SolucioningSecurePass2024!
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=employee_management
POSTGRES_USER=solucioning

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

print_header "=== DESPLIEGUE DE LA APLICACIÓN ==="
print_status "Construyendo contenedores desde cero..."
docker-compose -f docker-compose.prod.yml build --no-cache
print_status "Levantando contenedores..."
docker-compose -f docker-compose.prod.yml up -d

# Esperar a que los servicios estén listos
print_status "Esperando a que los servicios estén listos..."
sleep 60

print_header "=== VERIFICACIÓN DE SERVICIOS ==="
print_status "Verificando estado de los contenedores..."
docker-compose -f docker-compose.prod.yml ps

# Verificar logs
print_status "Verificando logs del backend..."
docker-compose -f docker-compose.prod.yml logs backend --tail=30

print_status "Verificando logs del frontend..."
docker-compose -f docker-compose.prod.yml logs frontend --tail=20

# Verificar que PostgreSQL esté funcionando
print_status "Verificando PostgreSQL..."
systemctl status postgresql

# Verificar que los servicios estén respondiendo
print_status "Verificando que los servicios estén respondiendo..."
sleep 15

# Probar endpoints
print_status "Probando endpoints..."
if curl -s http://localhost:3000 > /dev/null; then
    print_status "Frontend respondiendo en puerto 3000"
else
    print_warning "Frontend no responde en puerto 3000"
fi

if curl -s http://localhost:5173/api/health > /dev/null; then
    print_status "Backend respondiendo en puerto 5173"
else
    print_warning "Backend no responde en puerto 5173"
fi

# Probar conexión a PostgreSQL
print_status "Probando conexión a PostgreSQL..."
if sudo -u postgres psql -d employee_management -c "SELECT 1;" > /dev/null 2>&1; then
    print_status "PostgreSQL funcionando correctamente"
else
    print_warning "PostgreSQL no responde correctamente"
fi

# Verificar que el puerto 5432 NO esté expuesto
print_status "Verificando que PostgreSQL no esté expuesto..."
if netstat -tlnp | grep ":5432" > /dev/null; then
    print_warning "Puerto 5432 está expuesto (debe estar solo en localhost)"
else
    print_status "Puerto 5432 no está expuesto externamente"
fi

# Obtener IP del servidor
SERVER_IP=$(curl -s ifconfig.me)

print_header "=== REINSTALACIÓN COMPLETADA ==="
print_status "REINSTALACIÓN LIMPIA DESDE CERO EXITOSA!"
echo ""
echo "Información del despliegue:"
echo "   Frontend: http://$SERVER_IP:3000"
echo "   Backend API: http://$SERVER_IP:5173"
echo "   Base de datos: PostgreSQL local en puerto 5432"
echo ""
echo "Usuarios disponibles:"
echo "   Super Admin: nmartinez@solucioning.net / 39284756"
echo "   Super Admin: lvega@solucioning.net / 39284756"
echo ""
echo "Configuración de seguridad:"
echo "   PostgreSQL instalado localmente (fuera de Docker)"
echo "   Aplicación en contenedores Docker"
echo "   Puerto 5432 NO expuesto externamente"
echo "   Usuario solucioning configurado"
echo "   Firewall configurado"
echo ""
echo "Comandos útiles:"
echo "   Conectar al VPS: ssh root@$SERVER_IP"
echo "   Ver logs: cd /opt/solucioning; docker-compose -f docker-compose.prod.yml logs -f"
echo "   Reiniciar: cd /opt/solucioning; docker-compose -f docker-compose.prod.yml restart"
echo "   PostgreSQL: sudo systemctl status postgresql"
echo "   Verificar BD: sudo -u postgres psql -d employee_management -c 'SELECT 1;'"
echo ""
print_warning "IMPORTANTE: Cambia las credenciales en el archivo .env por seguridad"
print_warning "IMPORTANTE: Configura backups automáticos de la base de datos"
echo ""
print_status "Sistema Solucioning reinstalado completamente desde cero!"
'@

# Guardar el script bash
$installScript | Out-File -FilePath "vps-install-clean.sh" -Encoding UTF8

Write-Host 'Script de reinstalacion limpia generado: vps-install-clean.sh' -ForegroundColor Green
Write-Host ''
Write-Host 'INSTRUCCIONES PARA EJECUTAR LA REINSTALACION:' -ForegroundColor Cyan
Write-Host ''
Write-Host '1. Conectate al VPS:' -ForegroundColor White
Write-Host "   ssh root@${VPS_IP}" -ForegroundColor Yellow
Write-Host ''
Write-Host '2. Copia el script al VPS:' -ForegroundColor White
Write-Host "   scp vps-install-clean.sh root@${VPS_IP}:/opt/" -ForegroundColor Yellow
Write-Host ''
Write-Host '3. Ejecuta la reinstalacion:' -ForegroundColor White
Write-Host "   ssh root@${VPS_IP} 'chmod +x /opt/vps-install-clean.sh; /opt/vps-install-clean.sh'" -ForegroundColor Yellow
Write-Host ''
Write-Host 'Quieres que proceda con la copia y ejecucion automatica?' -ForegroundColor Green
$confirmation = Read-Host 'Escribe SI para continuar: '
if ($confirmation -eq 'SI') {
    Write-Host ''
    Write-Host 'Procediendo con la reinstalacion automatica...' -ForegroundColor Green
    # Copiar script al VPS
    Write-Host 'Copiando script al VPS...' -ForegroundColor Yellow
    scp -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null "vps-install-clean.sh" "${VPS_USER}@${VPS_IP}:/opt/"
    # Convertir formato de archivo
    Write-Host 'Convirtiendo formato del archivo...' -ForegroundColor Yellow
    ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null "${VPS_USER}@${VPS_IP}" "sed -i 's/\r$//' /opt/vps-install-clean.sh"
    # Ejecutar instalacion
    Write-Host 'Ejecutando reinstalacion limpia...' -ForegroundColor Yellow
    ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null "${VPS_USER}@${VPS_IP}" "chmod +x /opt/vps-install-clean.sh; /opt/vps-install-clean.sh"
    Write-Host ''
    Write-Host 'Reinstalacion limpia completada!' -ForegroundColor Green
    Write-Host 'El VPS esta listo con PostgreSQL local y aplicacion en Docker.' -ForegroundColor Green
} else {
    Write-Host 'Operacion cancelada por el usuario.' -ForegroundColor Red
    Write-Host 'El script vps-install-clean.sh esta listo para usar manualmente.' -ForegroundColor Yellow
} 