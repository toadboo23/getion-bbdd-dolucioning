#!/bin/bash

# Script para sincronizar credenciales del VPS con el entorno local
# Soluciona el problema recurrente de contraseñas incompatibles

set -e

VPS_HOST="69.62.107.86"
VPS_USER="root"
VPS_PROJECT_PATH="/root/solucioning-deploy"

echo "🔄 Sincronizando credenciales del VPS..."
echo "=================================================="

# 1. Obtener el hash real de la contraseña del VPS
echo "📡 [1/5] Obteniendo hash de contraseña del VPS..."

VPS_HASH=$(ssh ${VPS_USER}@${VPS_HOST} "cd ${VPS_PROJECT_PATH} && docker exec solucioning_postgres psql -U postgres -d employee_management -t -c \"SELECT password FROM system_users WHERE email = 'nmartinez@solucioning.net';\" | xargs" 2>/dev/null || echo "")

if [ -z "$VPS_HASH" ]; then
    echo "❌ Error: No se pudo obtener el hash del VPS"
    echo "💡 Asegúrate de que:"
    echo "   - Puedes conectarte al VPS: ssh ${VPS_USER}@${VPS_HOST}"
    echo "   - Los contenedores están ejecutándose en el VPS"
    echo "   - La base de datos tiene el usuario nmartinez@solucioning.net"
    exit 1
fi

echo "✅ Hash obtenido del VPS: ${VPS_HASH:0:20}..."

# 2. Actualizar init.sql en la raíz
echo "📝 [2/5] Actualizando init.sql en la raíz..."

# Crear backup del init.sql actual
cp init.sql init.sql.backup.$(date +%Y%m%d_%H%M%S)

# Actualizar el hash en init.sql
sed -i.tmp "s|'nmartinez@solucioning.net', 'Nicolas', 'Martinez', '[^']*'|'nmartinez@solucioning.net', 'Nicolas', 'Martinez', '$VPS_HASH'|g" init.sql

echo "✅ init.sql actualizado con el hash del VPS"

# 3. Actualizar init.sql en database/schemas/ si existe
if [ -f "database/schemas/init.sql" ]; then
    echo "📝 [3/5] Actualizando database/schemas/init.sql..."
    cp database/schemas/init.sql database/schemas/init.sql.backup.$(date +%Y%m%d_%H%M%S)
    sed -i.tmp "s|'nmartinez@solucioning.net', 'Nicolas', 'Martinez', '[^']*'|'nmartinez@solucioning.net', 'Nicolas', 'Martinez', '$VPS_HASH'|g" database/schemas/init.sql
    echo "✅ database/schemas/init.sql actualizado"
else
    echo "⏭️  [3/5] database/schemas/init.sql no existe, omitiendo..."
fi

# 4. Actualizar la base de datos local si está ejecutándose
echo "🔄 [4/5] Actualizando base de datos local..."

if docker ps | grep -q solucioning_postgres; then
    echo "   📊 Contenedor PostgreSQL encontrado, actualizando..."
    
    # Crear script SQL temporal
    cat > /tmp/update_local_password.sql << EOF
UPDATE system_users 
SET password = '$VPS_HASH' 
WHERE email = 'nmartinez@solucioning.net';

SELECT 
    email, 
    substring(password, 1, 20) as password_start,
    CASE 
        WHEN password = '$VPS_HASH' THEN '✅ SINCRONIZADO'
        ELSE '❌ DIFERENTE'
    END as status
FROM system_users 
WHERE email = 'nmartinez@solucioning.net';
EOF

    # Copiar y ejecutar el script
    docker cp /tmp/update_local_password.sql solucioning_postgres:/tmp/update_local_password.sql
    docker exec solucioning_postgres psql -U postgres -d employee_management -f /tmp/update_local_password.sql
    
    # Limpiar archivo temporal
    rm /tmp/update_local_password.sql
    
    echo "✅ Base de datos local actualizada"
else
    echo "⚠️  Contenedor PostgreSQL no está ejecutándose"
    echo "   💡 Ejecuta 'docker-compose up -d' para iniciar los contenedores"
fi

# 5. Crear/actualizar script de verificación
echo "📋 [5/5] Creando script de verificación..."

cat > verify-credentials.sh << 'EOF'
#!/bin/bash
# Script de verificación de credenciales

echo "🔍 Verificando credenciales..."

if docker ps | grep -q solucioning_postgres; then
    echo "📊 Estado de la base de datos local:"
    docker exec solucioning_postgres psql -U postgres -d employee_management -c "
        SELECT 
            email, 
            first_name,
            last_name,
            role,
            is_active,
            substring(password, 1, 20) as password_start
        FROM system_users 
        WHERE email = 'nmartinez@solucioning.net';
    "
    
    echo ""
    echo "🧪 Probando login con credenciales:"
    echo "   Email: nmartinez@solucioning.net"
    echo "   Password: 39284756"
    
    RESPONSE=$(curl -s -X POST http://localhost:5173/api/auth/login \
        -H "Content-Type: application/json" \
        -d '{"email":"nmartinez@solucioning.net","password":"39284756"}' || echo '{"error":"No se pudo conectar al backend"}')
    
    if echo "$RESPONSE" | grep -q '"success":true'; then
        echo "✅ LOGIN EXITOSO"
    else
        echo "❌ LOGIN FALLÓ"
        echo "   Respuesta: $RESPONSE"
    fi
else
    echo "❌ Contenedor PostgreSQL no está ejecutándose"
fi
EOF

chmod +x verify-credentials.sh

echo ""
echo "🎉 ¡Sincronización completada!"
echo "=================================================="
echo "✅ Hash del VPS sincronizado con el entorno local"
echo "✅ Archivos init.sql actualizados"
echo "✅ Base de datos local actualizada (si estaba ejecutándose)"
echo ""
echo "🧪 Para verificar que todo funciona:"
echo "   ./verify-credentials.sh"
echo ""
echo "💡 Para futuros clones del VPS, simplemente ejecuta:"
echo "   ./sync-vps-credentials.sh"
echo ""
echo "📝 Backups creados:"
echo "   - init.sql.backup.*"
if [ -f "database/schemas/init.sql.backup.$(date +%Y%m%d_%H%M%S)" ]; then
    echo "   - database/schemas/init.sql.backup.*"
fi 