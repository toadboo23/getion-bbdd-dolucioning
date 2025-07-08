#!/bin/bash

# Script para desplegar cambios desde Develop-Local a Production y actualizar VPS
# Uso: ./deploy-to-production.sh [mensaje_commit]

echo "🚀 Iniciando despliegue completo a Production..."

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

echo "✅ Despliegue local completado!"
echo ""
echo "🌐 Actualizando VPS..."
echo "📋 Conectándose al VPS y ejecutando actualización..."

# Intentar conectar al VPS y ejecutar actualización
ssh root@69.62.107.86 << 'EOF'
    echo "🚀 Conectado al VPS, iniciando actualización..."
    cd /root/solucioning-deploy
    git fetch origin
    git reset --hard origin/Production
    docker-compose down
    docker-compose up --build -d
    echo "✅ Actualización del VPS completada!"
    echo "🌐 La aplicación está disponible en: http://69.62.107.86:3000"
EOF

echo "✅ Despliegue completo finalizado!"
echo "🌐 La aplicación debería estar disponible en: http://69.62.107.86:3000"
echo ""
echo "📋 Para verificar el estado:"
echo "   ssh root@69.62.107.86 'cd /root/solucioning-deploy && docker-compose ps'"
echo ""
echo "📋 Para ver logs:"
echo "   ssh root@69.62.107.86 'cd /root/solucioning-deploy && docker-compose logs -f'"

echo "🔗 Para crear un Pull Request:"
echo "   https://github.com/toadboo23/db_solucioning/pull/new/Develop-Local" 