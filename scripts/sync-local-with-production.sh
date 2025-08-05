#!/bin/bash

# Script para sincronizar la base de datos local con la de producción
# Fecha: 2025-01-15

echo "🔄 Iniciando sincronización de base de datos local con producción..."
echo "=========================================="
echo "  SINCRONIZACIÓN: LOCAL ↔ PRODUCCIÓN"
echo "=========================================="

echo ""
echo "⚠️  ADVERTENCIA: Esta operación modificará la estructura de la base de datos local"
echo "   para que sea idéntica a la de producción"
echo ""

read -p "¿Continuar con la sincronización? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Sincronización cancelada"
    exit 1
fi

echo ""
echo "📦 Creando backup de la base de datos local..."
BACKUP_FILE="backup_local_$(date +%Y%m%d_%H%M%S).sql"
docker exec solucioning_postgres pg_dump -U postgres -d employee_management > "$BACKUP_FILE"
echo "✅ Backup creado: $BACKUP_FILE"

echo ""
echo "🔧 Aplicando migración de sincronización..."

# Aplicar la migración de sincronización
docker exec -i solucioning_postgres psql -U postgres -d employee_management < database/migrations/2025-01-15_sync_local_with_production.sql

if [ $? -eq 0 ]; then
    echo "✅ Migración de sincronización aplicada correctamente"
else
    echo "❌ Error al aplicar la migración de sincronización"
    exit 1
fi

echo ""
echo "🔧 Aplicando migración de pendiente_activacion..."

# Aplicar la migración de pendiente_activacion
docker exec -i solucioning_postgres psql -U postgres -d employee_management < database/migrations/2025-01-15_add_pendiente_activacion_to_production.sql

if [ $? -eq 0 ]; then
    echo "✅ Migración de pendiente_activacion aplicada correctamente"
else
    echo "❌ Error al aplicar la migración de pendiente_activacion"
    exit 1
fi

echo ""
echo "🔍 Verificando estructura final..."

# Verificar la estructura final
docker exec solucioning_postgres psql -U postgres -d employee_management -c "\d employees" | head -20

echo ""
echo "✅ Sincronización completada exitosamente!"
echo "📋 Resumen de cambios:"
echo "   - Estructura de tabla employees sincronizada con producción"
echo "   - Tipos de datos actualizados (complementaries, vacaciones)"
echo "   - Constraints actualizadas"
echo "   - Estado 'pendiente_activacion' agregado"
echo ""
echo "🔄 Reiniciando servicios..."
docker-compose restart backend

echo ""
echo "🎉 ¡Sincronización completada! La base de datos local ahora tiene la misma estructura que producción." 