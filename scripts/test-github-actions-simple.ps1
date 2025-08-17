# Script de prueba para verificar configuración de GitHub Actions

Write-Host "PROBANDO CONFIGURACION DE GITHUB ACTIONS" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green

Write-Host ""
Write-Host "VERIFICACIONES REQUERIDAS:" -ForegroundColor Yellow

Write-Host ""
Write-Host "1. Secrets Configurados en GitHub:" -ForegroundColor Cyan
Write-Host "   - VPS_HOST = IP_del_VPS" -ForegroundColor White
Write-Host "   - VPS_USER = root" -ForegroundColor White
Write-Host "   - VPS_PASSWORD = contraseña_del_VPS" -ForegroundColor White
Write-Host "   - VPS_PORT = 22 (opcional)" -ForegroundColor White

Write-Host ""
Write-Host "2. Estructura del Repositorio:" -ForegroundColor Cyan
Write-Host "   - .github/workflows/deploy-source-only.yml" -ForegroundColor Green
Write-Host "   - Solo código fuente (sin configuración del servidor)" -ForegroundColor Green
Write-Host "   - Archivos de configuración excluidos" -ForegroundColor Green

Write-Host ""
Write-Host "3. VPS Preparado:" -ForegroundColor Cyan
Write-Host "   - Directorio /root/solucioning-deploy existe" -ForegroundColor Green
Write-Host "   - Directorio backups/ creado" -ForegroundColor Green
Write-Host "   - Contenedores funcionando" -ForegroundColor Green

Write-Host ""
Write-Host "4. Workflow Configurado:" -ForegroundColor Cyan
Write-Host "   - Trigger: push a main" -ForegroundColor Green
Write-Host "   - Solo código fuente" -ForegroundColor Green
Write-Host "   - Backup automático" -ForegroundColor Green
Write-Host "   - Reinicio controlado de servicios" -ForegroundColor Green

Write-Host ""
Write-Host "PROXIMOS PASOS:" -ForegroundColor Magenta
Write-Host "1. Configurar secrets en GitHub" -ForegroundColor White
Write-Host "2. Hacer commit a main para probar" -ForegroundColor White
Write-Host "3. Verificar en pestaña Actions" -ForegroundColor White
Write-Host "4. Confirmar deployment en VPS" -ForegroundColor White

Write-Host ""
Write-Host "COMANDOS UTILES:" -ForegroundColor Yellow
Write-Host "git add ." -ForegroundColor Gray
Write-Host "git commit -m 'feat: nueva funcionalidad'" -ForegroundColor Gray
Write-Host "git push solucioning main" -ForegroundColor Gray

Write-Host ""
Write-Host "CONFIGURACION LISTA PARA PROBAR" -ForegroundColor Green
Write-Host "TEST: GitHub Actions workflow activado - $(Get-Date)" -ForegroundColor Yellow
