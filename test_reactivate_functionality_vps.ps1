# Script para probar la funcionalidad de reactivación en el VPS
Write-Host "=== PRUEBA DE FUNCIONALIDAD DE REACTIVACIÓN EN VPS ===" -ForegroundColor Green

# Verificar que el empleado esté en ambas tablas
Write-Host "`n1. Verificando estado del empleado 203091752..." -ForegroundColor Yellow

# Verificar en employees
$employeesResult = docker exec solucioning_postgres psql -U postgres -d employee_management -c "SELECT id_glovo, nombre, apellido, status FROM employees WHERE id_glovo = '203091752';"
Write-Host "En tabla employees:" -ForegroundColor Cyan
Write-Host $employeesResult

# Verificar en company_leaves
$companyLeavesResult = docker exec solucioning_postgres psql -U postgres -d employee_management -c "SELECT employee_id, employee_data->>'nombre' as nombre, employee_data->>'apellido' as apellido, status, reactivated_at FROM company_leaves WHERE employee_id = '203091752';"
Write-Host "`nEn tabla company_leaves:" -ForegroundColor Cyan
Write-Host $companyLeavesResult

# Verificar que las columnas de reactivación existen
Write-Host "`n2. Verificando columnas de reactivación..." -ForegroundColor Yellow
$columnsResult = docker exec solucioning_postgres psql -U postgres -d employee_management -c "\d company_leaves" | Select-String "reactivated"
Write-Host "Columnas de reactivación encontradas:" -ForegroundColor Cyan
Write-Host $columnsResult

# Verificar que el backend esté funcionando
Write-Host "`n3. Verificando estado del backend..." -ForegroundColor Yellow
$healthResult = curl -s http://localhost:5173/api/health
Write-Host "Health check:" -ForegroundColor Cyan
Write-Host $healthResult

Write-Host "`n=== PRUEBA COMPLETADA ===" -ForegroundColor Green
Write-Host "El empleado 203091752 debería aparecer en /company-leaves con:" -ForegroundColor Yellow
Write-Host "- Fila en color verde" -ForegroundColor Green
Write-Host "- Texto '✅ Activado' en lugar del botón" -ForegroundColor Green
Write-Host "- Sin botón 'Volver a activos'" -ForegroundColor Green

