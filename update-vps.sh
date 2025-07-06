#!/bin/bash

# Script para actualizar el VPS desde la rama Production
# Uso: ./update-vps.sh

echo "🚀 Actualizando VPS desde rama Production..."

# Verificar que estamos en el directorio correcto
if [ ! -f "docker-compose.yml" ]; then
    echo "❌ Error: No se encontró docker-compose.yml"
    echo "Asegúrate de estar en el directorio correcto"
    exit 1
fi

# Hacer backup de la configuración actual
echo "📦 Haciendo backup de la configuración actual..."
cp .env .env.backup.$(date +%Y%m%d_%H%M%S)

# Actualizar desde la rama Production
echo "📥 Actualizando desde rama Production..."
git fetch origin
git reset --hard origin/Production

# Verificar si hay cambios en .env
if [ -f ".env.backup.$(date +%Y%m%d_%H%M%S)" ]; then
    echo "⚠️  Se detectó un archivo .env de backup"
    echo "Revisa si necesitas restaurar alguna configuración específica"
fi

# Reconstruir y reiniciar servicios
echo "🔧 Reconstruyendo y reiniciando servicios..."
docker-compose down
docker-compose up --build -d

# Verificar estado de los servicios
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