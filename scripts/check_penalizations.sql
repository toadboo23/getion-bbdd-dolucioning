-- Verificar empleados penalizados actualmente
SELECT 
    id_glovo,
    nombre,
    apellido,
    status,
    penalization_start_date,
    penalization_end_date,
    horas,
    original_hours,
    CASE 
        WHEN penalization_end_date < CURRENT_DATE THEN 'EXPIRADA'
        WHEN penalization_end_date = CURRENT_DATE THEN 'EXPIRA HOY'
        ELSE 'ACTIVA'
    END as estado_penalizacion
FROM employees 
WHERE status = 'penalizado'
ORDER BY penalization_end_date ASC;

-- Verificar penalizaciones que expiran hoy (17/08)
SELECT 
    id_glovo,
    nombre,
    apellido,
    status,
    penalization_start_date,
    penalization_end_date,
    horas,
    original_hours
FROM employees 
WHERE status = 'penalizado' 
    AND penalization_end_date = '2025-08-17'
ORDER BY id_glovo;

-- Verificar penalizaciones que expiraron ayer (16/08) - deberían estar restauradas
SELECT 
    id_glovo,
    nombre,
    apellido,
    status,
    penalization_start_date,
    penalization_end_date,
    horas,
    original_hours
FROM employees 
WHERE penalization_end_date = '2025-08-16'
ORDER BY id_glovo;

-- Resumen de penalizaciones
SELECT 
    'Total empleados penalizados' as descripcion,
    COUNT(*) as cantidad
FROM employees 
WHERE status = 'penalizado'

UNION ALL

SELECT 
    'Penalizaciones que expiran hoy (17/08)' as descripcion,
    COUNT(*) as cantidad
FROM employees 
WHERE status = 'penalizado' 
    AND penalization_end_date = '2025-08-17'

UNION ALL

SELECT 
    'Penalizaciones que expiraron ayer (16/08)' as descripcion,
    COUNT(*) as cantidad
FROM employees 
WHERE penalization_end_date = '2025-08-16'

UNION ALL

SELECT 
    'Penalizaciones expiradas (antes de hoy)' as descripcion,
    COUNT(*) as cantidad
FROM employees 
WHERE status = 'penalizado' 
    AND penalization_end_date < CURRENT_DATE;
