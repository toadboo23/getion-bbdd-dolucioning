# Script de Verificación y Diagnóstico del Sistema
# Uso: .\check-system.ps1 [local|vps|all]

param(
    [Parameter(Mandatory=$false)]
    [ValidateSet("local", "vps", "all")]
    [string]$Target = "all"
)

# Configuración
$VPS_IP = "69.62.107.86"
$VPS_DIR = "/root/solucioning-deploy"

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
            return $null
        }
        
        return @{ User = $vpsUser; Password = $vpsPassword }
    } else {
        Write-Error "Error: Archivo .env.local no encontrado"
        return $null
    }
}

# Función para verificar entorno local
function Test-LocalEnvironment {
    Write-Info "🔍 VERIFICANDO ENTORNO LOCAL"
    Write-Info "============================"
    
    # Verificar Git
    Write-Info "📋 Verificando Git..."
    try {
        $gitVersion = git --version
        Write-Success "✅ Git: $gitVersion"
        
        $currentBranch = git branch --show-current
        Write-Info "🌿 Rama actual: $currentBranch"
        
        $remotes = git remote -v
        Write-Info "🌐 Remotos configurados:"
        Write-Output $remotes
    }
    catch {
        Write-Error "❌ Error con Git: $($_.Exception.Message)"
    }
    
    # Verificar Docker
    Write-Info "🐳 Verificando Docker..."
    try {
        $dockerVersion = docker --version
        Write-Success "✅ Docker: $dockerVersion"
        
        $dockerComposeVersion = docker-compose --version
        Write-Success "✅ Docker Compose: $dockerComposeVersion"
    }
    catch {
        Write-Error "❌ Error con Docker: $($_.Exception.Message)"
    }
    
    # Verificar Node.js
    Write-Info "📦 Verificando Node.js..."
    try {
        $nodeVersion = node --version
        Write-Success "✅ Node.js: $nodeVersion"
        
        $npmVersion = npm --version
        Write-Success "✅ npm: $npmVersion"
    }
    catch {
        Write-Error "❌ Error con Node.js: $($_.Exception.Message)"
    }
    
    # Verificar archivos de configuración
    Write-Info "📁 Verificando archivos de configuración..."
    $configFiles = @(".env.local", "docker-compose.yml", "package.json")
    foreach ($file in $configFiles) {
        if (Test-Path $file) {
            Write-Success "✅ $file existe"
        } else {
            Write-Warning "⚠️  $file no encontrado"
        }
    }
    
    # Verificar estado del repositorio
    Write-Info "📊 Estado del repositorio..."
    $status = git status --porcelain
    if ($status) {
        Write-Warning "⚠️  Hay cambios sin commit:"
        Write-Output $status
    } else {
        Write-Success "✅ Repositorio limpio"
    }
}

# Función para verificar VPS
function Test-VPSEnvironment {
    param($Credentials)
    
    Write-Info "🌐 VERIFICANDO VPS ($VPS_IP)"
    Write-Info "============================="
    
    if (-not $Credentials) {
        Write-Error "❌ No se pueden obtener credenciales del VPS"
        return
    }
    
    $sshCommand = @'
echo "🔍 DIAGNÓSTICO COMPLETO DEL VPS - $(date)"
echo "=========================================="

echo ""
echo "📦 1. Verificando Docker..."
if command -v docker &> /dev/null; then
    echo "✅ Docker instalado: $(docker --version)"
    if docker info &> /dev/null; then
        echo "✅ Docker funcionando"
    else
        echo "❌ Docker no está ejecutándose"
    fi
else
    echo "❌ Docker no está instalado"
fi

echo ""
echo "🐳 2. Estado de contenedores..."
docker ps -a

echo ""
echo "📁 3. Verificando directorio del proyecto..."
if [ -d "$VPS_DIR" ]; then
    echo "✅ Directorio existe: $VPS_DIR"
    cd $VPS_DIR
    echo "📋 Contenido del directorio:"
    ls -la
else
    echo "❌ Directorio no existe: $VPS_DIR"
fi

echo ""
echo "🌿 4. Estado del repositorio Git..."
if [ -d "$VPS_DIR/.git" ]; then
    cd $VPS_DIR
    echo "✅ Repositorio Git encontrado"
    echo "🌿 Rama actual: $(git branch --show-current)"
    echo "📋 Último commit: $(git log -1 --oneline)"
    echo "🌐 Estado vs remoto:"
    git status --short --branch
else
    echo "❌ Repositorio Git no encontrado"
fi

echo ""
echo "🔌 5. Verificando puertos activos..."
netstat -tlnp | grep -E ":(3000|5173|5432)" || echo "⚠️  No se encontraron puertos activos"

echo ""
echo "📋 6. Logs del backend (últimas 10 líneas)..."
if docker ps | grep -q solucioning_backend; then
    docker logs --tail 10 solucioning_backend
else
    echo "❌ Contenedor del backend no está ejecutándose"
fi

echo ""
echo "💾 7. Espacio en disco..."
df -h

echo ""
echo "🧠 8. Uso de memoria..."
free -h

echo ""
echo "✅ Diagnóstico completado"
'@
    
    try {
        Write-Info "Ejecutando diagnostico en el VPS..."
        $sshPassCommand = "sshpass -p '$($Credentials.Password)' ssh -o StrictHostKeyChecking=no $($Credentials.User)@$VPS_IP '$sshCommand'"
        Invoke-Expression $sshPassCommand
    }
    catch {
        Write-Error "❌ Error al conectar con el VPS: $($_.Exception.Message)"
        Write-Warning "💡 Verifica las credenciales en .env.local"
    }
}

