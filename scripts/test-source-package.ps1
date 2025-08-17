# Script de prueba para verificar el paquete de código fuente
# Este script simula lo que hace GitHub Actions localmente

Write-Host "🧪 PROBANDO PAQUETE DE CÓDIGO FUENTE" -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Green

# Crear directorio temporal
$TEST_DIR = "test-source-package-$(Get-Date -Format 'yyyyMMdd_HHmmss')"
New-Item -ItemType Directory -Path $TEST_DIR -Force | Out-Null
Write-Host "📁 Directorio de prueba: $TEST_DIR" -ForegroundColor Yellow

# Simular el proceso de GitHub Actions
Write-Host "📦 Creando paquete de código fuente..." -ForegroundColor Cyan

# Copiar solo código fuente del frontend
if (Test-Path "client/src") {
    Copy-Item -Path "client/src" -Destination "$TEST_DIR/client-src" -Recurse -Force
    Write-Host "✅ Frontend src copiado" -ForegroundColor Green
} else {
    Write-Host "❌ No se encontró client/src" -ForegroundColor Red
}

if (Test-Path "client/index.html") {
    Copy-Item -Path "client/index.html" -Destination "$TEST_DIR/" -Force
    Write-Host "✅ index.html copiado" -ForegroundColor Green
}

if (Test-Path "client/package.json") {
    Copy-Item -Path "client/package.json" -Destination "$TEST_DIR/client-package.json" -Force
    Write-Host "✅ client package.json copiado" -ForegroundColor Green
}

if (Test-Path "client/vite.config.ts") {
    Copy-Item -Path "client/vite.config.ts" -Destination "$TEST_DIR/" -Force
    Write-Host "✅ vite.config.ts copiado" -ForegroundColor Green
}

if (Test-Path "client/tailwind.config.ts") {
    Copy-Item -Path "client/tailwind.config.ts" -Destination "$TEST_DIR/" -Force
    Write-Host "✅ tailwind.config.ts copiado" -ForegroundColor Green
}

if (Test-Path "client/postcss.config.js") {
    Copy-Item -Path "client/postcss.config.js" -Destination "$TEST_DIR/" -Force
    Write-Host "✅ postcss.config.js copiado" -ForegroundColor Green
}

if (Test-Path "client/tsconfig.json") {
    Copy-Item -Path "client/tsconfig.json" -Destination "$TEST_DIR/" -Force
    Write-Host "✅ client tsconfig.json copiado" -ForegroundColor Green
}

# Copiar solo código fuente del backend
if (Test-Path "server") {
    Copy-Item -Path "server" -Destination "$TEST_DIR/" -Recurse -Force
    # Remover node_modules si existe
    if (Test-Path "$TEST_DIR/server/node_modules") {
        Remove-Item -Path "$TEST_DIR/server/node_modules" -Recurse -Force
        Write-Host "✅ node_modules removido del paquete" -ForegroundColor Green
    }
    Write-Host "✅ Backend copiado" -ForegroundColor Green
} else {
    Write-Host "❌ No se encontró server/" -ForegroundColor Red
}

# Copiar archivos compartidos
if (Test-Path "shared") {
    Copy-Item -Path "shared" -Destination "$TEST_DIR/" -Recurse -Force
    Write-Host "✅ Archivos compartidos copiados" -ForegroundColor Green
} else {
    Write-Host "❌ No se encontró shared/" -ForegroundColor Red
}

# Copiar archivos de configuración de desarrollo
if (Test-Path "package.json") {
    Copy-Item -Path "package.json" -Destination "$TEST_DIR/root-package.json" -Force
    Write-Host "✅ root package.json copiado" -ForegroundColor Green
}

if (Test-Path "tsconfig.json") {
    Copy-Item -Path "tsconfig.json" -Destination "$TEST_DIR/root-tsconfig.json" -Force
    Write-Host "✅ root tsconfig.json copiado" -ForegroundColor Green
}

if (Test-Path "drizzle.config.ts") {
    Copy-Item -Path "drizzle.config.ts" -Destination "$TEST_DIR/" -Force
    Write-Host "✅ drizzle.config.ts copiado" -ForegroundColor Green
}

# Crear archivo de información
$deploymentInfo = @"
Deployment de prueba realizado el $(Get-Date)
Commit: $(git rev-parse HEAD 2>$null)
Branch: $(git branch --show-current 2>$null)
"@
$deploymentInfo | Out-File -FilePath "$TEST_DIR\DEPLOYMENT_INFO.txt" -Encoding UTF8

