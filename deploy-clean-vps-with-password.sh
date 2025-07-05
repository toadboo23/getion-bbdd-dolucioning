#!/bin/bash

# Script de despliegue limpio para VPS - Solucioning
# Ejecutar desde tu máquina local
# Incluye contraseña para conexión automática

set -e

echo "🚀 Iniciando despliegue limpio de Solucioning en VPS..."
echo "🔐 Usando contraseña proporcionada para conexión automática"

# Configuración del VPS
VPS_IP="69.62.107.86"
VPS_USER="root"
VPS_PASSWORD="Patoloco2323@@"

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

# Función para ejecutar comandos SSH con contraseña
ssh_with_password() {
    sshpass -p "$VPS_PASSWORD" ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null $VPS_USER@$VPS_IP "$1"
}

# Función para copiar archivos con contraseña
scp_with_password() {
    sshpass -p "$VPS_PASSWORD" scp -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null "$1" $VPS_USER@$VPS_IP:"$2"
}

# Verificar que sshpass esté instalado
if ! command -v sshpass &> /dev/null; then
    print_error "sshpass no está instalado. Instalando..."
    if command -v apt &> /dev/null; then
        sudo apt update && sudo apt install -y sshpass
    elif command -v yum &> /dev/null; then
        sudo yum install -y sshpass
    elif command -v brew &> /dev/null; then
        brew install sshpass
    else
        print_error "No se puede instalar sshpass automáticamente. Instálalo manualmente."
        exit 1
    fi
fi

print_header "=== VERIFICANDO CONEXIÓN SSH ==="
print_status "Probando conexión SSH al VPS con contraseña..."

# Probar conexión SSH
if ssh_with_password "echo 'Conexión SSH exitosa'"; then
    print_status "✅ Conexión SSH exitosa"
else
    print_error "No se puede conectar al VPS. Verifica:"
    print_error "1. La IP del VPS es correcta: $VPS_IP"
    print_error "2. La contraseña es correcta"
    print_error "3. El puerto SSH (22) está abierto"
    exit 1
fi

# Crear script de limpieza completa
print_header "=== CREANDO SCRIPT DE LIMPIEZA COMPLETA ==="

cat > vps-clean-install-final.sh << 'EOF'
#!/bin/bash

# Script de limpieza completa y reinstalación para VPS - Solucioning
# ELIMINA TODO Y REINSTALA DESDE CERO
# Ejecutar como root en el VPS

set -e  # Salir si hay algún error

echo "🧹 INICIANDO LIMPIEZA COMPLETA Y REINSTALACIÓN DESDE CERO"
echo "=========================================================="
echo "⚠️  ADVERTENCIA: Esto borrará TODO en el VPS"
echo "⚠️  Se perderán todos los datos existentes"
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

print_header "=== REINSTALACIÓN COMPLETA DESDE CERO ==="

# Actualizar el sistema
print_status "Actualizando sistema..."
apt update && apt upgrade -y

# Instalar dependencias básicas
print_status "Instalando dependencias básicas..."
apt install -y curl wget git ufw software-properties-common apt-transport-https ca-certificates gnupg lsb-release

# INSTALAR POSTGRESQL DESDE CERO
print_header "=== INSTALACIÓN DE POSTGRESQL DESDE CERO ==="
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
print_header "=== INSTALACIÓN DE DOCKER DESDE CERO ==="

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

# EJECUTAR SCRIPT DE INICIALIZACIÓN DE BASE DE DATOS
print_header "=== INICIALIZACIÓN DE BASE DE DATOS ==="
print_status "Ejecutando script de inicialización..."

# Copiar archivos de configuración
cp postgres.conf /etc/postgresql/15/main/postgresql.conf
cp init.sql /tmp/init.sql

# Ejecutar script de inicialización
sudo -u postgres psql -d employee_management -f /tmp/init.sql

print_status "Base de datos inicializada correctamente"

# Configurar archivo .env
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

# Configurar firewall
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

# Construir y levantar contenedores
print_header "=== DESPLIEGUE DE LA APLICACIÓN ==="
print_status "Construyendo contenedores desde cero..."
docker-compose -f docker-compose.prod.yml build --no-cache
print_status "Levantando contenedores..."
docker-compose -f docker-compose.prod.yml up -d

# Esperar a que los servicios estén listos
print_status "Esperando a que los servicios estén listos..."
sleep 60

# Verificar estado de los contenedores
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
    print_status "✅ Frontend respondiendo en puerto 3000"
else
    print_warning "⚠️  Frontend no responde en puerto 3000"
fi

if curl -s http://localhost:5173/api/health > /dev/null; then
    print_status "✅ Backend respondiendo en puerto 5173"
else
    print_warning "⚠️  Backend no responde en puerto 5173"
fi

# Probar conexión a PostgreSQL
print_status "Probando conexión a PostgreSQL..."
if sudo -u postgres psql -d employee_management -c "SELECT 1;" > /dev/null 2>&1; then
    print_status "✅ PostgreSQL funcionando correctamente"
else
    print_warning "⚠️  PostgreSQL no responde correctamente"
fi

# Verificar que el puerto 5432 NO esté expuesto
print_status "Verificando que PostgreSQL no esté expuesto..."
if netstat -tlnp | grep ":5432" > /dev/null; then
    print_warning "⚠️  Puerto 5432 está expuesto (debe estar solo en localhost)"
else
    print_status "✅ Puerto 5432 no está expuesto externamente"
