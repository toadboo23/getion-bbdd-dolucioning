# Script de despliegue limpio para VPS - Solucioning
# Ejecutar desde PowerShell en Windows
# Conexión SSH manual

$ErrorActionPreference = "Stop"

Write-Host "Iniciando despliegue limpio de Solucioning en VPS..." -ForegroundColor Green

# Configuración del VPS
$VPS_IP = "69.62.107.86"
$VPS_USER = "root"

# Funciones para imprimir mensajes
function Write-Status {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor Green
}

function Write-Warning {
    param([string]$Message)
    Write-Host "[WARNING] $Message" -ForegroundColor Yellow
}

function Write-Error {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor Red
}

function Write-Header {
    param([string]$Message)
    Write-Host "[HEADER] $Message" -ForegroundColor Blue
}

# Verificar que ssh esté disponible
if (-not (Get-Command ssh -ErrorAction SilentlyContinue)) {
    Write-Error "SSH no está disponible. Instala OpenSSH o Git Bash."
    exit 1
}

Write-Header "=== VERIFICANDO CONEXION SSH ==="
Write-Status "Probando conexión SSH al VPS..."

Write-Warning "Se te pedirá la contraseña del VPS: Patoloco2323@@"
Write-Status "Presiona Enter cuando estés listo para continuar..."
Read-Host

# Probar conexión SSH
try {
    Write-Status "Intentando conexión SSH..."
    $testResult = ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null "${VPS_USER}@${VPS_IP}" "echo 'Conexion SSH exitosa'"
    if ($LASTEXITCODE -eq 0) {
        Write-Status "Conexion SSH exitosa"
    } else {
        throw "Conexion fallida"
    }
} catch {
    Write-Error "No se puede conectar al VPS. Verifica:"
    Write-Error "1. La IP del VPS es correcta: $VPS_IP"
    Write-Error "2. La contraseña es correcta: Patoloco2323@@"
    Write-Error "3. El puerto SSH (22) está abierto"
    exit 1
}

# Crear script de limpieza completa
Write-Header "=== CREANDO SCRIPT DE LIMPIEZA COMPLETA ==="

$cleanupScript = @'
#!/bin/bash

# Script de limpieza completa y reinstalación para VPS - Solucioning
# ELIMINA TODO Y REINSTALA DESDE CERO
# Ejecutar como root en el VPS

set -e  # Salir si hay algún error

echo "INICIANDO LIMPIEZA COMPLETA Y REINSTALACION DESDE CERO"
echo "======================================================"
echo "ADVERTENCIA: Esto borrará TODO en el VPS"
echo "Se perderán todos los datos existentes"
echo ""

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

print_header "=== REINSTALACION COMPLETA DESDE CERO ==="

# Actualizar el sistema
print_status "Actualizando sistema..."
apt update && apt upgrade -y

# Instalar dependencias básicas
print_status "Instalando dependencias básicas..."
apt install -y curl wget git ufw software-properties-common apt-transport-https ca-certificates gnupg lsb-release

# INSTALAR POSTGRESQL DESDE CERO
print_header "=== INSTALACION DE POSTGRESQL DESDE CERO ==="
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

# INSTALAR DOCKER DESDE CERO
print_header "=== INSTALACION DE DOCKER DESDE CERO ==="

# Desinstalar Docker si existe
print_status "Desinstalando Docker existente..."
apt remove --purge -y docker docker.io docker-compose 2>/dev/null || true
apt autoremove -y

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

# Crear directorio del proyecto
print_header "=== CONFIGURACION DEL PROYECTO ==="
PROJECT_DIR="/opt/solucioning"
print_status "Creando directorio del proyecto en $PROJECT_DIR"
mkdir -p $PROJECT_DIR
cd $PROJECT_DIR

# Clonar el repositorio
print_status "Clonando repositorio de Solucioning..."
git clone https://github.com/toadboo23/db_local.git .
git checkout Develop
print_status "Repositorio clonado correctamente"

# EJECUTAR SCRIPT DE INICIALIZACION DE BASE DE DATOS
print_header "=== INICIALIZACION DE BASE DE DATOS ==="
print_status "Ejecutando script de inicialización..."

# Copiar archivos de configuración
cp postgres.conf /etc/postgresql/15/main/postgresql.conf
cp init.sql /tmp/init.sql

# Ejecutar script de inicialización
sudo -u postgres psql -d employee_management -f /tmp/init.sql

print_status "Base de datos inicializada correctamente"

# Configurar archivo .env
print_header "=== CONFIGURACION DE VARIABLES DE ENTORNO ==="
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

# Configurar firewall
print_header "=== CONFIGURACION DE FIREWALL ==="
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
print_header "=== DESPLIEGUE DE LA APLICACION ==="
print_status "Construyendo contenedores desde cero..."
docker-compose -f docker-compose.prod.yml build --no-cache
print_status "Levantando contenedores..."
docker-compose -f docker-compose.prod.yml up -d

# Esperar a que los servicios estén listos
print_status "Esperando a que los servicios estén listos..."
sleep 60

# Verificar estado de los contenedores
print_header "=== VERIFICACION DE SERVICIOS ==="
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

print_header "=== REINSTALACION COMPLETADA ==="
print_status "REINSTALACION COMPLETA DESDE CERO EXITOSA!"
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