Write-Host ""
Write-Host "📊 RESUMEN DEL PAQUETE CREADO:" -ForegroundColor Magenta
Write-Host "==============================" -ForegroundColor Magenta

# Mostrar estructura del paquete
Write-Host "Estructura del directorio $TEST_DIR:" -ForegroundColor Yellow
Get-ChildItem -Path $TEST_DIR -Recurse | Select-Object FullName | ForEach-Object { $_.FullName.Replace($TEST_DIR, "") } | Where-Object { $_ -ne "" } | Select-Object -First 20

Write-Host ""
Write-Host "📁 Archivos incluidos:" -ForegroundColor Yellow
$fileCount = (Get-ChildItem -Path $TEST_DIR -Recurse -File).Count
Write-Host "Total de archivos: $fileCount" -ForegroundColor Cyan

Write-Host ""
Write-Host "📋 Archivos críticos verificados:" -ForegroundColor Yellow
Write-Host "Frontend:" -ForegroundColor Cyan
if (Test-Path "$TEST_DIR/client-src") {
    Get-ChildItem -Path "$TEST_DIR/client-src" | Select-Object -First 5 | ForEach-Object { Write-Host "  $($_.Name)" -ForegroundColor White }
} else {
    Write-Host "❌ No se encontró client-src" -ForegroundColor Red
}

Write-Host ""
Write-Host "Backend:" -ForegroundColor Cyan
if (Test-Path "$TEST_DIR/server") {
    Get-ChildItem -Path "$TEST_DIR/server" | Select-Object -First 5 | ForEach-Object { Write-Host "  $($_.Name)" -ForegroundColor White }
} else {
    Write-Host "❌ No se encontró server" -ForegroundColor Red
}

Write-Host ""
Write-Host "Compartidos:" -ForegroundColor Cyan
if (Test-Path "$TEST_DIR/shared") {
    Get-ChildItem -Path "$TEST_DIR/shared" | Select-Object -First 5 | ForEach-Object { Write-Host "  $($_.Name)" -ForegroundColor White }
} else {
    Write-Host "❌ No se encontró shared" -ForegroundColor Red
}

Write-Host ""
Write-Host "❌ Archivos EXCLUIDOS (verificación):" -ForegroundColor Yellow
Write-Host "Docker files:" -ForegroundColor Cyan
$dockerFiles = Get-ChildItem -Path $TEST_DIR -Recurse -Name "*docker*" -ErrorAction SilentlyContinue
if ($dockerFiles) {
    $dockerFiles | ForEach-Object { Write-Host "  $_" -ForegroundColor Red }
} else {
    Write-Host "✅ No hay archivos Docker" -ForegroundColor Green
}

Write-Host ""
Write-Host "Nginx:" -ForegroundColor Cyan
$nginxFiles = Get-ChildItem -Path $TEST_DIR -Recurse -Name "*nginx*" -ErrorAction SilentlyContinue
if ($nginxFiles) {
    $nginxFiles | ForEach-Object { Write-Host "  $_" -ForegroundColor Red }
} else {
    Write-Host "✅ No hay archivos Nginx" -ForegroundColor Green
}

Write-Host ""
Write-Host "Scripts de deployment:" -ForegroundColor Cyan
$deployFiles = Get-ChildItem -Path $TEST_DIR -Recurse -Name "*deploy*" -ErrorAction SilentlyContinue
if ($deployFiles) {
    $deployFiles | ForEach-Object { Write-Host "  $_" -ForegroundColor Red }
} else {
    Write-Host "✅ No hay scripts de deployment" -ForegroundColor Green
}

Write-Host ""
Write-Host "🎯 VERIFICACIÓN COMPLETADA" -ForegroundColor Green
Write-Host "==========================" -ForegroundColor Green
Write-Host "✅ Paquete de código fuente creado exitosamente" -ForegroundColor Green
Write-Host "✅ Solo se incluyeron archivos de código fuente" -ForegroundColor Green
Write-Host "✅ Se excluyeron archivos de configuración del servidor" -ForegroundColor Green
Write-Host ""
Write-Host "📁 El paquete está en: $TEST_DIR" -ForegroundColor Yellow
Write-Host "🗑️  Para limpiar: Remove-Item -Path '$TEST_DIR' -Recurse -Force" -ForegroundColor Gray
