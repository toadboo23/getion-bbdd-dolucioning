# Script de prueba para GitHub Actions
# Última prueba: 17/08/2025 - Verificar que el workflow funciona correctamente

Write-Host "=== PRUEBA GITHUB ACTIONS ==="
Write-Host "Fecha: $(Get-Date)"
Write-Host "Este archivo se usa para probar el deployment automático"
Write-Host "Si ves este mensaje, el deployment funcionó correctamente"
Write-Host "================================="

# Comando de prueba
Write-Host "Estado del repositorio:"
git status --porcelain
