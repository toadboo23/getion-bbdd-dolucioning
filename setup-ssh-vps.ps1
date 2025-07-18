# Script PowerShell para configurar y verificar la conexión SSH al VPS
# Uso: .\setup-ssh-vps.ps1

$ErrorActionPreference = "Stop"

# Configuración SSH
$SSH_KEY = "vps-hostinguer"
$VPS_HOST = "69.62.107.86"
$VPS_USER = "root"

Write-Host "🔧 Configurando conexión SSH al VPS..." -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Gray
Write-Host "🔑 Clave SSH: $SSH_KEY" -ForegroundColor Cyan
Write-Host "🌐 VPS: ${VPS_USER}@${VPS_HOST}" -ForegroundColor Cyan

# 1. Verificar que la clave SSH existe
Write-Host "📋 [1/5] Verificando clave SSH..." -ForegroundColor Yellow

$sshKeyPath = "$env:USERPROFILE\.ssh\$SSH_KEY"
if (Test-Path $sshKeyPath) {
    Write-Host "✅ Clave SSH encontrada: $sshKeyPath" -ForegroundColor Green
    
    # Verificar permisos (en Windows no es tan crítico, pero es buena práctica)
    $acl = Get-Acl $sshKeyPath
    $owner = $acl.Owner
    Write-Host "   Propietario: $owner" -ForegroundColor White
} else {
    Write-Host "❌ Clave SSH no encontrada: $sshKeyPath" -ForegroundColor Red
    Write-Host "💡 Asegúrate de que la clave SSH '$SSH_KEY' esté en tu directorio .ssh" -ForegroundColor Yellow
    Write-Host "   Ubicación esperada: $sshKeyPath" -ForegroundColor Gray
    exit 1
}

# 2. Verificar conectividad básica
Write-Host "🌐 [2/5] Verificando conectividad al VPS..." -ForegroundColor Yellow

try {
    $pingResult = Test-Connection -ComputerName $VPS_HOST -Count 1 -Quiet
    if ($pingResult) {
        Write-Host "✅ VPS accesible via ping" -ForegroundColor Green
    } else {
        Write-Host "⚠️  VPS no responde al ping (puede estar bloqueado)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "⚠️  No se pudo verificar conectividad via ping" -ForegroundColor Yellow
}

# 3. Probar conexión SSH básica
Write-Host "🔑 [3/5] Probando conexión SSH..." -ForegroundColor Yellow

try {
    $sshTestCommand = "echo '✅ Conexión SSH exitosa' && whoami && pwd"
    $result = ssh -i $SSH_KEY "${VPS_USER}@${VPS_HOST}" $sshTestCommand 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Conexión SSH exitosa" -ForegroundColor Green
        Write-Host "📋 Información del VPS:" -ForegroundColor Cyan
        Write-Host $result -ForegroundColor Gray
    } else {
        throw "Conexión SSH falló con código $LASTEXITCODE"
    }
} catch {
    Write-Host "❌ Error en conexión SSH" -ForegroundColor Red
    Write-Host "💡 Posibles soluciones:" -ForegroundColor Yellow
    Write-Host "   1. Verifica que la clave SSH tenga permisos correctos" -ForegroundColor Gray
    Write-Host "   2. Prueba conectarte manualmente: ssh -i $SSH_KEY ${VPS_USER}@${VPS_HOST}" -ForegroundColor Gray
    Write-Host "   3. Verifica que el VPS esté configurado para aceptar tu clave SSH" -ForegroundColor Gray
    Write-Host "   4. Revisa los logs del servidor SSH en el VPS" -ForegroundColor Gray
    exit 1
}

# 4. Verificar directorio del proyecto en el VPS
Write-Host "📁 [4/5] Verificando directorio del proyecto..." -ForegroundColor Yellow

$projectCheckCommand = @"
PROJECT_PATH="/root/solucioning-deploy"
if [ -d "$PROJECT_PATH" ]; then
    echo "✅ Directorio del proyecto encontrado: $PROJECT_PATH"
    echo "📊 Contenido del directorio:"
    ls -la "$PROJECT_PATH" | head -10
    echo ""
    echo "🌿 Rama actual del git:"
    cd "$PROJECT_PATH" && git branch --show-current 2>/dev/null || echo "No es un repositorio git"
else
    echo "❌ Directorio del proyecto no encontrado: $PROJECT_PATH"
    echo "📋 Directorios en /root:"
    ls -la /root | head -10
fi
"@

try {
    $result = ssh -i $SSH_KEY "${VPS_USER}@${VPS_HOST}" $projectCheckCommand 2>&1
    Write-Host "📋 Estado del proyecto en el VPS:" -ForegroundColor Cyan
    Write-Host $result -ForegroundColor Gray
} catch {
    Write-Host "⚠️  No se pudo verificar el directorio del proyecto" -ForegroundColor Yellow
}

# 5. Verificar Docker en el VPS
Write-Host "🐳 [5/5] Verificando Docker en el VPS..." -ForegroundColor Yellow

$dockerCheckCommand = @"
echo "📊 Versión de Docker:"
docker --version
echo ""
echo "📦 Contenedores ejecutándose:"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
echo ""
echo "💾 Espacio en disco:"
df -h / | tail -1
echo ""
echo "🧠 Uso de memoria:"
free -h | head -2
"@

try {
    $result = ssh -i $SSH_KEY "${VPS_USER}@${VPS_HOST}" $dockerCheckCommand 2>&1
    Write-Host "📋 Estado de Docker en el VPS:" -ForegroundColor Cyan
    Write-Host $result -ForegroundColor Gray
} catch {
    Write-Host "⚠️  No se pudo verificar Docker" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🎉 ¡Configuración SSH completada!" -ForegroundColor Green
Write-Host "==================================================" -ForegroundColor Gray
Write-Host "✅ Clave SSH verificada" -ForegroundColor Green
Write-Host "✅ Conexión SSH funcional" -ForegroundColor Green
Write-Host "✅ VPS accesible" -ForegroundColor Green
Write-Host ""
Write-Host "🚀 Scripts disponibles:" -ForegroundColor Yellow
Write-Host "   .\deploy-vps-ssh.ps1 'mensaje' - Deploy completo" -ForegroundColor Cyan
Write-Host "   .\check-vps-git.ps1 - Verificar estado del git" -ForegroundColor Cyan
Write-Host "   .\upload-files-vps.ps1 archivo - Subir archivos específicos" -ForegroundColor Cyan
Write-Host "   .\monitor-deployment.ps1 - Monitorear servicios" -ForegroundColor Cyan
Write-Host ""
Write-Host "🔧 Conexión manual:" -ForegroundColor Yellow
Write-Host "   ssh -i $SSH_KEY ${VPS_USER}@${VPS_HOST}" -ForegroundColor Cyan 