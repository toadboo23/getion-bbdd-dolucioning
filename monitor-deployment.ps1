# Script para monitorear el estado del despliegue en el VPS
Write-Host "🔍 Monitoreando el estado del despliegue..." -ForegroundColor Cyan
Write-Host ""

# Verificar si el servidor responde
Write-Host "⏳ Verificando respuesta del servidor: http://69.62.107.86" -ForegroundColor Yellow

try {
    $response = Invoke-WebRequest -Uri "http://69.62.107.86" -UseBasicParsing -TimeoutSec 10
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ Servidor respondiendo correctamente!" -ForegroundColor Green
        Write-Host "Status Code: $($response.StatusCode)" -ForegroundColor Green
        Write-Host "Content Length: $($response.Content.Length) bytes" -ForegroundColor Green
        Write-Host ""
        Write-Host "🎉 ¡Despliegue exitoso! La aplicación está funcionando correctamente." -ForegroundColor Green
        Write-Host "🌐 Puedes acceder a la aplicación en: http://69.62.107.86" -ForegroundColor Green
    }
} catch {
    Write-Host "❌ El servidor no está respondiendo: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "⚠️  Posibles causas:" -ForegroundColor Yellow
    Write-Host "   1. El workflow aún está en ejecución" -ForegroundColor Gray
    Write-Host "   2. Hubo un error en el despliegue" -ForegroundColor Gray
    Write-Host "   3. Los contenedores Docker no se iniciaron correctamente" -ForegroundColor Gray
}

Write-Host ""
Write-Host "📋 Información del Workflow:" -ForegroundColor Cyan
Write-Host "   Repositorio: https://github.com/toadboo23/db_solucioning" -ForegroundColor Gray
Write-Host "   Actions: https://github.com/toadboo23/db_solucioning/actions" -ForegroundColor Gray
Write-Host "   VPS: http://69.62.107.86" -ForegroundColor Gray

Write-Host ""
Write-Host "📝 Próximos pasos:" -ForegroundColor Cyan
Write-Host "   1. Verifica el estado del workflow en GitHub Actions" -ForegroundColor Gray
Write-Host "   2. Si hay errores, revisa los logs del workflow" -ForegroundColor Gray
Write-Host "   3. Si el servidor no responde, verifica los logs del VPS" -ForegroundColor Gray
Write-Host "   4. Una vez funcionando, prueba todas las funcionalidades de la aplicación" -ForegroundColor Gray 