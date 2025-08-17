-- BUSCAR EMPLEADOS CONFLICTIVOS: BAJA EMPRESA APROBADA PERO SIGUEN EN EMPLOYEES COMO ACTIVOS

-- Consulta principal: Empleados activos con baja empresa aprobada
SELECT 
    e.id_glovo,
    e.nombre,
    e.apellido,
    e.status as status_employee,
    e.ciudad,
    e.horas,
    cl.employee_id,
    cl.leave_type as tipo_baja,
    cl.leave_date as fecha_baja,
    cl.status as status_company_leave,
    cl.approved_at as fecha_aprobacion,
    cl.approved_by as aprobado_por,
    cl.leave_requested_at as fecha_solicitud,
    cl.leave_requested_by as solicitado_por,
    CASE 
        WHEN cl.status = 'approved' THEN 'CONFLICTO: Baja aprobada pero sigue activo'
        ELSE 'Sin conflicto'
    END as estado_conflicto
FROM employees e
INNER JOIN company_leaves cl ON e.id_glovo = cl.employee_id
WHERE e.status IN ('active', 'activo', 'pending_laboral', 'company_leave_approved')
    AND cl.status = 'approved'
ORDER BY cl.approved_at DESC, e.id_glovo;

-- Resumen de conflictos por tipo de estado en employees
SELECT 
    e.status as status_employee,
    COUNT(*) as cantidad_empleados,
    STRING_AGG(e.id_glovo::text, ', ') as ids_empleados
FROM employees e
INNER JOIN company_leaves cl ON e.id_glovo = cl.employee_id
WHERE e.status IN ('active', 'activo', 'pending_laboral', 'company_leave_approved')
    AND cl.status = 'approved'
GROUP BY e.status
ORDER BY cantidad_empleados DESC;

-- Verificar empleados específicos que mencionaste anteriormente
SELECT 
    e.id_glovo,
    e.nombre,
    e.apellido,
    e.status as status_employee,
    cl.status as status_company_leave,
    cl.approved_at as fecha_aprobacion,
    cl.leave_type as tipo_baja,
    CASE 
        WHEN cl.status = 'approved' AND e.status IN ('active', 'activo', 'pending_laboral', 'company_leave_approved') 
        THEN 'CONFLICTO'
        ELSE 'OK'
    END as estado
FROM employees e
LEFT JOIN company_leaves cl ON e.id_glovo = cl.employee_id
WHERE e.id_glovo IN (
    '186706472',
    '188842035',
    '191725578',
    '203090831',
    '203090965',
    '203091152',
    '203091335',
    '203312685',
    '203509298'
)
ORDER BY e.id_glovo;

-- Verificar todos los empleados con baja empresa aprobada (sin importar su estado en employees)
SELECT 
    cl.employee_id,
    cl.employee_data->>'nombre' as nombre,
    cl.employee_data->>'apellido' as apellido,
    cl.leave_type as tipo_baja,
    cl.leave_date as fecha_baja,
    cl.status as status_company_leave,
    cl.approved_at as fecha_aprobacion,
    cl.approved_by as aprobado_por,
    e.status as status_employee,
    CASE 
        WHEN e.status IS NULL THEN 'NO ESTÁ EN EMPLOYEES'
        WHEN e.status IN ('active', 'activo', 'pending_laboral', 'company_leave_approved') THEN 'CONFLICTO: Sigue activo'
        ELSE 'OK: Ya no está activo'
    END as estado
FROM company_leaves cl
LEFT JOIN employees e ON cl.employee_id = e.id_glovo
WHERE cl.status = 'approved'
ORDER BY cl.approved_at DESC;
