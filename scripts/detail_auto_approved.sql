-- DETALLE COMPLETO DE LAS 74 BAJAS AUTOMÁTICAMENTE APROBADAS

-- 1. Lista completa de las 74 bajas automáticamente aprobadas
SELECT 
    cl.employee_id,
    cl.employee_data->>'nombre' as nombre,
    cl.employee_data->>'apellido' as apellido,
    cl.leave_type as tipo_baja,
    cl.leave_date as fecha_baja,
    cl.status as status_company_leave,
    cl.approved_at as fecha_aprobacion,
    cl.approved_by as aprobado_por,
    cl.leave_requested_at as fecha_solicitud,
    cl.leave_requested_by as solicitado_por,
    e.status as status_employee,
    CASE 
        WHEN cl.approved_by IS NULL THEN 'SIN APROBADOR - ERROR'
        WHEN cl.approved_by = 'system' THEN 'SISTEMA AUTOMÁTICO - ERROR'
        ELSE 'APROBADO MANUALMENTE - CORRECTO'
    END as tipo_aprobacion,
    CASE 
        WHEN cl.leave_requested_at::date = cl.leave_date THEN 'MISMA FECHA - SOSPECHOSO'
        ELSE 'FECHAS DIFERENTES - NORMAL'
    END as analisis_fechas
FROM company_leaves cl
LEFT JOIN employees e ON cl.employee_id = e.id_glovo
WHERE cl.status = 'approved' 
    AND cl.approved_by IS NULL
ORDER BY cl.leave_date DESC, cl.employee_id;

-- 2. Resumen por fecha de las bajas automáticamente aprobadas
SELECT 
    cl.leave_date as fecha_baja,
    COUNT(*) as cantidad_bajas,
    STRING_AGG(cl.leave_type, ', ') as tipos_bajas,
    STRING_AGG(cl.leave_requested_by, ', ') as solicitantes,
    STRING_AGG(cl.employee_id::text, ', ') as ids_empleados
FROM company_leaves cl
WHERE cl.status = 'approved' 
    AND cl.approved_by IS NULL
GROUP BY cl.leave_date
ORDER BY cl.leave_date DESC;

-- 3. Resumen por tipo de baja
SELECT 
    cl.leave_type as tipo_baja,
    COUNT(*) as cantidad,
    STRING_AGG(cl.employee_id::text, ', ') as ids_empleados
FROM company_leaves cl
WHERE cl.status = 'approved' 
    AND cl.approved_by IS NULL
GROUP BY cl.leave_type
ORDER BY cantidad DESC;

-- 4. Resumen por solicitante
SELECT 
    cl.leave_requested_by as solicitante,
    COUNT(*) as cantidad,
    STRING_AGG(cl.employee_id::text, ', ') as ids_empleados
FROM company_leaves cl
WHERE cl.status = 'approved' 
    AND cl.approved_by IS NULL
GROUP BY cl.leave_requested_by
ORDER BY cantidad DESC;

-- 5. Verificar si hay empleados que siguen activos con estas bajas automáticamente aprobadas
SELECT 
    cl.employee_id,
    cl.employee_data->>'nombre' as nombre,
    cl.employee_data->>'apellido' as apellido,
    cl.leave_type as tipo_baja,
    cl.leave_date as fecha_baja,
    cl.leave_requested_at as fecha_solicitud,
    cl.leave_requested_by as solicitado_por,
    e.status as status_employee,
    'CONFLICTO: Baja automáticamente aprobada pero sigue activo' as problema
FROM company_leaves cl
INNER JOIN employees e ON cl.employee_id = e.id_glovo
WHERE cl.status = 'approved' 
    AND cl.approved_by IS NULL
    AND e.status = 'active'
ORDER BY cl.leave_date DESC, cl.employee_id;
