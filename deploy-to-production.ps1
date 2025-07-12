# Script para desplegar cambios desde Develop-Local a Production (Windows)
# Uso: .\deploy-to-production.ps1 [mensaje_commit]

param(
    [string]$CommitMessage = "Actualizacion desde Develop-Local"
)

Write-Host "Iniciando despliegue a Production..." -ForegroundColor Green

# Verificar que estamos en Develop-Local
$current_branch = git branch --show-current
if ($current_branch -ne "Develop-Local") {
    Write-Host "Error: Debes estar en la rama Develop-Local" -ForegroundColor Red
    Write-Host "Ejecuta: git checkout Develop-Local" -ForegroundColor Yellow
    exit 1
}

# Hacer commit de cambios pendientes si los hay
$status = git status --porcelain
if ($status) {
    Write-Host "Haciendo commit de cambios pendientes..." -ForegroundColor Yellow
    git add .
    git commit -m $CommitMessage
}

# Subir cambios a Develop-Local
Write-Host "Subiendo cambios a Develop-Local..." -ForegroundColor Blue
git push origin Develop-Local

# Cambiar a Production
Write-Host "Cambiando a rama Production..." -ForegroundColor Blue
git checkout Production

# Hacer merge de Develop-Local a Production
Write-Host "Haciendo merge de Develop-Local a Production..." -ForegroundColor Blue
git merge Develop-Local

# Subir cambios a Production
Write-Host "Subiendo cambios a Production..." -ForegroundColor Blue
git push origin Production

# Volver a Develop-Local
Write-Host "Volviendo a Develop-Local..." -ForegroundColor Blue
git checkout Develop-Local

Write-Host "Despliegue completado!" -ForegroundColor Green
Write-Host "Proximos pasos:" -ForegroundColor Cyan
Write-Host "   1. Conectarse al VPS" -ForegroundColor White
Write-Host "   2. Ejecutar: cd /root/solucioning-deploy; git pull origin Production" -ForegroundColor White
Write-Host "   3. Ejecutar: cd /root/solucioning-deploy; docker-compose down; docker-compose up --build -d" -ForegroundColor White 