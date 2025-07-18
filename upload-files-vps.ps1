# Script PowerShell para subir archivos específicos al VPS usando SSH
# Uso: .\upload-files-vps.ps1 [archivo_o_directorio] [destino_en_vps]

param(
    [Parameter(Mandatory=$true)]
    [string]$SourcePath,
    
    [Parameter(Mandatory=$false)]
    [string]$DestinationPath = "",
    
    [Parameter(Mandatory=$false)]
    [switch]$Backup = $false
)

$ErrorActionPreference = "Stop"

# Configuración SSH
$SSH_KEY = "vps-hostinguer"
$VPS_HOST = "69.62.107.86"
$VPS_USER = "root"
$VPS_PROJECT_PATH = "/root/solucioning-deploy"

Write-Host "📤 Subiendo archivos al VPS usando SSH..." -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Gray
Write-Host "🔑 Usando clave SSH: $SSH_KEY" -ForegroundColor Cyan
Write-Host "🌐 VPS: ${VPS_USER}@${VPS_HOST}" -ForegroundColor Cyan
Write-Host "📁 Origen: $SourcePath" -ForegroundColor Cyan

# Verificar que el archivo/directorio existe
if (-not (Test-Path $SourcePath)) {
    Write-Host "❌ Error: El archivo o directorio '$SourcePath' no existe" -ForegroundColor Red
    exit 1
}

# Determinar el destino en el VPS
if ([string]::IsNullOrEmpty($DestinationPath)) {
    $DestinationPath = $VPS_PROJECT_PATH
    Write-Host "📁 Destino: $DestinationPath (por defecto)" -ForegroundColor Cyan
} else {
    Write-Host "📁 Destino: $DestinationPath" -ForegroundColor Cyan
}

# 1. Crear backup en el VPS si se solicita
if ($Backup) {
    Write-Host "💾 [1/3] Creando backup en el VPS..." -ForegroundColor Yellow
    
    $backupCommand = @"
cd $VPS_PROJECT_PATH
if [ -e "$(Split-Path $SourcePath -Leaf)" ]; then
    timestamp=`date +%Y%m%d_%H%M%S`
    cp -r "$(Split-Path $SourcePath -Leaf)" "$(Split-Path $SourcePath -Leaf).backup.`$timestamp"
    echo "✅ Backup creado: $(Split-Path $SourcePath -Leaf).backup.`$timestamp"
else
    echo "ℹ️  No existe archivo para hacer backup"
fi
"@

    try {
        $result = ssh -i $SSH_KEY "${VPS_USER}@${VPS_HOST}" $backupCommand 2>&1
        Write-Host "✅ Backup completado" -ForegroundColor Green
        Write-Host $result -ForegroundColor Gray
    } catch {
        Write-Host "⚠️  No se pudo crear el backup" -ForegroundColor Yellow
    }
} else {
    Write-Host "⏭️  [1/3] Omitiendo backup..." -ForegroundColor Gray
}

# 2. Subir archivo/directorio
Write-Host "📤 [2/3] Subiendo archivos..." -ForegroundColor Yellow

try {
    if (Test-Path $SourcePath -PathType Container) {
        # Es un directorio
        Write-Host "📁 Subiendo directorio: $SourcePath" -ForegroundColor White
        scp -i $SSH_KEY -r $SourcePath "${VPS_USER}@${VPS_HOST}:${DestinationPath}/"
    } else {
        # Es un archivo
        Write-Host "📄 Subiendo archivo: $SourcePath" -ForegroundColor White
        scp -i $SSH_KEY $SourcePath "${VPS_USER}@${VPS_HOST}:${DestinationPath}/"
    }
    Write-Host "✅ Archivos subidos exitosamente" -ForegroundColor Green
} catch {
    Write-Host "❌ Error al subir archivos" -ForegroundColor Red
    Write-Host "💡 Verifica:" -ForegroundColor Yellow
    Write-Host "   - La clave SSH $SSH_KEY existe y tiene permisos correctos" -ForegroundColor Gray
    Write-Host "   - El VPS está accesible" -ForegroundColor Gray
    Write-Host "   - Tienes permisos de escritura en el destino" -ForegroundColor Gray
    exit 1
}

# 3. Verificar la subida
Write-Host "🔍 [3/3] Verificando archivos subidos..." -ForegroundColor Yellow

$verifyCommand = @"
cd $DestinationPath
echo '📊 Archivos en el destino:'
ls -la "$(Split-Path $SourcePath -Leaf)"
echo ''
echo '📋 Tamaño y fecha de modificación:'
if [ -d "$(Split-Path $SourcePath -Leaf)" ]; then
    du -sh "$(Split-Path $SourcePath -Leaf)"
    find "$(Split-Path $SourcePath -Leaf)" -type f | head -5
else
    ls -lh "$(Split-Path $SourcePath -Leaf)"
fi
"@

try {
    $result = ssh -i $SSH_KEY "${VPS_USER}@${VPS_HOST}" $verifyCommand 2>&1
    Write-Host "✅ Verificación completada" -ForegroundColor Green
    Write-Host "📋 Estado de los archivos:" -ForegroundColor Cyan
    Write-Host $result -ForegroundColor Gray
} catch {
    Write-Host "⚠️  No se pudo verificar la subida" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🎉 ¡Subida completada!" -ForegroundColor Green
Write-Host "==================================================" -ForegroundColor Gray
Write-Host "✅ Archivos subidos al VPS" -ForegroundColor Green
if ($Backup) {
    Write-Host "✅ Backup creado" -ForegroundColor Green
}
Write-Host ""
Write-Host "💡 Comandos útiles:" -ForegroundColor Yellow
Write-Host "   .\check-vps-git.ps1 - Verificar estado del VPS" -ForegroundColor Cyan
Write-Host "   .\deploy-vps-ssh.ps1 - Hacer deploy completo" -ForegroundColor Cyan
Write-Host "   ssh -i $SSH_KEY ${VPS_USER}@${VPS_HOST} - Conexión manual" -ForegroundColor Cyan 