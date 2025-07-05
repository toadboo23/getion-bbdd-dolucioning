# Script de PowerShell para automatizar SSH con contraseña
# Usa expect-like functionality para Windows

param(
    [string]$Command,
    [string]$VPS_IP = "69.62.107.86",
    [string]$VPS_USER = "root",
    [string]$VPS_PASSWORD = "Patoloco2323@@"
)

function Invoke-SSHWithPassword {
    param(
        [string]$Command,
        [string]$VPS_IP,
        [string]$VPS_USER,
        [string]$VPS_PASSWORD
    )
    
    # Crear un script temporal que use expect-like functionality
    $expectScript = @"
#!/usr/bin/expect -f
set timeout 30
spawn ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null $VPS_USER@$VPS_IP
expect "password:"
send "$VPS_PASSWORD\r"
expect "$ "
send "$Command\r"
expect "$ "
send "exit\r"
expect eof
"@
    
    # Guardar el script temporal
    $expectScript | Out-File -FilePath "temp_expect.exp" -Encoding ASCII
    
    # Ejecutar expect (si está disponible)
    try {
        & expect temp_expect.exp
    } catch {
        Write-Host "Expect no está disponible. Usando método alternativo..." -ForegroundColor Yellow
        # Método alternativo usando PowerShell
        $process = Start-Process -FilePath "ssh" -ArgumentList "-o", "StrictHostKeyChecking=no", "-o", "UserKnownHostsFile=/dev/null", "${VPS_USER}@${VPS_IP}" -NoNewWindow -PassThru -RedirectStandardInput -RedirectStandardOutput -RedirectStandardError
        Start-Sleep -Seconds 2
        $process.StandardInput.WriteLine($VPS_PASSWORD)
        $process.StandardInput.WriteLine($Command)
        $process.StandardInput.WriteLine("exit")
        $process.WaitForExit()
        $output = $process.StandardOutput.ReadToEnd()
        $errorOutput = $process.StandardError.ReadToEnd()
        Write-Host $output
        if ($errorOutput) { Write-Host $errorOutput -ForegroundColor Red }
    } finally {
        # Limpiar archivo temporal
        Remove-Item "temp_expect.exp" -ErrorAction SilentlyContinue
    }
}

# Función principal
if ($Command) {
    Write-Host "Ejecutando comando remoto: $Command" -ForegroundColor Green
    Invoke-SSHWithPassword -Command $Command -VPS_IP $VPS_IP -VPS_USER $VPS_USER -VPS_PASSWORD $VPS_PASSWORD
} else {
    Write-Host "Uso: .\ssh-automated.ps1 -Command 'comando_a_ejecutar'" -ForegroundColor Yellow
    Write-Host "Ejemplo: .\ssh-automated.ps1 -Command 'ls -la /opt'" -ForegroundColor Yellow
} 