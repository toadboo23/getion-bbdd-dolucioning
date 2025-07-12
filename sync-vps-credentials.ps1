# Script PowerShell para sincronizar credenciales del VPS con el entorno local
# Soluciona el problema recurrente de contraseñas incompatibles

$ErrorActionPreference = "Stop"

$VPS_HOST = "69.62.107.86"
$VPS_USER = "root"
$VPS_PROJECT_PATH = "/root/solucioning-deploy"

Write-Host "🔄 Sincronizando credenciales del VPS..." -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Gray

# 1. Obtener el hash real de la contraseña del VPS
Write-Host "📡 [1/5] Obteniendo hash de contraseña del VPS..." -ForegroundColor Yellow

try {
    $sshCommand = "cd $VPS_PROJECT_PATH; docker exec solucioning_postgres psql -U postgres -d employee_management -t -c ""SELECT password FROM system_users WHERE email = 'nmartinez@solucioning.net';"" | xargs"
    $VPS_HASH = ssh "${VPS_USER}@${VPS_HOST}" $sshCommand 2>$null
    $VPS_HASH = $VPS_HASH.Trim()
    
    if ([string]::IsNullOrEmpty($VPS_HASH)) {
        throw "Hash vacío obtenido del VPS"
    }
} catch {
    Write-Host "❌ Error: No se pudo obtener el hash del VPS" -ForegroundColor Red
    Write-Host "💡 Asegúrate de que:" -ForegroundColor Yellow
    Write-Host "   - Puedes conectarte al VPS: ssh ${VPS_USER}@${VPS_HOST}" -ForegroundColor Gray
    Write-Host "   - Los contenedores están ejecutándose en el VPS" -ForegroundColor Gray
    Write-Host "   - La base de datos tiene el usuario nmartinez@solucioning.net" -ForegroundColor Gray
    exit 1
}

$hashPreview = $VPS_HASH.Substring(0, [Math]::Min(20, $VPS_HASH.Length))
Write-Host "✅ Hash obtenido del VPS: ${hashPreview}..." -ForegroundColor Green

# 2. Actualizar init.sql en la raíz
Write-Host "📝 [2/5] Actualizando init.sql en la raíz..." -ForegroundColor Yellow

# Crear backup del init.sql actual
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
Copy-Item "init.sql" "init.sql.backup.$timestamp"

# Leer el contenido actual
$initContent = Get-Content "init.sql" -Raw

# Actualizar el hash en init.sql usando regex más simple
$pattern = "(\('nmartinez@solucioning\.net', 'Nicolas', 'Martinez', ')[^']*(')"
$replacement = "`${1}$VPS_HASH`$2"
$newContent = $initContent -replace $pattern, $replacement

# Escribir el nuevo contenido
Set-Content "init.sql" $newContent -NoNewline

Write-Host "✅ init.sql actualizado con el hash del VPS" -ForegroundColor Green

# 3. Actualizar init.sql en database/schemas/ si existe
if (Test-Path "database/schemas/init.sql") {
    Write-Host "📝 [3/5] Actualizando database/schemas/init.sql..." -ForegroundColor Yellow
    Copy-Item "database/schemas/init.sql" "database/schemas/init.sql.backup.$timestamp"
    
    $schemasContent = Get-Content "database/schemas/init.sql" -Raw
    $newSchemasContent = $schemasContent -replace $pattern, $replacement
    Set-Content "database/schemas/init.sql" $newSchemasContent -NoNewline
    
    Write-Host "✅ database/schemas/init.sql actualizado" -ForegroundColor Green
} else {
    Write-Host "⏭️  [3/5] database/schemas/init.sql no existe, omitiendo..." -ForegroundColor Gray
}

# 4. Actualizar la base de datos local si está ejecutándose
Write-Host "🔄 [4/5] Actualizando base de datos local..." -ForegroundColor Yellow

$postgresRunning = docker ps | Select-String "solucioning_postgres"

