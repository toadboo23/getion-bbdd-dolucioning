#!/bin/bash

# Script para desplegar cambios desde Develop-Local a Production
# Uso: ./deploy-to-production.sh [mensaje_commit]

echo "🚀 Iniciando despliegue a Production..."

# Verificar que estamos en Develop-Local
current_branch=$(git branch --show-current)
if [ "$current_branch" != "Develop-Local" ]; then
    echo "❌ Error: Debes estar en la rama Develop-Local"
    echo "Ejecuta: git checkout Develop-Local"
    exit 1
fi

# Hacer commit de cambios pendientes si los hay
if [ -n "$(git status --porcelain)" ]; then
    echo "📝 Haciendo commit de cambios pendientes..."
    git add .
    commit_message=${1:-"Actualización desde Develop-Local"}
    git commit -m "$commit_message"
fi

# Subir cambios a Develop-Local
echo "📤 Subiendo cambios a Develop-Local..."
git push origin Develop-Local

# Cambiar a Production
echo "🔄 Cambiando a rama Production..."
git checkout Production

# Hacer merge de Develop-Local a Production
echo "🔀 Haciendo merge de Develop-Local a Production..."
git merge Develop-Local

# Subir cambios a Production
echo "📤 Subiendo cambios a Production..."
git push origin Production

# Volver a Develop-Local
echo "🔄 Volviendo a Develop-Local..."
git checkout Develop-Local

echo "✅ Despliegue completado!"
echo "📋 Próximos pasos:"
echo "   1. Conectarse al VPS"
echo "   2. Ejecutar: git pull origin Production"
echo "   3. Ejecutar: docker-compose down && docker-compose up --build -d"
echo ""
echo "🔗 Para crear un Pull Request:"
echo "   https://github.com/toadboo23/db_solucioning/pull/new/Develop-Local" 