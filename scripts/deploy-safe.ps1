# Script de Despliegue Seguro
# NO modifica variables de entorno del VPS
# Solo actualiza código y reinicia contenedores

param(
    [string]$CommitMessage = ""
)

# Configuración
$VPS_IP = "69.62.107.86"
$VPS_DIR = "/root/solucioning-deploy"
$BRANCH_MAIN = "main"

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

# Función para validar estado del repositorio
function Test-RepositoryStatus {
    Write-Info "🔍 Validando estado del repositorio..."
    
    # Verificar si hay cambios sin commit
    $status = git status --porcelain
    if ($status) {
        Write-Warning "⚠️  Hay cambios sin commit:"
        Write-Output $status
        return $false
    }
    
    # Verificar si estamos en la rama correcta
    $currentBranch = git branch --show-current
    if ($currentBranch -ne $BRANCH_MAIN) {
        Write-Warning "⚠️  No estás en la rama $BRANCH_MAIN (actual: $currentBranch)"
        return $false
    }
    
    Write-Success "✅ Repositorio en estado válido"
    return $true
}

# Función para crear commit automático
function New-AutoCommit {
    param([string]$Message)
    
    if ([string]::IsNullOrWhiteSpace($Message)) {
        $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
        $Message = "Deploy: Actualización segura - $timestamp"
    }
    
    Write-Info "📝 Creando commit automático..."
    
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

# Función para hacer push
function Push-ToRemote {
    Write-Info "🚀 Haciendo push a $BRANCH_MAIN..."
    
    try {
        git push origin $BRANCH_MAIN
        Write-Success "✅ Push exitoso a $BRANCH_MAIN"
        return $true
    }
    catch {
        Write-Error "❌ Error en push: $($_.Exception.Message)"
        return $false
    }
}

# Función para desplegar al VPS de forma segura
function Deploy-ToVPSSafe {
    Write-Info "🌐 Desplegando al VPS de forma segura ($VPS_IP)..."
    
    $sshCommand = @"
cd $VPS_DIR

echo "🔄 Actualizando código desde $BRANCH_MAIN..."
git fetch origin
git checkout $BRANCH_MAIN
git pull origin $BRANCH_MAIN

echo "📦 Creando backup de la base de datos..."
docker exec solucioning_postgres pg_dump -U postgres employee_management > backup_\$(date +%Y%m%d_%H%M%S).sql

echo "🛑 Deteniendo contenedores..."
docker-compose down

echo "🔨 Reconstruyendo contenedores (sin tocar variables de entorno)..."
docker-compose up --build -d

echo "⏳ Esperando que los servicios estén listos..."
sleep 15

echo "🔍 Verificando estado de los contenedores..."
docker ps

echo "📋 Verificando logs del backend..."
docker logs --tail 5 solucioning_backend

echo "✅ Despliegue seguro completado"
"@
    
    try {
        Write-Info "Ejecutando comandos en el VPS..."
        ssh -i "C:\Users\nicolas.martinez\.ssh\id_rsa" root@$VPS_IP $sshCommand
        
        Write-Success "✅ Despliegue seguro al VPS completado"
        return $true
    }
    catch {
        Write-Error "❌ Error en despliegue al VPS: $($_.Exception.Message)"
        Write-Warning "💡 Ejecuta manualmente en el VPS:"
        Write-Output "ssh root@$VPS_IP"
        Write-Output "cd $VPS_DIR"
        Write-Output "git pull origin $BRANCH_MAIN"
        Write-Output "docker-compose down && docker-compose up --build -d"
        return $false
    }
}

# Función para verificar el despliegue
function Test-Deployment {
    Write-Info "🔍 Verificando despliegue..."
    
    try {
        # Verificar backend
        $backendHealth = Invoke-WebRequest -Uri "http://$VPS_IP:5173/api/health" -TimeoutSec 10 -ErrorAction SilentlyContinue
        if ($backendHealth.StatusCode -eq 200) {
            Write-Success "✅ Backend funcionando correctamente"
        } else {
            Write-Warning "⚠️  Backend responde pero con estado: $($backendHealth.StatusCode)"
        }
        
        # Verificar frontend
        $frontendResponse = Invoke-WebRequest -Uri "http://$VPS_IP:3000" -TimeoutSec 10 -ErrorAction SilentlyContinue
        if ($frontendResponse.StatusCode -eq 200) {
            Write-Success "✅ Frontend funcionando correctamente"
        } else {
            Write-Warning "⚠️  Frontend responde pero con estado: $($frontendResponse.StatusCode)"
        }
        
        Write-Success "✅ Verificación completada"
        return $true
    }
    catch {
        Write-Error "❌ Error en verificación: $($_.Exception.Message)"
        return $false
    }
}

# MAIN EXECUTION
Write-Info "🚀 Iniciando despliegue seguro..."

# 1. Validar repositorio
if (-not (Test-RepositoryStatus)) {
    Write-Error "❌ Repositorio no está en estado válido"
    exit 1
}

# 2. Crear commit si es necesario
if (-not (New-AutoCommit -Message $CommitMessage)) {
    Write-Error "❌ Error al crear commit"
    exit 1
}

# 3. Hacer push
if (-not (Push-ToRemote)) {
    Write-Error "❌ Error al hacer push"
    exit 1
}

# 4. Desplegar al VPS
if (-not (Deploy-ToVPSSafe)) {
    Write-Error "❌ Error en despliegue al VPS"
    exit 1
}

# 5. Verificar despliegue
if (-not (Test-Deployment)) {
    Write-Warning "⚠️  Problemas en la verificación del despliegue"
}

Write-Success "🎉 Despliegue seguro completado exitosamente!"
Write-Info "🌐 Aplicación disponible en: http://$VPS_IP:3000" 