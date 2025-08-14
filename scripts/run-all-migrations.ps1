# Script para ejecutar todas las migraciones pendientes en Docker
# Fecha: 2025-08-13
# Descripción: Ejecuta todas las migraciones SQL en orden cronológico

Write-Host "🚀 Iniciando ejecución de todas las migraciones pendientes..." -ForegroundColor Green

# Variables
$DB_NAME = "employee_management"
$DB_USER = "postgres"
$DB_PASSWORD = "dev_password_2024"
$CONTAINER_NAME = "solucioning_postgres"
$MIGRATIONS_DIR = "database/migrations"

# Función para ejecutar una migración
function Execute-Migration {
    param(
        [string]$MigrationFile
    )
    
    Write-Host "📄 Ejecutando migración: $MigrationFile" -ForegroundColor Yellow
    
    try {
        # Copiar el archivo de migración al contenedor
        docker cp "$MIGRATIONS_DIR/$MigrationFile" "${CONTAINER_NAME}:/tmp/$MigrationFile"
        
        # Ejecutar la migración
        docker exec -i $CONTAINER_NAME psql -U $DB_USER -d $DB_NAME -f "/tmp/$MigrationFile"
        
        # Limpiar archivo temporal
        docker exec $CONTAINER_NAME rm "/tmp/$MigrationFile"
        
        Write-Host "✅ Migración $MigrationFile ejecutada correctamente" -ForegroundColor Green
    }
    catch {
        Write-Host "❌ Error ejecutando migración $MigrationFile : $_" -ForegroundColor Red
        throw
    }
}

# Lista de migraciones en orden cronológico
$migrations = @(
    "001_create_candidates_tables.sql",
    "002_fix_candidates_constraints.sql", 
    "003_drop_unique_telefono.sql",
    "2024-07-12_add_employee_leave_history.sql",
    "2024-07-20_add_cdp_trigger.sql",
    "2024-07-20_add_hours_limit_trigger.sql",
    "2024-07-21_add_vacaciones_fields.sql",
    "2024-07-21_expand_employees_fields.sql",
    "add-flota-field.sql",
    "add-new-company-leave-reasons.sql",
    "change_password.sql",
    "create-flota-function.sql",
    "create-flota-trigger.sql",
    "fix-company-leave-hours.sql",
    "make_telefono_optional.sql",
    "normalize-cities.sql",
    "update-flota-default.sql",
    "update-password-fixed.sql",
    "update-users-add-ciudad.sql",
    "2025-01-08_sync_employees_structure_with_production.sql",
    "2025-01-15_add_pendiente_activacion_to_production.sql",
    "2025-01-15_allow_employees_without_id_glovo.sql",
    "2025-01-15_create_captation_tables.sql",
    "2025-01-15_fix_captation_function_types.sql",
    "2025-01-15_fix_local_sync.sql",
    "2025-01-15_sync_local_with_production.sql",
    "2025-01-15_update_columns_to_use_underscores.sql",
    "2025-01-20_add_pending_hours_to_captation.sql",
    "2025-01-20_fix_captation_dashboard_types.sql",
    "fix-cdp-trigger-penalized.sql",
    "normalize-cities-production.sql",
    "normalize-cities-production-fixed.sql",
    "test-penalization-restore.sql",
    "verify-all-employee-hours.sql"
)

# Verificar que el contenedor esté ejecutándose
Write-Host "🔍 Verificando que el contenedor PostgreSQL esté ejecutándose..." -ForegroundColor Blue
$containerStatus = docker ps --filter "name=$CONTAINER_NAME" --format "table {{.Names}}\t{{.Status}}"
if ($containerStatus -notlike "*$CONTAINER_NAME*") {
    Write-Host "❌ Error: El contenedor $CONTAINER_NAME no está ejecutándose" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Contenedor PostgreSQL está ejecutándose" -ForegroundColor Green

# Verificar que la base de datos existe
Write-Host "🔍 Verificando conexión a la base de datos..." -ForegroundColor Blue
try {
    docker exec $CONTAINER_NAME psql -U $DB_USER -d $DB_NAME -c "SELECT 1;" | Out-Null
    Write-Host "✅ Conexión a la base de datos exitosa" -ForegroundColor Green
}
catch {
    Write-Host "❌ Error: No se puede conectar a la base de datos $DB_NAME" -ForegroundColor Red
    exit 1
}

# Crear backup antes de ejecutar migraciones
$backupFile = "backup_before_migrations_$(Get-Date -Format 'yyyyMMdd_HHmmss').sql"
Write-Host "📦 Creando backup de la base de datos..." -ForegroundColor Blue
docker exec $CONTAINER_NAME pg_dump -U $DB_USER -d $DB_NAME > $backupFile
Write-Host "✅ Backup creado: $backupFile" -ForegroundColor Green

# Ejecutar migraciones
Write-Host "🔧 Ejecutando migraciones..." -ForegroundColor Blue
$successCount = 0
$errorCount = 0

foreach ($migration in $migrations) {
    if (Test-Path "$MIGRATIONS_DIR/$migration") {
        try {
            Execute-Migration -MigrationFile $migration
            $successCount++
        }
        catch {
            Write-Host "❌ Error en migración $migration" -ForegroundColor Red
            $errorCount++
            # Continuar con las siguientes migraciones
        }
    }
    else {
        Write-Host "⚠️  Archivo de migración no encontrado: $migration" -ForegroundColor Yellow
    }
}

# Resumen final
Write-Host ""
Write-Host "🎉 Proceso de migración completado!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Resumen:" -ForegroundColor Cyan
Write-Host "  ✅ Migraciones exitosas: $successCount" -ForegroundColor Green
Write-Host "  ❌ Migraciones con errores: $errorCount" -ForegroundColor Red
Write-Host "  📦 Backup creado: $backupFile" -ForegroundColor Blue
Write-Host ""
Write-Host "🔧 Próximos pasos:" -ForegroundColor Cyan
Write-Host "  1. Verificar que todas las tablas se crearon correctamente"
Write-Host "  2. Reiniciar el servidor backend si es necesario"
Write-Host "  3. Probar la funcionalidad de la aplicación"
Write-Host ""
Write-Host "⚠️  Nota: El backup está guardado en $backupFile" -ForegroundColor Yellow
Write-Host "   En caso de problemas, puede restaurarse con:" -ForegroundColor Yellow
Write-Host "   docker exec -i $CONTAINER_NAME psql -U $DB_USER -d $DB_NAME -f $backupFile" -ForegroundColor Gray
