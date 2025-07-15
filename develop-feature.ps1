# Script para Desarrollo en Rama Feature
# Uso: .\develop-feature.ps1 [comando] [opciones]
# Comandos disponibles: start, commit, merge, status

param(
    [Parameter(Mandatory=$true)]
    [ValidateSet("start", "commit", "merge", "status", "push")]
    [string]$Command,
    
    [string]$Message = ""
)

# Configuración
$BRANCH_MAIN = "main"
$BRANCH_FEATURE = "feature/sistema-notificaciones-empleados"

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

# Función para iniciar desarrollo en feature
function Start-FeatureDevelopment {
    Write-Info "🚀 Iniciando desarrollo en rama feature..."
    
    # Verificar si estamos en main
    $currentBranch = git branch --show-current
    if ($currentBranch -ne $BRANCH_MAIN) {
        Write-Warning "⚠️  No estás en la rama $BRANCH_MAIN (actual: $currentBranch)"
        Write-Info "💡 Cambiando a $BRANCH_MAIN..."
        git checkout $BRANCH_MAIN
    }
    
    # Actualizar main
    Write-Info "📥 Actualizando $BRANCH_MAIN..."
    git pull origin $BRANCH_MAIN
    
    # Crear o cambiar a rama feature
    Write-Info "🌿 Cambiando a rama $BRANCH_FEATURE..."
    git checkout $BRANCH_FEATURE 2>$null
    if ($LASTEXITCODE -ne 0) {
        Write-Info "📝 Creando nueva rama $BRANCH_FEATURE..."
        git checkout -b $BRANCH_FEATURE
    }
    
    Write-Success "✅ Desarrollo iniciado en $BRANCH_FEATURE"
    Write-Info "💡 Ahora puedes hacer cambios y usar: .\develop-feature.ps1 commit 'tu mensaje'"
}

# Función para hacer commit en feature
function Commit-FeatureChanges {
    param([string]$Message)
    
    Write-Info "📝 Haciendo commit en rama feature..."
    
    # Verificar si estamos en la rama feature
    $currentBranch = git branch --show-current
    if ($currentBranch -ne $BRANCH_FEATURE) {
        Write-Error "❌ No estás en la rama $BRANCH_FEATURE (actual: $currentBranch)"
        Write-Info "💡 Usa: .\develop-feature.ps1 start"
        return $false
    }
    
    # Verificar si hay cambios
    $status = git status --porcelain
    if (-not $status) {
        Write-Warning "⚠️  No hay cambios para commitear"
        return $false
    }
    
    # Crear mensaje automático si no se proporciona
    if ([string]::IsNullOrWhiteSpace($Message)) {
        $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
        $Message = "Feature: Actualización - $timestamp"
    }
    
    try {
        git add .
        git commit -m $Message
        Write-Success "✅ Commit creado: $Message"
        return $true
    }
    catch {
        Write-Error "❌ Error al crear commit: $($_.Exception.Message)"
        return $false
    }
}

# Función para hacer push de la feature
function Push-FeatureBranch {
    Write-Info "🚀 Haciendo push de la rama feature..."
    
    # Verificar si estamos en la rama feature
    $currentBranch = git branch --show-current
    if ($currentBranch -ne $BRANCH_FEATURE) {
        Write-Error "❌ No estás en la rama $BRANCH_FEATURE (actual: $currentBranch)"
        return $false
    }
    
    try {
        git push origin $BRANCH_FEATURE
        Write-Success "✅ Push exitoso de $BRANCH_FEATURE"
        return $true
    }
    catch {
        Write-Error "❌ Error en push: $($_.Exception.Message)"
        return $false
    }
}

# Función para hacer merge a main
function Merge-ToMain {
    param([string]$Message)
    
    Write-Info "🔄 Haciendo merge de $BRANCH_FEATURE a $BRANCH_MAIN..."
    
    # Verificar si estamos en la rama feature
    $currentBranch = git branch --show-current
    if ($currentBranch -ne $BRANCH_FEATURE) {
        Write-Error "❌ No estás en la rama $BRANCH_FEATURE (actual: $currentBranch)"
        return $false
    }
    
    # Verificar si hay cambios sin commit
    $status = git status --porcelain
    if ($status) {
        Write-Warning "⚠️  Hay cambios sin commit. Haciendo commit automático..."
        if (-not (Commit-FeatureChanges -Message $Message)) {
            return $false
        }
    }
    
    # Hacer push de la feature
    if (-not (Push-FeatureBranch)) {
        return $false
    }
    
    # Cambiar a main
    Write-Info "🔄 Cambiando a $BRANCH_MAIN..."
    git checkout $BRANCH_MAIN
    
    # Actualizar main
    Write-Info "📥 Actualizando $BRANCH_MAIN..."
    git pull origin $BRANCH_MAIN
    
    # Hacer merge
    Write-Info "🔀 Haciendo merge de $BRANCH_FEATURE..."
    try {
        git merge $BRANCH_FEATURE
        Write-Success "✅ Merge exitoso"
        
        # Hacer push de main
        Write-Info "🚀 Haciendo push de $BRANCH_MAIN..."
        git push origin $BRANCH_MAIN
        Write-Success "✅ Push de $BRANCH_MAIN exitoso"
        
        Write-Info "🎉 Feature integrada exitosamente a $BRANCH_MAIN"
        Write-Info "💡 Ahora puedes usar: .\deploy-automatic.ps1 para desplegar"
        
        return $true
    }
    catch {
        Write-Error "❌ Error en merge: $($_.Exception.Message)"
        Write-Warning "💡 Resuelve los conflictos manualmente y luego haz commit"
        return $false
    }
}

# Función para mostrar estado
function Show-Status {
    Write-Info "📊 Estado del repositorio:"
    Write-Info "=========================="
    
    # Rama actual
    $currentBranch = git branch --show-current
    Write-Info "🌿 Rama actual: $currentBranch"
    
    # Estado de cambios
    $status = git status --porcelain
    if ($status) {
        Write-Warning "📝 Cambios pendientes:"
        Write-Output $status
    } else {
        Write-Success "✅ No hay cambios pendientes"
    }
    
    # Últimos commits
    Write-Info "📋 Últimos 3 commits:"
    git log --oneline -3
    
    # Diferencias con remoto
    Write-Info "🌐 Estado vs remoto:"
    git status --short --branch
}

# Función principal
function Main {
    switch ($Command) {
        "start" {
            Start-FeatureDevelopment
        }
        "commit" {
            Commit-FeatureChanges -Message $Message
        }
        "push" {
            Push-FeatureBranch
        }
        "merge" {
            Merge-ToMain -Message $Message
        }
        "status" {
            Show-Status
        }
        default {
            Write-Error "❌ Comando no válido: $Command"
            Write-Info "💡 Comandos disponibles: start, commit, merge, status, push"
        }
    }
}

# Ejecutar función principal
Main 