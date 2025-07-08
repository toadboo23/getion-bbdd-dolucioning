#!/bin/bash

# Script para actualizar manualmente el VPS
# Ejecutar este script en el VPS: ./update-vps-manual.sh

echo "🚀 Actualizando VPS manualmente..."

# Verificar que estamos en el directorio correcto
if [ ! -f "docker-compose.yml" ]; then
    echo "❌ Error: No se encontró docker-compose.yml"
    echo "Asegúrate de estar en el directorio correcto: /root/solucioning-deploy"
    exit 1
fi

echo "📦 Haciendo backup de la configuración actual..."
cp .env .env.backup.$(date +%Y%m%d_%H%M%S) 2>/dev/null || echo "⚠️  No se encontró archivo .env"

echo "📥 Actualizando desde rama Production..."
git fetch origin
git reset --hard origin/Production

echo "🔧 Reconstruyendo y reiniciando servicios..."
docker-compose down
docker-compose up --build -d

echo "🔍 Verificando estado de los servicios..."
docker-compose ps

echo "✅ Actualización completada!"
echo "🌐 La aplicación debería estar disponible en: http://69.62.107.86:3000"
echo ""
echo "📋 Para verificar logs:"
echo "   docker-compose logs -f [servicio]"
echo ""
echo "📋 Para reiniciar un servicio específico:"
echo "   docker-compose restart [servicio]" 