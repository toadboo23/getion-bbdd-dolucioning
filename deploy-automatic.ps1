# Script de Despliegue Automático Mejorado
# Uso: .\deploy-automatic.ps1 [mensaje_commit]
# Si no se proporciona mensaje, se usa uno automático con timestamp

param(
    [string]$CommitMessage = ""
)

# Configuración
$VPS_IP = "69.62.107.86"
$VPS_DIR = "/root/solucioning-deploy"
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

# Función para leer credenciales
function Get-VPSCredentials {
    if (Test-Path ".env.local") {
        $envContent = Get-Content ".env.local"
        $vpsUser = ""
        $vpsPassword = ""
        
        foreach ($line in $envContent) {
            if ($line -match "^VPS_USER=(.+)") {
                $vpsUser = $matches[1]
            }
            if ($line -match "^VPS_PASSWORD=(.+)") {
                $vpsPassword = $matches[1]
            }
        }
        
        if (-not $vpsUser -or -not $vpsPassword) {
            Write-Error "Error: Credenciales del VPS no encontradas en .env.local"
            Write-Info "Asegúrate de que el archivo contenga VPS_USER y VPS_PASSWORD"
            exit 1
        }
        
        return @{ User = $vpsUser; Password = $vpsPassword }
    } else {
        Write-Error "Error: Archivo .env.local no encontrado"
        Write-Info "Crea el archivo .env.local con las credenciales del VPS:"
        Write-Info "VPS_USER=tu_usuario"
        Write-Info "VPS_PASSWORD=tu_contraseña"
        exit 1
    }
}

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
        $Message = "Auto-deploy: Actualización automática - $timestamp"
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

# Función para desplegar al VPS
function Deploy-ToVPS {
    param($Credentials)
    
    Write-Info "🌐 Desplegando al VPS ($VPS_IP)..."
    
    $sshCommand = @"
cd $VPS_DIR
echo "🔄 Actualizando código desde $BRANCH_MAIN..."
git fetch origin
git checkout $BRANCH_MAIN
git pull origin $BRANCH_MAIN

echo "📦 Creando backup antes del despliegue..."
docker-compose exec -T db pg_dump -U postgres employee_management > backup_\$(date +%Y%m%d_%H%M%S).sql

echo "🛑 Deteniendo contenedores..."
docker-compose down

echo "🔨 Reconstruyendo y reiniciando contenedores..."
docker-compose up --build -d

echo "⏳ Esperando que los servicios estén listos..."
sleep 10

echo "🔍 Verificando estado de los contenedores..."
docker ps

echo "📋 Verificando logs del backend..."
docker logs --tail 10 solucioning_backend

echo "✅ Despliegue completado"
"@
    
    try {
        # Usar sshpass para ejecutar comandos SSH
        $sshPassCommand = "sshpass -p '$($Credentials.Password)' ssh -o StrictHostKeyChecking=no $($Credentials.User)@$VPS_IP '$sshCommand'"
        
        Write-Info "Ejecutando comandos en el VPS..."
        Invoke-Expression $sshPassCommand
        
        Write-Success "✅ Despliegue al VPS completado exitosamente"
        return $true
    }
    catch {
        Write-Error "❌ Error en despliegue al VPS: $($_.Exception.Message)"
        Write-Warning "💡 Ejecuta manualmente en el VPS:"
        Write-Output "ssh $($Credentials.User)@$VPS_IP"
        Write-Output "cd $VPS_DIR"
        Write-Output "git pull origin $BRANCH_MAIN"
        Write-Output "docker-compose down && docker-compose up --build -d"
        return $false
    }
}

# Función para verificar el despliegue
function Test-Deployment {
    param($Credentials)
    
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
        
        Write-Success "🎉 Verificación completada"
        Write-Info "🌐 URLs de acceso:"
        Write-Info "   Frontend: http://$VPS_IP:3000"
        Write-Info "   Backend: http://$VPS_IP:5173"
        
    }
    catch {
        Write-Error "❌ Error al verificar despliegue: $($_.Exception.Message)"
        Write-Warning "💡 Verifica manualmente las URLs:"
        Write-Info "   http://$VPS_IP:3000"
        Write-Info "   http://$VPS_IP:5173/api/health"
    }
}

# Función principal
function Main {
    Write-Info "🚀 INICIANDO DESPLIEGUE AUTOMÁTICO"
    Write-Info "=================================="
    
    # 1. Obtener credenciales
    $credentials = Get-VPSCredentials
    
    # 2. Validar estado del repositorio
    if (-not (Test-RepositoryStatus)) {
        Write-Error "❌ Repositorio no está en estado válido para despliegue"
        Write-Info "💡 Asegúrate de estar en la rama $BRANCH_MAIN y no tener cambios pendientes"
        exit 1
    }
    
    # 3. Crear commit automático
    if (-not (New-AutoCommit -Message $CommitMessage)) {
        Write-Error "❌ No se pudo crear el commit"
        exit 1
    }
    
    # 4. Hacer push
    if (-not (Push-ToRemote)) {
        Write-Error "❌ No se pudo hacer push al repositorio"
        exit 1
    }
    
    # 5. Desplegar al VPS
    if (-not (Deploy-ToVPS -Credentials $credentials)) {
        Write-Error "❌ Error en el despliegue al VPS"
        exit 1
    }
    
    # 6. Verificar despliegue
    Test-Deployment -Credentials $credentials
    
    Write-Success "🎉 DESPLIEGUE AUTOMÁTICO COMPLETADO EXITOSAMENTE"
    Write-Info "=================================================="
}

# Ejecutar función principal
Main 