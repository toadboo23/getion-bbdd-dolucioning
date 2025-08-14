# Script simple para ejecutar migraciones principales
Write-Host "🚀 Ejecutando migraciones principales..." -ForegroundColor Green

$CONTAINER_NAME = "solucioning_postgres"
$DB_NAME = "employee_management"
$DB_USER = "postgres"

# Verificar contenedor
Write-Host "🔍 Verificando contenedor..." -ForegroundColor Blue
$containerStatus = docker ps --filter "name=$CONTAINER_NAME" --format "{{.Names}}"
if ($containerStatus -notlike "*$CONTAINER_NAME*") {
    Write-Host "❌ Contenedor no encontrado" -ForegroundColor Red
    exit 1
}

# Crear backup
$backupFile = "backup_$(Get-Date -Format 'yyyyMMdd_HHmmss').sql"
Write-Host "📦 Creando backup..." -ForegroundColor Blue
docker exec $CONTAINER_NAME pg_dump -U $DB_USER -d $DB_NAME > $backupFile
Write-Host "✅ Backup creado: $backupFile" -ForegroundColor Green

# Lista de migraciones principales
$migrations = @(
    "001_create_candidates_tables.sql",
    "2024-07-12_add_employee_leave_history.sql",
    "2024-07-20_add_cdp_trigger.sql",
    "2024-07-20_add_hours_limit_trigger.sql",
    "2024-07-21_add_vacaciones_fields.sql",
    "2024-07-21_expand_employees_fields.sql",
    "add-flota-field.sql",
    "add-new-company-leave-reasons.sql",
    "create-flota-function.sql",
    "create-flota-trigger.sql",
    "fix-company-leave-hours.sql",
    "make_telefono_optional.sql",
    "normalize-cities.sql",
    "update-flota-default.sql",
    "update-users-add-ciudad.sql",
    "2025-01-08_sync_employees_structure_with_production.sql",
    "2025-01-15_add_pendiente_activacion_to_production.sql",
    "2025-01-15_allow_employees_without_id_glovo.sql",
    "2025-01-15_create_captation_tables.sql",
    "2025-01-15_fix_captation_function_types.sql",
    "2025-01-15_sync_local_with_production.sql",
    "2025-01-15_update_columns_to_use_underscores.sql",
    "2025-01-20_add_pending_hours_to_captation.sql",
    "2025-01-20_fix_captation_dashboard_types.sql",
    "fix-cdp-trigger-penalized.sql",
    "normalize-cities-production.sql",
    "normalize-cities-production-fixed.sql",
    "verify-all-employee-hours.sql"
)

$successCount = 0
$errorCount = 0

foreach ($migration in $migrations) {
    $migrationPath = "database/migrations/$migration"
    if (Test-Path $migrationPath) {
        Write-Host "📄 Ejecutando: $migration" -ForegroundColor Yellow
        try {
            docker cp $migrationPath "${CONTAINER_NAME}:/tmp/$migration"
            docker exec $CONTAINER_NAME psql -U $DB_USER -d $DB_NAME -f "/tmp/$migration"
            docker exec $CONTAINER_NAME rm "/tmp/$migration"
            Write-Host "✅ $migration completada" -ForegroundColor Green
            $successCount++
        }
        catch {
            Write-Host "❌ Error en $migration" -ForegroundColor Red
            $errorCount++
        }
    }
    else {
        Write-Host "⚠️  No encontrado: $migration" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "🎉 Proceso completado!" -ForegroundColor Green
Write-Host "✅ Exitosas: $successCount" -ForegroundColor Green
Write-Host "❌ Errores: $errorCount" -ForegroundColor Red
Write-Host "📦 Backup: $backupFile" -ForegroundColor Blue