# Función para verificar conectividad
function Test-Connectivity {
    Write-Info "🌐 VERIFICANDO CONECTIVIDAD"
    Write-Info "==========================="
    
    # Verificar VPS
    Write-Info "🔍 Verificando conectividad con VPS ($VPS_IP)..."
    try {
        $ping = Test-Connection -ComputerName $VPS_IP -Count 1 -Quiet
        if ($ping) {
            Write-Success "✅ VPS accesible"
        } else {
            Write-Error "❌ VPS no accesible"
        }
    }
    catch {
        Write-Error "❌ Error al hacer ping al VPS: $($_.Exception.Message)"
    }
    
    # Verificar servicios web
    Write-Info "🌐 Verificando servicios web..."
    $services = @(
        @{ Name = "Frontend"; URL = "http://$VPS_IP:3000" },
        @{ Name = "Backend Health"; URL = "http://$VPS_IP:5173/api/health" }
    )
    
    foreach ($service in $services) {
        try {
            $response = Invoke-WebRequest -Uri $service.URL -TimeoutSec 10 -ErrorAction SilentlyContinue
            if ($response.StatusCode -eq 200) {
                Write-Success "✅ $($service.Name): Funcionando (HTTP $($response.StatusCode))"
            } else {
                Write-Warning "⚠️  $($service.Name): Responde pero con estado HTTP $($response.StatusCode)"
            }
        }
        catch {
            Write-Error "❌ $($service.Name): No accesible - $($_.Exception.Message)"
        }
    }
}

# Función para mostrar resumen
function Show-Summary {
    Write-Info "📊 RESUMEN DEL SISTEMA"
    Write-Info "======================"
    
    Write-Info "🌐 URLs de acceso:"
    Write-Info "   Frontend: http://$VPS_IP:3000"
    Write-Info "   Backend: http://$VPS_IP:5173"
    Write-Info "   Health Check: http://$VPS_IP:5173/api/health"
    
    Write-Info ""
    Write-Info "📋 Scripts disponibles:"
    Write-Info "   .\develop-feature.ps1 start     - Iniciar desarrollo en feature"
    Write-Info "   .\develop-feature.ps1 commit    - Commit en feature"
    Write-Info "   .\develop-feature.ps1 merge     - Merge feature a main"
    Write-Info "   .\deploy-automatic.ps1          - Despliegue automático"
    Write-Info "   .\check-system.ps1              - Verificar sistema"
    
    Write-Info ""
    Write-Info "🔧 Flujo de trabajo recomendado:"
    Write-Info "   1. .\develop-feature.ps1 start"
    Write-Info "   2. Hacer cambios en el código"
    Write-Info "   3. .\develop-feature.ps1 commit mensaje"
    Write-Info "   4. .\develop-feature.ps1 merge"
    Write-Info "   5. .\deploy-automatic.ps1"
}

# Función principal
function Main {
    Write-Info "🔍 INICIANDO VERIFICACIÓN DEL SISTEMA"
    Write-Info "======================================"
    
    switch ($Target) {
        "local" {
            Test-LocalEnvironment
        }
        "vps" {
            $credentials = Get-VPSCredentials
            Test-VPSEnvironment -Credentials $credentials
            Test-Connectivity
        }
        "all" {
            Test-LocalEnvironment
            Write-Info ""
            $credentials = Get-VPSCredentials
            Test-VPSEnvironment -Credentials $credentials
            Write-Info ""
            Test-Connectivity
        }
    }
    
    Write-Info ""
    Show-Summary
}

# Ejecutar función principal
Main 