-- Script para probar la restauración automática de penalizaciones
-- Ejecutar este script en la base de datos local

-- 1. Verificar el estado actual del empleado de prueba
SELECT 
    id_glovo, 
    nombre, 
    apellido, 
    horas, 
    original_hours, 
    status, 
    penalization_start_date, 
    penalization_end_date 
FROM employees 
WHERE id_glovo = 'TEST001';

-- 2. Verificar penalizaciones expiradas
SELECT 
    COUNT(*) as total_penalizados,
    COUNT(CASE WHEN penalization_end_date < CURRENT_DATE THEN 1 END) as expiradas,
    COUNT(CASE WHEN penalization_end_date >= CURRENT_DATE THEN 1 END) as activas
FROM employees 
WHERE status = 'penalizado';

-- 3. Mostrar todas las penalizaciones expiradas
SELECT 
    id_glovo, 
    nombre, 
    apellido, 
    horas, 
    original_hours, 
    penalization_end_date,
    CURRENT_DATE as fecha_actual,
    CASE 
        WHEN penalization_end_date < CURRENT_DATE THEN 'EXPIRADA'
        ELSE 'ACTIVA'
    END as estado_penalizacion
FROM employees 
WHERE status = 'penalizado' 
AND penalization_end_date IS NOT NULL
ORDER BY penalization_end_date; 