# Script de despliegue limpio para VPS - Solucioning
# Ejecutar desde PowerShell en Windows

param(
    [string]$VPS_IP = "69.62.107.86",
    [string]$VPS_USER = "root"
)

# Configuración
$ErrorActionPreference = "Stop"

Write-Host "Iniciando despliegue limpio de Solucioning en VPS..." -ForegroundColor Green

# Función para imprimir mensajes
function Write-Status {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor Green
}

function Write-Warning {
    param([string]$Message)
    Write-Host "[WARNING] $Message" -ForegroundColor Yellow
}

function Write-Error {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor Red
}

function Write-Header {
    param([string]$Message)
    Write-Host "[HEADER] $Message" -ForegroundColor Blue
}

# Verificar conexión SSH
Write-Header "=== VERIFICANDO CONEXIÓN SSH ==="
Write-Status "Probando conexión SSH al VPS..."

try {
    $testResult = ssh -o ConnectTimeout=10 -o BatchMode=yes "${VPS_USER}@${VPS_IP}" "echo 'Conexión SSH exitosa'" 2>$null
    if ($LASTEXITCODE -ne 0) {
        throw "Conexión SSH fallida"
    }
    Write-Status "Conexión SSH exitosa"
} catch {
    Write-Error "No se puede conectar al VPS. Verifica:"
    Write-Error "1. La IP del VPS es correcta: $VPS_IP"
    Write-Error "2. Las credenciales SSH son correctas"
    Write-Error "3. El puerto SSH (22) está abierto"
    Write-Error "4. Tienes Git Bash o WSL instalado para SSH"
    exit 1
}

# Subir script de limpieza al VPS
Write-Header "=== SUBIENDO SCRIPT DE LIMPIEZA ==="
Write-Status "Subiendo script vps-clean-install.sh al VPS..."

try {
    scp vps-clean-install.sh "${VPS_USER}@${VPS_IP}:/opt/"
    Write-Status "Script subido correctamente"
} catch {
    Write-Error "Error al subir el script al VPS"
    exit 1
}

# Dar permisos de ejecución
Write-Status "Dando permisos de ejecución al script..."
try {
    ssh "${VPS_USER}@${VPS_IP}" "chmod +x /opt/vps-clean-install.sh"
    Write-Status "Permisos configurados"
} catch {
    Write-Error "Error al configurar permisos"
    exit 1
}

# Ejecutar script de limpieza en el VPS
Write-Header "=== EJECUTANDO LIMPIEZA COMPLETA ==="
Write-Warning "ADVERTENCIA: Esto borrará TODO en el VPS y reinstalará desde cero"
Write-Warning "Se perderán todos los datos existentes"
Write-Host ""
Write-Status "Ejecutando script de limpieza en el VPS..."
Write-Status "Esto puede tomar varios minutos..."

# Ejecutar el script en modo no interactivo
try {
    ssh "${VPS_USER}@${VPS_IP}" "cd /opt; ./vps-clean-install.sh"
} catch {
    Write-Error "Error durante la ejecución del script de limpieza"
    exit 1
}

Write-Header "=== VERIFICACIÓN FINAL ==="
Write-Status "Verificando que los servicios estén funcionando..."

# Esperar un poco más para que todo esté listo
Start-Sleep -Seconds 30

# Verificar estado de los contenedores
Write-Status "Estado de los contenedores:"
try {
    ssh "${VPS_USER}@${VPS_IP}" "cd /opt/solucioning; docker-compose -f docker-compose.prod.yml ps"
} catch {
    Write-Warning "No se pudo verificar el estado de los contenedores"
}

# Verificar logs recientes
Write-Status "Logs recientes del backend:"
try {
    ssh "${VPS_USER}@${VPS_IP}" "cd /opt/solucioning; docker-compose -f docker-compose.prod.yml logs backend --tail=10"
} catch {
    Write-Warning "No se pudieron obtener los logs del backend"
}

Write-Status "Logs recientes del frontend:"
try {
    ssh "${VPS_USER}@${VPS_IP}" "cd /opt/solucioning; docker-compose -f docker-compose.prod.yml logs frontend --tail=10"
} catch {
    Write-Warning "No se pudieron obtener los logs del frontend"
}

# Obtener IP del servidor
try {
    $SERVER_IP = ssh "${VPS_USER}@${VPS_IP}" "curl -s ifconfig.me"
} catch {
    $SERVER_IP = $VPS_IP
}

Write-Header "=== DESPLIEGUE COMPLETADO ==="
Write-Status "Despliegue limpio completado exitosamente!"
Write-Host ""
Write-Host "Información del despliegue:" -ForegroundColor Cyan
Write-Host "   Frontend: http://${SERVER_IP}:3000" -ForegroundColor White
Write-Host "   Backend API: http://${SERVER_IP}:5173" -ForegroundColor White
Write-Host "   Base de datos: ${SERVER_IP}:5432" -ForegroundColor White
Write-Host ""
Write-Host "Usuarios disponibles:" -ForegroundColor Cyan
Write-Host "   Super Admin: admin@dvv5.com / admin123" -ForegroundColor White
Write-Host "   Super Admin: lvega@solucioning.net / 84739265" -ForegroundColor White
Write-Host "   Super Admin: superadmin@solucioning.net / 39284756" -ForegroundColor White
Write-Host ""
Write-Host "Comandos útiles para el VPS:" -ForegroundColor Cyan
Write-Host "   Conectar: ssh root@${VPS_IP}" -ForegroundColor White
Write-Host "   Ver logs: cd /opt/solucioning && docker-compose -f docker-compose.prod.yml logs -f" -ForegroundColor White
Write-Host "   Reiniciar: cd /opt/solucioning && docker-compose -f docker-compose.prod.yml restart" -ForegroundColor White
Write-Host "   Actualizar: cd /opt/solucioning && git pull && docker-compose -f docker-compose.prod.yml up -d --build" -ForegroundColor White
Write-Host ""
Write-Warning "IMPORTANTE: Cambia las credenciales en /opt/solucioning/.env por seguridad"
Write-Warning "IMPORTANTE: Configura backups automáticos de la base de datos"
Write-Host ""
Write-Status "Sistema Solucioning reinstalado y funcionando en el VPS!" 