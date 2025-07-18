# Script PowerShell para verificar el estado del git en el VPS usando SSH
# Uso: .\check-vps-git.ps1

$ErrorActionPreference = "Stop"

# Configuración SSH
$SSH_KEY = "vps-hostinguer"
$VPS_HOST = "69.62.107.86"
$VPS_USER = "root"
$VPS_PROJECT_PATH = "/root/solucioning-deploy"

Write-Host "🔍 Verificando estado del git en el VPS..." -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Gray
Write-Host "🔑 Usando clave SSH: $SSH_KEY" -ForegroundColor Cyan
Write-Host "🌐 VPS: ${VPS_USER}@${VPS_HOST}" -ForegroundColor Cyan
Write-Host "📁 Proyecto: $VPS_PROJECT_PATH" -ForegroundColor Cyan

# 1. Verificar estado local
Write-Host "📋 [1/4] Estado del repositorio local..." -ForegroundColor Yellow
$local_branch = git branch --show-current
$local_commit = git log --oneline -1
$local_status = git status --porcelain

Write-Host "   Rama actual: $local_branch" -ForegroundColor White
Write-Host "   Último commit: $local_commit" -ForegroundColor White
if ($local_status) {
    Write-Host "   ⚠️  Cambios pendientes detectados" -ForegroundColor Yellow
    Write-Host $local_status -ForegroundColor Gray
} else {
    Write-Host "   ✅ Repositorio limpio" -ForegroundColor Green
}

# 2. Verificar estado remoto
Write-Host "🌐 [2/4] Estado del repositorio remoto..." -ForegroundColor Yellow
git fetch origin
$remote_develop = git log --oneline -1 origin/Develop-Local
$remote_production = git log --oneline -1 origin/Production

Write-Host "   Develop-Local remoto: $remote_develop" -ForegroundColor White
Write-Host "   Production remoto: $remote_production" -ForegroundColor White

# 3. Conectar al VPS y verificar estado
Write-Host "🖥️  [3/4] Conectando al VPS..." -ForegroundColor Yellow

$vpsCheckCommand = @"
cd $VPS_PROJECT_PATH
echo '📊 === ESTADO DEL REPOSITORIO EN VPS ==='
echo ''
echo '📁 Directorio actual:'
pwd
echo ''
echo '🌿 Rama actual:'
git branch --show-current
echo ''
echo '📋 Estado del repositorio:'
git status --short
echo ''
echo '🏷️  Último commit:'
git log --oneline -1
echo ''
echo '📥 Estado de las ramas remotas:'
git branch -r
echo ''
echo '📊 Diferencias con remoto:'
git fetch origin
echo '   Develop-Local:'
git log --oneline origin/Develop-Local..HEAD 2>/dev/null || echo '   (sin diferencias)'
echo '   Production:'
git log --oneline origin/Production..HEAD 2>/dev/null || echo '   (sin diferencias)'
echo ''
echo '📦 Estado de los contenedores:'
docker-compose ps
echo ''
echo '📋 Logs recientes:'
docker-compose logs --tail=5
"@

try {
    $result = ssh -i $SSH_KEY "${VPS_USER}@${VPS_HOST}" $vpsCheckCommand 2>&1
    Write-Host "✅ Conexión exitosa al VPS" -ForegroundColor Green
    Write-Host "📋 Estado del VPS:" -ForegroundColor Cyan
    Write-Host $result -ForegroundColor Gray
} catch {
    Write-Host "❌ Error al conectar al VPS" -ForegroundColor Red
    Write-Host "💡 Verifica:" -ForegroundColor Yellow
    Write-Host "   - La clave SSH $SSH_KEY existe y tiene permisos correctos" -ForegroundColor Gray
    Write-Host "   - Puedes conectarte manualmente: ssh -i $SSH_KEY ${VPS_USER}@${VPS_HOST}" -ForegroundColor Gray
    Write-Host "   - El VPS está accesible" -ForegroundColor Gray
    exit 1
}

# 4. Comparar estados
Write-Host "🔄 [4/4] Comparando estados..." -ForegroundColor Yellow

$compareCommand = @"
cd $VPS_PROJECT_PATH
echo '📊 === COMPARACIÓN DE ESTADOS ==='
echo ''
echo '🔄 Comparando con Develop-Local:'
git diff origin/Develop-Local..HEAD --name-only
echo ''
echo '🔄 Comparando con Production:'
git diff origin/Production..HEAD --name-only
echo ''
echo '📈 Historial de commits recientes:'
git log --oneline -10 --graph
"@

try {
    $result = ssh -i $SSH_KEY "${VPS_USER}@${VPS_HOST}" $compareCommand 2>&1
    Write-Host "📊 Comparación completada:" -ForegroundColor Cyan
    Write-Host $result -ForegroundColor Gray
} catch {
    Write-Host "⚠️  No se pudo completar la comparación" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🎯 Resumen de verificación:" -ForegroundColor Green
Write-Host "==================================================" -ForegroundColor Gray
Write-Host "✅ Estado del repositorio local verificado" -ForegroundColor Green
Write-Host "✅ Estado del repositorio remoto verificado" -ForegroundColor Green
Write-Host "✅ Estado del VPS verificado" -ForegroundColor Green
Write-Host ""
Write-Host "💡 Comandos útiles:" -ForegroundColor Yellow
Write-Host "   .\deploy-vps-ssh.ps1 'mensaje' - Para hacer deploy" -ForegroundColor Cyan
Write-Host "   .\monitor-deployment.ps1 - Para monitorear servicios" -ForegroundColor Cyan
Write-Host "   ssh -i $SSH_KEY ${VPS_USER}@${VPS_HOST} - Conexión manual" -ForegroundColor Cyan 