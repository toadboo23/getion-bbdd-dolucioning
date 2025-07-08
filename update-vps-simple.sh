#!/bin/bash

# Script simple para actualizar el proyecto en el VPS
# Ejecutar este script en el VPS: ./update-vps-simple.sh

echo "🚀 Actualizando proyecto en el VPS..."

# Verificar que estamos en el directorio correcto
if [ ! -f "docker-compose.yml" ]; then
    echo "❌ Error: No se encontró docker-compose.yml"
    echo "Asegúrate de estar en el directorio correcto: /root/db_local"
    exit 1
fi

echo "📥 Actualizando desde rama Production..."
git fetch origin
git reset --hard origin/Production

echo "🔧 Reconstruyendo y reiniciando servicios..."
docker-compose down
docker-compose up --build -d

echo "🔍 Verificando estado de los servicios..."
docker-compose ps

echo "✅ Actualización completada!"
echo "🌐 La aplicación está disponible en: http://69.62.107.86:3000" 