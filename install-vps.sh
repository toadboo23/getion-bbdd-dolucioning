#!/bin/bash

# Script para instalar y configurar el proyecto en el VPS
# Ejecutar este script en el VPS como root

echo "🚀 Instalando proyecto en el VPS..."

# Verificar que estamos como root
if [ "$EUID" -ne 0 ]; then
    echo "❌ Error: Este script debe ejecutarse como root"
    exit 1
fi

# Actualizar el sistema
echo "📦 Actualizando el sistema..."
apt update && apt upgrade -y

# Instalar Docker si no está instalado
if ! command -v docker &> /dev/null; then
    echo "🐳 Instalando Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    systemctl enable docker
    systemctl start docker
fi

# Instalar Docker Compose si no está instalado
if ! command -v docker-compose &> /dev/null; then
    echo "🐳 Instalando Docker Compose..."
    curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
fi

# Crear directorio del proyecto
echo "📁 Creando directorio del proyecto..."
mkdir -p /root/solucioning-deploy
cd /root/solucioning-deploy

# Clonar el repositorio
echo "📥 Clonando repositorio..."
git clone https://github.com/toadboo23/db_solucioning.git .
git checkout Production

# Crear archivo .env si no existe
if [ ! -f ".env" ]; then
    echo "📝 Creando archivo .env..."
    cat > .env << EOF
# Database
DATABASE_URL=postgresql://postgres:password@postgres:5432/solucioning

# Node environment
NODE_ENV=production

# Ports
FRONTEND_PORT=3000
BACKEND_PORT=5173
POSTGRES_PORT=5432
EOF
fi

# Dar permisos de ejecución a los scripts
chmod +x *.sh

# Construir y levantar los servicios
echo "🔧 Construyendo y levantando servicios..."
docker-compose down
docker-compose up --build -d

# Verificar estado de los servicios
echo "🔍 Verificando estado de los servicios..."
docker-compose ps

echo "✅ Instalación completada!"
echo "🌐 La aplicación está disponible en: http://69.62.107.86:3000"
echo ""
echo "📋 Para verificar logs:"
echo "   cd /root/solucioning-deploy && docker-compose logs -f"
echo ""
echo "📋 Para reiniciar servicios:"
echo "   cd /root/solucioning-deploy && docker-compose restart" 