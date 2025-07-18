# Script de prueba rápida para verificar conexión SSH al VPS
# Uso: .\test-ssh-connection.ps1

$ErrorActionPreference = "Stop"

# Configuración SSH
$SSH_KEY = "vps-hostinguer"
$VPS_HOST = "69.62.107.86"
$VPS_USER = "root"

Write-Host "🧪 Prueba rápida de conexión SSH..." -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Gray

# Test 1: Verificar clave SSH
Write-Host "🔑 [1/4] Verificando clave SSH..." -ForegroundColor Yellow
$sshKeyPath = "$env:USERPROFILE\.ssh\$SSH_KEY"
if (Test-Path $sshKeyPath) {
    Write-Host "✅ Clave SSH encontrada" -ForegroundColor Green
} else {
    Write-Host "❌ Clave SSH no encontrada: $sshKeyPath" -ForegroundColor Red
    exit 1
}

# Test 2: Verificar conectividad
Write-Host "🌐 [2/4] Verificando conectividad..." -ForegroundColor Yellow
try {
    $pingResult = Test-Connection -ComputerName $VPS_HOST -Count 1 -Quiet
    if ($pingResult) {
        Write-Host "✅ VPS accesible" -ForegroundColor Green
    } else {
        Write-Host "⚠️  VPS no responde al ping" -ForegroundColor Yellow
    }
} catch {
    Write-Host "⚠️  No se pudo verificar conectividad" -ForegroundColor Yellow
}

# Test 3: Probar conexión SSH
Write-Host "🔑 [3/4] Probando conexión SSH..." -ForegroundColor Yellow
try {
    $result = ssh -i $SSH_KEY "${VPS_USER}@${VPS_HOST}" "echo '✅ SSH OK' && date" 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Conexión SSH exitosa" -ForegroundColor Green
        Write-Host "📋 Respuesta: $result" -ForegroundColor Gray
    } else {
        throw "SSH falló con código $LASTEXITCODE"
    }
} catch {
    Write-Host "❌ Error en conexión SSH" -ForegroundColor Red
    Write-Host "💡 Ejecuta: .\setup-ssh-vps.ps1 para diagnóstico completo" -ForegroundColor Yellow
    exit 1
}

# Test 4: Verificar proyecto en VPS
Write-Host "📁 [4/4] Verificando proyecto en VPS..." -ForegroundColor Yellow
try {
    $result = ssh -i $SSH_KEY "${VPS_USER}@${VPS_HOST}" "cd /root/solucioning-deploy && pwd && git status --short" 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Proyecto encontrado y accesible" -ForegroundColor Green
        Write-Host "📋 Estado del proyecto:" -ForegroundColor Gray
        Write-Host $result -ForegroundColor Gray
    } else {
        Write-Host "⚠️  Proyecto no encontrado o no accesible" -ForegroundColor Yellow
    }
} catch {
    Write-Host "⚠️  No se pudo verificar el proyecto" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🎉 ¡Prueba completada!" -ForegroundColor Green
Write-Host "==================================================" -ForegroundColor Gray
Write-Host "✅ Conexión SSH funcional" -ForegroundColor Green
Write-Host ""
Write-Host "🚀 Scripts disponibles:" -ForegroundColor Yellow
Write-Host "   .\deploy-vps-ssh.ps1 'mensaje' - Deploy completo" -ForegroundColor Cyan
Write-Host "   .\check-vps-git.ps1 - Verificar estado" -ForegroundColor Cyan
Write-Host "   .\upload-files-vps.ps1 archivo - Subir archivos" -ForegroundColor Cyan 