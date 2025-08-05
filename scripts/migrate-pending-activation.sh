#!/bin/bash

# Script de migración para permitir empleados sin ID Glovo
# Fecha: 2025-01-15
# Descripción: Agrega el estado "pendiente_activacion" y permite empleados sin ID Glovo

set -e  # Salir si hay algún error

echo "🚀 Iniciando migración para empleados pendientes de activación..."

# Variables
DB_NAME="employee_management"
BACKUP_FILE="backup_before_pending_activation_$(date +%Y%m%d_%H%M%S).sql"

# Función para hacer backup
make_backup() {
    echo "📦 Creando backup de la base de datos..."
    pg_dump -d $DB_NAME > $BACKUP_FILE
    echo "✅ Backup creado: $BACKUP_FILE"
}

# Función para verificar que el backup se creó correctamente
verify_backup() {
    if [ ! -f "$BACKUP_FILE" ]; then
        echo "❌ Error: No se pudo crear el backup"
        exit 1
    fi
    
    # Verificar que el backup no esté vacío
    if [ ! -s "$BACKUP_FILE" ]; then
        echo "❌ Error: El backup está vacío"
        exit 1
    fi
    
    echo "✅ Backup verificado correctamente"
}

# Función para ejecutar la migración
run_migration() {
    echo "🔧 Ejecutando migración..."
    
    # Ejecutar la migración SQL
    psql -d $DB_NAME -f database/migrations/2025-01-15_allow_employees_without_id_glovo.sql
    
    echo "✅ Migración ejecutada correctamente"
}

# Función para verificar la migración
verify_migration() {
    echo "🔍 Verificando migración..."
    
    # Verificar que el nuevo estado existe
    result=$(psql -d $DB_NAME -t -c "SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'employees' AND column_name = 'status';")
    
    if [ "$result" -eq 1 ]; then
        echo "✅ Campo status existe en la tabla employees"
    else
        echo "❌ Error: Campo status no encontrado"
        exit 1
    fi
    
    # Verificar que se puede insertar el nuevo estado
    psql -d $DB_NAME -c "INSERT INTO employees (id_glovo, nombre, status) VALUES ('TEST_MIGRATION', 'Test Migration', 'pendiente_activacion') ON CONFLICT (id_glovo) DO NOTHING;"
    
    # Verificar que se insertó correctamente
    result=$(psql -d $DB_NAME -t -c "SELECT COUNT(*) FROM employees WHERE id_glovo = 'TEST_MIGRATION' AND status = 'pendiente_activacion';")
    
    if [ "$result" -eq 1 ]; then
        echo "✅ Nuevo estado 'pendiente_activacion' funciona correctamente"
        
        # Limpiar el registro de prueba
        psql -d $DB_NAME -c "DELETE FROM employees WHERE id_glovo = 'TEST_MIGRATION';"
        echo "🧹 Registro de prueba eliminado"
    else
        echo "❌ Error: No se pudo insertar con el nuevo estado"
        exit 1
    fi
}

# Función para mostrar resumen
show_summary() {
    echo ""
    echo "🎉 Migración completada exitosamente!"
    echo ""
    echo "📋 Resumen:"
    echo "  ✅ Backup creado: $BACKUP_FILE"
    echo "  ✅ Nuevo estado 'pendiente_activacion' agregado"
    echo "  ✅ Empleados pueden crearse sin ID Glovo (solo Super Admin)"
    echo "  ✅ Funcionalidad de activación implementada"
    echo ""
    echo "🔧 Próximos pasos:"
    echo "  1. Reiniciar el servidor backend"
    echo "  2. Reiniciar el servidor frontend"
    echo "  3. Probar la funcionalidad en el entorno de desarrollo"
    echo "  4. Desplegar a producción"
    echo ""
    echo "⚠️  Nota: El backup está guardado en $BACKUP_FILE"
    echo "   En caso de problemas, puede restaurarse con:"
    echo "   psql -d $DB_NAME < $BACKUP_FILE"
}

# Función principal
main() {
    echo "=========================================="
    echo "  MIGRACIÓN: EMPLEADOS PENDIENTES DE ACTIVACIÓN"
    echo "=========================================="
    echo ""
    
    # Verificar que estamos en el directorio correcto
    if [ ! -f "database/migrations/2025-01-15_allow_employees_without_id_glovo.sql" ]; then
        echo "❌ Error: No se encontró el archivo de migración"
        echo "   Asegúrate de ejecutar este script desde el directorio raíz del proyecto"
        exit 1
    fi
    
    # Confirmar antes de proceder
    echo "⚠️  ADVERTENCIA: Esta migración modificará la estructura de la base de datos"
    echo "   Se creará un backup automáticamente"
    echo ""
    read -p "¿Continuar con la migración? (y/N): " -n 1 -r
    echo ""
    
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "❌ Migración cancelada"
        exit 0
    fi
    
    # Ejecutar pasos de migración
    make_backup
    verify_backup
    run_migration
    verify_migration
    show_summary
}

# Ejecutar función principal
main "$@" 