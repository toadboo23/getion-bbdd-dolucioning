# Script de Desarrollo Local
# Usa docker-compose.local.yml para evitar conflictos de variables de entorno

param(
    [string]$Action = "up"
)

# Colores para output
function Write-ColorOutput($ForegroundColor) {
    $fc = $host.UI.RawUI.ForegroundColor
    $host.UI.RawUI.ForegroundColor = $ForegroundColor
    if ($args) {
        Write-Output $args
    }
    $host.UI.RawUI.ForegroundColor = $fc
}

function Write-Success { Write-ColorOutput Green $args }
function Write-Error { Write-ColorOutput Red $args }
function Write-Warning { Write-ColorOutput Yellow $args }
function Write-Info { Write-ColorOutput Cyan $args }

Write-Info "🚀 Iniciando desarrollo local..."

# Verificar que estamos en el directorio correcto
if (-not (Test-Path "docker-compose.local.yml")) {
    Write-Error "❌ No se encontró docker-compose.local.yml"
    Write-Info "Asegúrate de estar en el directorio raíz del proyecto"
    exit 1
}

# Verificar que Docker esté corriendo
try {
    docker version | Out-Null
    Write-Success "✅ Docker está funcionando"
} catch {
    Write-Error "❌ Docker no está funcionando. Inicia Docker Desktop"
    exit 1
}

# Ejecutar comando según la acción
switch ($Action.ToLower()) {
    "up" {
        Write-Info "📦 Iniciando servicios locales..."
        docker-compose -f docker-compose.local.yml up -d
        Write-Success "✅ Servicios iniciados"
        Write-Info "🌐 Frontend: http://localhost:3000"
        Write-Info "🔧 Backend: http://localhost:5173"
        Write-Info "🗄️  PgAdmin: http://localhost:5050"
    }
    "down" {
        Write-Info "🛑 Deteniendo servicios locales..."
        docker-compose -f docker-compose.local.yml down
        Write-Success "✅ Servicios detenidos"
    }
    "restart" {
        Write-Info "🔄 Reiniciando servicios locales..."
        docker-compose -f docker-compose.local.yml down
        docker-compose -f docker-compose.local.yml up -d
        Write-Success "✅ Servicios reiniciados"
    }
    "logs" {
        Write-Info "📋 Mostrando logs..."
        docker-compose -f docker-compose.local.yml logs -f
    }
    "build" {
        Write-Info "🔨 Reconstruyendo servicios locales..."
        docker-compose -f docker-compose.local.yml build --no-cache
        docker-compose -f docker-compose.local.yml up -d
        Write-Success "✅ Servicios reconstruidos e iniciados"
    }
    "clean" {
        Write-Info "🧹 Limpiando todo..."
        docker-compose -f docker-compose.local.yml down -v
        docker system prune -f
        Write-Success "✅ Limpieza completada"
    }
    default {
        Write-Error "❌ Acción no válida: $Action"
        Write-Info "Acciones disponibles: up, down, restart, logs, build, clean"
        exit 1
    }
}

Write-Info "✅ Comando completado: $Action" 