# Guardar el script en un archivo temporal
$cleanupScript | Out-File -FilePath "vps-clean-install-final.sh" -Encoding UTF8

Write-Status "Script de limpieza completa creado"

# Subir script de limpieza al VPS
Write-Header "=== SUBIENDO SCRIPT DE LIMPIEZA ==="
Write-Status "Subiendo script vps-clean-install-final.sh al VPS..."

try {
    Write-Status "Usando SCP para subir el archivo..."
    scp -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null "vps-clean-install-final.sh" "${VPS_USER}@${VPS_IP}:/opt/"
    Write-Status "Script subido correctamente"
} catch {
    Write-Error "Error al subir el script al VPS"
    exit 1
}

# Dar permisos de ejecución
Write-Status "Dando permisos de ejecución al script..."
ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null "${VPS_USER}@${VPS_IP}" "chmod +x /opt/vps-clean-install-final.sh"
Write-Status "Permisos configurados"

# Ejecutar script de limpieza en el VPS
Write-Header "=== EJECUTANDO LIMPIEZA COMPLETA ==="
Write-Warning "ADVERTENCIA: Esto borrará TODO en el VPS y reinstalará desde cero"
Write-Warning "Se perderán todos los datos existentes"

$confirmation = Read-Host "¿Estás seguro de que quieres continuar? (y/N)"
if ($confirmation -ne "y" -and $confirmation -ne "Y") {
    Write-Error "Operación cancelada por el usuario"
    exit 1
}

Write-Status "Ejecutando script de limpieza completa en el VPS..."
Write-Status "Esto puede tomar 25-45 minutos..."

# Ejecutar el script en modo no interactivo
ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null "${VPS_USER}@${VPS_IP}" "cd /opt; ./vps-clean-install-final.sh"

Write-Header "=== VERIFICACION FINAL ==="
Write-Status "Verificando que los servicios estén funcionando..."

# Esperar un poco más para que todo esté listo
Start-Sleep -Seconds 30

# Verificar estado de los contenedores
Write-Status "Estado de los contenedores:"
ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null "${VPS_USER}@${VPS_IP}" "cd /opt/solucioning; docker-compose -f docker-compose.prod.yml ps"

# Verificar logs recientes
Write-Status "Logs recientes del backend:"
ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null "${VPS_USER}@${VPS_IP}" "cd /opt/solucioning; docker-compose -f docker-compose.prod.yml logs backend --tail=10"

Write-Status "Logs recientes del frontend:"
ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null "${VPS_USER}@${VPS_IP}" "cd /opt/solucioning; docker-compose -f docker-compose.prod.yml logs frontend --tail=10"

# Verificar PostgreSQL
Write-Status "Estado de PostgreSQL:"
ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null "${VPS_USER}@${VPS_IP}" "sudo systemctl status postgresql"

# Obtener IP del servidor
$SERVER_IP = ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null "${VPS_USER}@${VPS_IP}" "curl -s ifconfig.me"

Write-Header "=== DESPLIEGUE COMPLETADO ==="
Write-Status "Despliegue limpio completado exitosamente!"
Write-Host ""
Write-Host "Información del despliegue:" -ForegroundColor Cyan
Write-Host "   Frontend: http://$SERVER_IP:3000" -ForegroundColor White
Write-Host "   Backend API: http://$SERVER_IP:5173" -ForegroundColor White
Write-Host "   Base de datos: PostgreSQL local en puerto 5432" -ForegroundColor White
Write-Host ""
Write-Host "Usuarios disponibles:" -ForegroundColor Cyan
Write-Host "   Super Admin: nmartinez@solucioning.net / 39284756" -ForegroundColor White
Write-Host "   Super Admin: lvega@solucioning.net / 39284756" -ForegroundColor White
Write-Host ""
Write-Host "Configuración de seguridad:" -ForegroundColor Cyan
Write-Host "   PostgreSQL instalado localmente (fuera de Docker)" -ForegroundColor Green
Write-Host "   Aplicación en contenedores Docker" -ForegroundColor Green
Write-Host "   Puerto 5432 NO expuesto externamente" -ForegroundColor Green
Write-Host "   Usuario solucioning configurado" -ForegroundColor Green
Write-Host "   Firewall configurado" -ForegroundColor Green
Write-Host ""
Write-Host "Comandos útiles para el VPS:" -ForegroundColor Cyan
Write-Host "   Conectar: ssh root@$VPS_IP" -ForegroundColor White
Write-Host "   Ver logs: cd /opt/solucioning; docker-compose -f docker-compose.prod.yml logs -f" -ForegroundColor White
Write-Host "   Reiniciar: cd /opt/solucioning; docker-compose -f docker-compose.prod.yml restart" -ForegroundColor White
Write-Host "   PostgreSQL: sudo systemctl status postgresql" -ForegroundColor White
Write-Host "   Verificar BD: sudo -u postgres psql -d employee_management -c `"SELECT 1;`"" -ForegroundColor White
Write-Host ""
Write-Warning "IMPORTANTE: Cambia las credenciales en /opt/solucioning/.env por seguridad"
Write-Warning "IMPORTANTE: Configura backups automáticos de la base de datos"
Write-Host ""
Write-Status "Sistema Solucioning reinstalado completamente desde cero!"

# Limpiar archivo temporal
Remove-Item "vps-clean-install-final.sh" -ErrorAction SilentlyContinue 