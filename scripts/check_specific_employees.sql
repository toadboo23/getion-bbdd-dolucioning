-- VERIFICAR ESTADO ESPECÍFICO DE BAJAS EMPRESA DE EMPLEADOS CONFLICTIVOS

-- Verificar estado detallado de las bajas empresa para los 4 empleados conflictivos
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
        WHEN cl.status = 'pending' THEN 'PENDIENTE - Puede estar activo'
        WHEN cl.status = 'approved' THEN 'APROBADA - No debería estar activo'
        WHEN cl.status = 'rejected' THEN 'RECHAZADA - Puede estar activo'
        ELSE 'OTRO ESTADO'
    END as interpretacion
FROM company_leaves cl
LEFT JOIN employees e ON cl.employee_id = e.id_glovo
WHERE cl.employee_id IN (
    '201100070',
    '202793930', 
    '202845109',
    '203091752'
)
ORDER BY cl.employee_id;

-- Verificar si hay múltiples registros de baja para el mismo empleado
SELECT 
    cl.employee_id,
    cl.employee_data->>'nombre' as nombre,
    cl.employee_data->>'apellido' as apellido,
    COUNT(*) as cantidad_bajas,
    STRING_AGG(cl.status, ', ') as estados_bajas,
    STRING_AGG(cl.leave_type, ', ') as tipos_bajas,
    STRING_AGG(cl.leave_date::text, ', ') as fechas_bajas
FROM company_leaves cl
WHERE cl.employee_id IN (
    '201100070',
    '202793930', 
    '202845109',
    '203091752'
)
GROUP BY cl.employee_id, cl.employee_data->>'nombre', cl.employee_data->>'apellido'
ORDER BY cl.employee_id;

-- Verificar solo empleados que realmente tienen baja APROBADA y siguen activos
SELECT 
    e.id_glovo,
    e.nombre,
    e.apellido,
    e.status as status_employee,
    e.ciudad,
    e.horas,
    cl.leave_type as tipo_baja,
    cl.leave_date as fecha_baja,
    cl.status as status_company_leave,
    cl.approved_at as fecha_aprobacion,
    cl.approved_by as aprobado_por,
    'CONFLICTO REAL: Baja aprobada pero sigue activo' as estado_conflicto
FROM employees e
INNER JOIN company_leaves cl ON e.id_glovo = cl.employee_id
WHERE e.status = 'active'
    AND cl.status = 'approved'
    AND cl.employee_id IN (
        '201100070',
        '202793930', 
        '202845109',
        '203091752'
    )
ORDER BY e.id_glovo;