fi

# Obtener IP del servidor
SERVER_IP=$(curl -s ifconfig.me)

print_header "=== REINSTALACIÓN COMPLETADA ==="
print_status "🎉 ¡REINSTALACIÓN COMPLETA DESDE CERO EXITOSA!"
echo ""
echo "📋 Información del despliegue:"
echo "   🌐 Frontend: http://$SERVER_IP:3000"
echo "   🔧 Backend API: http://$SERVER_IP:5173"
echo "   🗄️  Base de datos: PostgreSQL local en puerto 5432"
echo ""
echo "👥 Usuarios disponibles:"
echo "   Super Admin: nmartinez@solucioning.net / 39284756"
echo "   Super Admin: lvega@solucioning.net / 39284756"
echo ""
echo "🔒 Configuración de seguridad:"
echo "   ✅ PostgreSQL instalado localmente (fuera de Docker)"
echo "   ✅ Aplicación en contenedores Docker"
echo "   ✅ Puerto 5432 NO expuesto externamente"
echo "   ✅ Usuario solucioning configurado"
echo "   ✅ Firewall configurado"
echo ""
echo "📝 Comandos útiles:"
echo "   Conectar al VPS: ssh root@$SERVER_IP"
echo "   Ver logs: cd /opt/solucioning && docker-compose -f docker-compose.prod.yml logs -f"
echo "   Reiniciar: cd /opt/solucioning && docker-compose -f docker-compose.prod.yml restart"
echo "   PostgreSQL: sudo systemctl status postgresql"
echo "   Verificar BD: sudo -u postgres psql -d employee_management -c 'SELECT 1;'"
echo ""
print_warning "⚠️  IMPORTANTE: Cambia las credenciales en el archivo .env por seguridad"
print_warning "⚠️  IMPORTANTE: Configura backups automáticos de la base de datos"
echo ""
print_status "✅ Sistema Solucioning reinstalado completamente desde cero!"
EOF

print_status "✅ Script de limpieza completa creado"

# Subir script de limpieza al VPS
print_header "=== SUBIENDO SCRIPT DE LIMPIEZA ==="
print_status "Subiendo script vps-clean-install-final.sh al VPS..."
scp_with_password vps-clean-install-final.sh /opt/
print_status "✅ Script subido correctamente"

# Dar permisos de ejecución
print_status "Dando permisos de ejecución al script..."
ssh_with_password "chmod +x /opt/vps-clean-install-final.sh"
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

print_status "Ejecutando script de limpieza completa en el VPS..."
print_status "Esto puede tomar 25-45 minutos..."

# Ejecutar el script en modo no interactivo
ssh_with_password "cd /opt && ./vps-clean-install-final.sh"

print_header "=== VERIFICACIÓN FINAL ==="
print_status "Verificando que los servicios estén funcionando..."

# Esperar un poco más para que todo esté listo
sleep 30

# Verificar estado de los contenedores
print_status "Estado de los contenedores:"
ssh_with_password "cd /opt/solucioning && docker-compose -f docker-compose.prod.yml ps"

# Verificar logs recientes
print_status "Logs recientes del backend:"
ssh_with_password "cd /opt/solucioning && docker-compose -f docker-compose.prod.yml logs backend --tail=10"

print_status "Logs recientes del frontend:"
ssh_with_password "cd /opt/solucioning && docker-compose -f docker-compose.prod.yml logs frontend --tail=10"

# Verificar PostgreSQL
print_status "Estado de PostgreSQL:"
ssh_with_password "sudo systemctl status postgresql"

# Obtener IP del servidor
SERVER_IP=$(ssh_with_password "curl -s ifconfig.me")

print_header "=== DESPLIEGUE COMPLETADO ==="
print_status "🎉 ¡Despliegue limpio completado exitosamente!"
echo ""
echo "📋 Información del despliegue:"
echo "   🌐 Frontend: http://$SERVER_IP:3000"
echo "   🔧 Backend API: http://$SERVER_IP:5173"
echo "   🗄️  Base de datos: PostgreSQL local en puerto 5432"
echo ""
echo "👥 Usuarios disponibles:"
echo "   Super Admin: nmartinez@solucioning.net / 39284756"
echo "   Super Admin: lvega@solucioning.net / 39284756"
echo ""
echo "🔒 Configuración de seguridad:"
echo "   ✅ PostgreSQL instalado localmente (fuera de Docker)"
echo "   ✅ Aplicación en contenedores Docker"
echo "   ✅ Puerto 5432 NO expuesto externamente"
echo "   ✅ Usuario solucioning configurado"
echo "   ✅ Firewall configurado"
echo ""
echo "📝 Comandos útiles para el VPS:"
echo "   Conectar: ssh root@$VPS_IP"
echo "   Ver logs: cd /opt/solucioning && docker-compose -f docker-compose.prod.yml logs -f"
echo "   Reiniciar: cd /opt/solucioning && docker-compose -f docker-compose.prod.yml restart"
echo "   PostgreSQL: sudo systemctl status postgresql"
echo "   Verificar BD: sudo -u postgres psql -d employee_management -c 'SELECT 1;'"
echo ""
print_warning "⚠️  IMPORTANTE: Cambia las credenciales en /opt/solucioning/.env por seguridad"
print_warning "⚠️  IMPORTANTE: Configura backups automáticos de la base de datos"
echo ""
print_status "✅ Sistema Solucioning reinstalado completamente desde cero!"
EOF 