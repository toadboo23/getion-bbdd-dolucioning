# Script para generar contrasenas seguras - Solucioning (Windows)
# Ejecutar este script para generar credenciales seguras

param(
    [switch]$Force
)

$ErrorActionPreference = "Stop"

Write-Host "Generando contrasenas seguras para Solucioning..." -ForegroundColor Green
Write-Host ""

# Funcion para imprimir mensajes
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

# Generar contrasenas seguras
Write-Header "=== GENERANDO CONTRASENAS SEGURAS ==="

# Generar contrasena para PostgreSQL (32 caracteres)
$POSTGRES_PASSWORD = -join ((33..126) | Get-Random -Count 31 | ForEach-Object {[char]$_})
$POSTGRES_PASSWORD = $POSTGRES_PASSWORD + "!"

# Generar session secret (64 caracteres)
$SESSION_SECRET = -join ((33..126) | Get-Random -Count 64 | ForEach-Object {[char]$_})

Write-Status "Contrasenas generadas exitosamente:"
Write-Host "   PostgreSQL: $($POSTGRES_PASSWORD.Substring(0,10))..." -ForegroundColor White
Write-Host "   Session Secret: $($SESSION_SECRET.Substring(0,10))..." -ForegroundColor White

# Crear archivo .env seguro
Write-Header "=== CREANDO ARCHIVO .ENV SEGURO ==="

$envContent = @"
# Variables de Entorno Seguras para Solucioning
# Generado automaticamente el $(Get-Date)
# IMPORTANTE: Guarda este archivo en un lugar seguro

# Base de Datos PostgreSQL
POSTGRES_PASSWORD=$POSTGRES_PASSWORD
POSTGRES_EXTERNAL_PORT=5432

# Backend API
SESSION_SECRET=$SESSION_SECRET
BACKEND_PORT=5173

# Frontend
API_URL=http://localhost:5173
FRONTEND_PORT=3000

# Configuracion adicional
NODE_ENV=development
"@

$envContent | Out-File -FilePath ".env.secure" -Encoding UTF8
Write-Status "Archivo .env.secure creado"

# Crear archivo .env.production seguro
$envProdContent = @"
# Variables de Entorno Seguras para Produccion - Solucioning
# Generado automaticamente el $(Get-Date)
# IMPORTANTE: Guarda este archivo en un lugar seguro

# Base de Datos PostgreSQL
POSTGRES_PASSWORD=$POSTGRES_PASSWORD
POSTGRES_EXTERNAL_PORT=5432

# Backend API
SESSION_SECRET=$SESSION_SECRET
BACKEND_PORT=5173

# Frontend
API_URL=http://TU_IP_VPS:5173
FRONTEND_PORT=3000

# Configuracion adicional para produccion
NODE_ENV=production
"@

$envProdContent | Out-File -FilePath ".env.production.secure" -Encoding UTF8
Write-Status "Archivo .env.production.secure creado"

Write-Header "=== INFORMACION DE SEGURIDAD ==="
Write-Host ""
Write-Host "Contrasenas generadas:" -ForegroundColor Cyan
Write-Host "   PostgreSQL: $POSTGRES_PASSWORD" -ForegroundColor White
Write-Host "   Session Secret: $SESSION_SECRET" -ForegroundColor White
Write-Host ""
Write-Host "Archivos creados:" -ForegroundColor Cyan
Write-Host "   .env.secure (para desarrollo)" -ForegroundColor White
Write-Host "   .env.production.secure (para produccion)" -ForegroundColor White
Write-Host ""
Write-Warning "IMPORTANTE:"
Write-Host "   1. Guarda estas contrasenas en un lugar seguro" -ForegroundColor White
Write-Host "   2. NO las subas al repositorio" -ForegroundColor White
Write-Host "   3. Cambia las contrasenas regularmente" -ForegroundColor White
Write-Host "   4. Usa diferentes contrasenas para cada entorno" -ForegroundColor White
Write-Host ""
Write-Status "Contrasenas seguras generadas exitosamente!" 