# Script PowerShell para deploy al VPS usando SSH con clave vps-hostinguer
# Uso: .\deploy-vps-ssh.ps1 [mensaje_commit]

param(
    [string]$CommitMessage = "Deploy automático desde local"
)

$ErrorActionPreference = "Stop"

# Configuración SSH
$SSH_KEY = "vps-hostinguer"
$VPS_HOST = "69.62.107.86"
$VPS_USER = "root"
$VPS_PROJECT_PATH = "/root/solucioning-deploy"

Write-Host "🚀 Iniciando deploy al VPS usando SSH..." -ForegroundColor Green
Write-Host "==================================================" -ForegroundColor Gray
Write-Host "🔑 Usando clave SSH: $SSH_KEY" -ForegroundColor Cyan
Write-Host "🌐 VPS: ${VPS_USER}@${VPS_HOST}" -ForegroundColor Cyan
Write-Host "📁 Proyecto: $VPS_PROJECT_PATH" -ForegroundColor Cyan

# 1. Verificar que estamos en Develop-Local
Write-Host "📋 [1/6] Verificando rama actual..." -ForegroundColor Yellow
$current_branch = git branch --show-current
if ($current_branch -ne "Develop-Local") {
    Write-Host "❌ Error: Debes estar en la rama Develop-Local" -ForegroundColor Red
    Write-Host "💡 Ejecuta: git checkout Develop-Local" -ForegroundColor Yellow
    exit 1
}
Write-Host "✅ Rama actual: $current_branch" -ForegroundColor Green

# 2. Verificar estado del repositorio
Write-Host "📊 [2/6] Verificando estado del repositorio..." -ForegroundColor Yellow
$status = git status --porcelain
if ($status) {
    Write-Host "📝 Cambios pendientes detectados, haciendo commit..." -ForegroundColor Yellow
    git add .
    git commit -m $CommitMessage
    Write-Host "✅ Commit realizado: $CommitMessage" -ForegroundColor Green
} else {
    Write-Host "✅ No hay cambios pendientes" -ForegroundColor Green
}

# 3. Subir cambios a Develop-Local
Write-Host "⬆️  [3/6] Subiendo cambios a Develop-Local..." -ForegroundColor Yellow
git push origin Develop-Local
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Error al subir cambios a Develop-Local" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Cambios subidos a Develop-Local" -ForegroundColor Green

# 4. Cambiar a Production y hacer merge
Write-Host "🔄 [4/6] Actualizando rama Production..." -ForegroundColor Yellow
git checkout Production
git merge Develop-Local
git push origin Production
git checkout Develop-Local
Write-Host "✅ Rama Production actualizada" -ForegroundColor Green

# 5. Conectar al VPS y hacer pull
Write-Host "🌐 [5/6] Conectando al VPS y actualizando código..." -ForegroundColor Yellow

$sshCommand = @"
cd $VPS_PROJECT_PATH
echo '📊 Estado actual del repositorio:'
git status --short
echo ''
echo '📥 Haciendo pull de Production...'
git fetch origin
git checkout Production
git pull origin Production
echo ''
echo '📊 Estado después del pull:'
git status --short
echo ''
echo '🏷️  Último commit:'
git log --oneline -1
"@

try {
    $result = ssh -i $SSH_KEY "${VPS_USER}@${VPS_HOST}" $sshCommand 2>&1
    Write-Host "✅ Código actualizado en el VPS" -ForegroundColor Green
    Write-Host "📋 Resultado del pull:" -ForegroundColor Cyan
    Write-Host $result -ForegroundColor Gray
} catch {
    Write-Host "❌ Error al conectar al VPS o actualizar código" -ForegroundColor Red
    Write-Host "💡 Verifica:" -ForegroundColor Yellow
    Write-Host "   - La clave SSH $SSH_KEY existe y tiene permisos correctos" -ForegroundColor Gray
    Write-Host "   - Puedes conectarte manualmente: ssh -i $SSH_KEY ${VPS_USER}@${VPS_HOST}" -ForegroundColor Gray
    Write-Host "   - El VPS está accesible" -ForegroundColor Gray
    exit 1
}

# 6. Reiniciar servicios en el VPS
Write-Host "🔄 [6/6] Reiniciando servicios en el VPS..." -ForegroundColor Yellow

$restartCommand = @"
cd $VPS_PROJECT_PATH
echo '🛑 Deteniendo contenedores...'
docker-compose down
echo ''
echo '🚀 Iniciando contenedores con nueva versión...'
docker-compose up --build -d
echo ''
echo '📊 Estado de los contenedores:'
docker-compose ps
echo ''
echo '📋 Logs recientes:'
docker-compose logs --tail=10
"@

try {
    $result = ssh -i $SSH_KEY "${VPS_USER}@${VPS_HOST}" $restartCommand 2>&1
    Write-Host "✅ Servicios reiniciados en el VPS" -ForegroundColor Green
    Write-Host "📋 Estado de los servicios:" -ForegroundColor Cyan
    Write-Host $result -ForegroundColor Gray
} catch {
    Write-Host "❌ Error al reiniciar servicios en el VPS" -ForegroundColor Red
    Write-Host "💡 Verifica manualmente en el VPS:" -ForegroundColor Yellow
    Write-Host "   cd $VPS_PROJECT_PATH" -ForegroundColor Gray
    Write-Host "   docker-compose down && docker-compose up --build -d" -ForegroundColor Gray
}

Write-Host ""
Write-Host "🎉 ¡Deploy completado!" -ForegroundColor Green
Write-Host "==================================================" -ForegroundColor Gray
Write-Host "✅ Código subido a Develop-Local y Production" -ForegroundColor Green
Write-Host "✅ VPS actualizado con el último código" -ForegroundColor Green
Write-Host "✅ Servicios reiniciados" -ForegroundColor Green
Write-Host ""
Write-Host "🌐 URL de la aplicación: https://solucioning.net" -ForegroundColor Cyan
Write-Host "📊 Para monitorear: .\monitor-deployment.ps1" -ForegroundColor Yellow 