if ($postgresRunning) {
    Write-Host "   📊 Contenedor PostgreSQL encontrado, actualizando..." -ForegroundColor Gray
    
    # Crear script SQL temporal
    $sqlScript = @"
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
"@

    $tempSqlFile = [System.IO.Path]::GetTempFileName() + ".sql"
    Set-Content $tempSqlFile $sqlScript
    
    # Copiar y ejecutar el script
    docker cp $tempSqlFile solucioning_postgres:/tmp/update_local_password.sql
    docker exec solucioning_postgres psql -U postgres -d employee_management -f /tmp/update_local_password.sql
    
    # Limpiar archivo temporal
    Remove-Item $tempSqlFile
    
    Write-Host "✅ Base de datos local actualizada" -ForegroundColor Green
} else {
    Write-Host "⚠️  Contenedor PostgreSQL no está ejecutándose" -ForegroundColor Yellow
    Write-Host "   💡 Ejecuta 'docker-compose up -d' para iniciar los contenedores" -ForegroundColor Gray
}

# 5. Crear/actualizar script de verificación PowerShell
Write-Host "📋 [5/5] Creando script de verificación..." -ForegroundColor Yellow

$verifyScript = @'
# Script de verificación de credenciales PowerShell

Write-Host "🔍 Verificando credenciales..." -ForegroundColor Cyan

$postgresRunning = docker ps | Select-String "solucioning_postgres"

if ($postgresRunning) {
    Write-Host "📊 Estado de la base de datos local:" -ForegroundColor Yellow
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
    
    Write-Host ""
    Write-Host "🧪 Probando login con credenciales:" -ForegroundColor Yellow
    Write-Host "   Email: nmartinez@solucioning.net" -ForegroundColor Gray
    Write-Host "   Password: 39284756" -ForegroundColor Gray
    
    try {
        $body = @{
            email = "nmartinez@solucioning.net"
            password = "39284756"
        } | ConvertTo-Json
        
        $response = Invoke-RestMethod -Uri "http://localhost:5173/api/auth/login" `
            -Method POST `
            -ContentType "application/json" `
            -Body $body `
            -ErrorAction SilentlyContinue
        
        if ($response.success) {
            Write-Host "✅ LOGIN EXITOSO" -ForegroundColor Green
        } else {
            Write-Host "❌ LOGIN FALLÓ" -ForegroundColor Red
            Write-Host "   Respuesta: $($response | ConvertTo-Json)" -ForegroundColor Gray
        }
    } catch {
        Write-Host "❌ LOGIN FALLÓ" -ForegroundColor Red
        Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Gray
    }
} else {
    Write-Host "❌ Contenedor PostgreSQL no está ejecutándose" -ForegroundColor Red
}
'@

Set-Content "verify-credentials.ps1" $verifyScript

Write-Host ""
Write-Host "🎉 ¡Sincronización completada!" -ForegroundColor Green
Write-Host "==================================================" -ForegroundColor Gray
Write-Host "✅ Hash del VPS sincronizado con el entorno local" -ForegroundColor Green
Write-Host "✅ Archivos init.sql actualizados" -ForegroundColor Green
Write-Host "✅ Base de datos local actualizada (si estaba ejecutándose)" -ForegroundColor Green
Write-Host ""
Write-Host "🧪 Para verificar que todo funciona:" -ForegroundColor Yellow
Write-Host "   .\verify-credentials.ps1" -ForegroundColor Cyan
Write-Host ""
Write-Host "💡 Para futuros clones del VPS, simplemente ejecuta:" -ForegroundColor Yellow
Write-Host "   .\sync-vps-credentials.ps1" -ForegroundColor Cyan
Write-Host ""
Write-Host "📝 Backups creados:" -ForegroundColor Yellow
Write-Host "   - init.sql.backup.$timestamp" -ForegroundColor Gray
if (Test-Path "database/schemas/init.sql.backup.$timestamp") {
    Write-Host "   - database/schemas/init.sql.backup.$timestamp" -ForegroundColor Gray
} 