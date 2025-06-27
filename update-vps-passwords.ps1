# Script para actualizar contraseñas en el VPS - Solucioning
# Ejecutar desde PowerShell en Windows

param(
    [string]$VPS_IP = "69.62.107.86",
    [string]$VPS_USER = "root"
)

# Configuración
$ErrorActionPreference = "Stop"

Write-Host "Actualizando contraseñas del VPS..." -ForegroundColor Green

# Función para imprimir mensajes
function Write-Status {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor Green
}

function Write-Warning {
    param([string]$Message)
    Write-Host "[WARNING] $Message" -ForegroundColor Yellow
}

function Write-Error {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor Red
}

function Write-Header {
    param([string]$Message)
    Write-Host "[HEADER] $Message" -ForegroundColor Blue
}

# Generar contraseñas seguras
Write-Header "=== GENERANDO CONTRASEÑAS SEGURAS ==="

# Generar contraseña para PostgreSQL (32 caracteres)
$POSTGRES_PASSWORD = -join ((33..126) | Get-Random -Count 31 | ForEach-Object {[char]$_})
$POSTGRES_PASSWORD = $POSTGRES_PASSWORD + "!"

# Generar session secret (64 caracteres)
$SESSION_SECRET = -join ((33..126) | Get-Random -Count 64 | ForEach-Object {[char]$_})

Write-Status "Contraseñas generadas:"
Write-Host "   PostgreSQL: $($POSTGRES_PASSWORD.Substring(0,10))..." -ForegroundColor White
Write-Host "   Session Secret: $($SESSION_SECRET.Substring(0,10))..." -ForegroundColor White

# Crear nuevo archivo .env
Write-Header "=== CREANDO NUEVO ARCHIVO .ENV ==="

# Obtener IP del servidor
try {
    $SERVER_IP = ssh "${VPS_USER}@${VPS_IP}" "curl -s ifconfig.me"
} catch {
    $SERVER_IP = $VPS_IP
}

# Crear archivo .env temporal
$envContent = @"
# Variables de Entorno para Producción - Solucioning
# Configura estos valores según tu VPS
# Última actualización: $(Get-Date)

# Base de Datos PostgreSQL
POSTGRES_PASSWORD=$POSTGRES_PASSWORD
POSTGRES_EXTERNAL_PORT=5432

# Backend API
SESSION_SECRET=$SESSION_SECRET
BACKEND_PORT=5173

# Frontend
API_URL=http://${SERVER_IP}:5173
FRONTEND_PORT=3000

# Configuración adicional para producción
NODE_ENV=production
"@

$envContent | Out-File -FilePath ".env.new" -Encoding UTF8
Write-Status "Archivo .env temporal creado"

# Subir archivo al VPS
Write-Header "=== SUBIENDO ARCHIVO AL VPS ==="
try {
    scp ".env.new" "${VPS_USER}@${VPS_IP}:/opt/solucioning/.env.new"
    Write-Status "Archivo subido al VPS"
} catch {
    Write-Error "Error al subir el archivo al VPS"
    exit 1
}

# Hacer backup del archivo actual y aplicar el nuevo
Write-Header "=== APLICANDO CAMBIOS ==="
try {
    $timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
    ssh "${VPS_USER}@${VPS_IP}" "cd /opt/solucioning && cp .env .env.backup.${timestamp} && mv .env.new .env"
    Write-Status "Backup creado y nuevo archivo aplicado"
} catch {
    Write-Error "Error al aplicar los cambios"
    exit 1
}

# Reiniciar servicios para aplicar cambios
Write-Header "=== REINICIANDO SERVICIOS ==="
try {
    ssh "${VPS_USER}@${VPS_IP}" "cd /opt/solucioning && docker-compose -f docker-compose.prod.yml down && docker-compose -f docker-compose.prod.yml up -d"
    Write-Status "Servicios reiniciados"
} catch {
    Write-Error "Error al reiniciar los servicios"
    exit 1
}

# Verificar que los servicios estén funcionando
Write-Header "=== VERIFICANDO SERVICIOS ==="
Start-Sleep -Seconds 10
try {
    ssh "${VPS_USER}@${VPS_IP}" "cd /opt/solucioning && docker-compose -f docker-compose.prod.yml ps"
} catch {
    Write-Warning "No se pudo verificar el estado de los servicios"
}

# Limpiar archivo temporal
Remove-Item ".env.new" -ErrorAction SilentlyContinue

Write-Header "=== ACTUALIZACIÓN COMPLETADA ==="
Write-Status "Contraseñas actualizadas exitosamente!"
Write-Host ""
Write-Host "Información de las nuevas contraseñas:" -ForegroundColor Cyan
Write-Host "   PostgreSQL: $POSTGRES_PASSWORD" -ForegroundColor White
Write-Host "   Session Secret: $SESSION_SECRET" -ForegroundColor White
Write-Host ""
Write-Host "Backup creado en: /opt/solucioning/.env.backup.*" -ForegroundColor Cyan
Write-Host ""
Write-Warning "IMPORTANTE: Guarda estas contraseñas en un lugar seguro"
Write-Warning "IMPORTANTE: No las compartas ni las subas al repositorio"
Write-Host ""
Write-Status "Sistema Solucioning actualizado con contraseñas seguras!" 