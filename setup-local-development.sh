#!/bin/bash

# Script de configuración completa para desarrollo local
# Incluye sincronización automática de credenciales del VPS

set -e

echo "🚀 Configurando entorno de desarrollo local..."
echo "=============================================="

# 1. Verificar dependencias
echo "🔍 [1/6] Verificando dependencias..."

# Verificar Docker
if ! command -v docker &> /dev/null; then
    echo "❌ Docker no está instalado. Por favor instala Docker primero."
    exit 1
fi

# Verificar Docker Compose
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose no está instalado. Por favor instala Docker Compose primero."
    exit 1
fi

# Verificar SSH para conectar al VPS
if ! command -v ssh &> /dev/null; then
    echo "❌ SSH no está disponible. Necesario para sincronizar credenciales del VPS."
    exit 1
fi

echo "✅ Todas las dependencias están disponibles"

# 2. Limpiar contenedores anteriores si existen
echo "🧹 [2/6] Limpiando contenedores anteriores..."

if docker ps -a | grep -q solucioning; then
    echo "   🗑️  Deteniendo contenedores existentes..."
    docker-compose down 2>/dev/null || true
    
    echo "   🗑️  Eliminando contenedores antiguos..."
    docker container prune -f
    
    echo "   🗑️  Eliminando imágenes sin usar..."
    docker image prune -f
fi

echo "✅ Limpieza completada"

# 3. Sincronizar credenciales del VPS
echo "🔄 [3/6] Sincronizando credenciales del VPS..."

# Hacer el script ejecutable si no lo es
chmod +x sync-vps-credentials.sh

# Ejecutar sincronización
if ./sync-vps-credentials.sh; then
    echo "✅ Credenciales sincronizadas exitosamente"
else
    echo "⚠️  No se pudieron sincronizar las credenciales del VPS"
    echo "   💡 Puedes continuar, pero es posible que necesites actualizar las credenciales manualmente"
    echo "   💡 Presiona Enter para continuar o Ctrl+C para cancelar..."
    read -r
fi

# 4. Construir y levantar contenedores
echo "🏗️  [4/6] Construyendo y levantando contenedores..."

echo "   📦 Construyendo imágenes (esto puede tardar varios minutos)..."
docker-compose build --no-cache

echo "   🚀 Levantando servicios..."
docker-compose up -d

# 5. Esperar a que los servicios estén listos
echo "⏳ [5/6] Esperando a que los servicios estén listos..."

echo "   📊 Esperando PostgreSQL..."
timeout 60 bash -c 'while ! docker exec solucioning_postgres pg_isready -U postgres; do sleep 2; done' || {
    echo "❌ PostgreSQL no se inició en 60 segundos"
    exit 1
}

echo "   🔧 Esperando Backend..."
timeout 60 bash -c 'while ! curl -s http://localhost:5173/api/health > /dev/null; do sleep 2; done' || {
    echo "❌ Backend no se inició en 60 segundos"
    echo "   📋 Logs del backend:"
    docker logs solucioning_backend --tail 20
    exit 1
}

echo "   🎨 Esperando Frontend..."
timeout 30 bash -c 'while ! curl -s http://localhost:3000 > /dev/null; do sleep 2; done' || {
    echo "⚠️  Frontend tardó más de 30 segundos en iniciar, pero continuando..."
}

echo "✅ Todos los servicios están listos"

# 6. Verificar credenciales y realizar pruebas
echo "🧪 [6/6] Verificando funcionamiento..."

# Hacer el script de verificación ejecutable
chmod +x verify-credentials.sh

# Ejecutar verificación
./verify-credentials.sh

echo ""
echo "🎉 ¡CONFIGURACIÓN COMPLETADA!"
echo "=============================================="
echo ""
echo "📊 Estado de los servicios:"
docker-compose ps

echo ""
echo "🌐 URLs disponibles:"
echo "   Frontend: http://localhost:3000"
echo "   Backend:  http://localhost:5173"
echo "   API Health: http://localhost:5173/api/health"

echo ""
echo "🔑 Credenciales de login:"
echo "   Email:    nmartinez@solucioning.net"
echo "   Password: 39284756"

echo ""
echo "🛠️  Comandos útiles:"
echo "   Ver logs:           docker-compose logs -f"
echo "   Reiniciar:          docker-compose restart"
echo "   Parar servicios:    docker-compose down"
echo "   Verificar login:    ./verify-credentials.sh"
echo "   Sync credenciales:  ./sync-vps-credentials.sh"

echo ""
echo "✨ ¡Todo listo para desarrollar!" 