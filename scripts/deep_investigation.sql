-- INVESTIGACIÓN PROFUNDA: PROBLEMA DE BAJAS AUTOMÁTICAMENTE APROBADAS

-- 1. Verificar empleado 201100070 en detalle
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
    CASE 
        WHEN cl.leave_requested_at::date = cl.leave_date THEN 'SOSPECHOSO: Misma fecha'
        ELSE 'NORMAL: Fechas diferentes'
    END as analisis_fechas,
    CASE 
        WHEN cl.leave_requested_at::date = cl.leave_date AND cl.status = 'approved' THEN 'ERROR: Aprobada automáticamente'
        WHEN cl.status = 'pending' THEN 'CORRECTO: Pendiente'
        WHEN cl.status = 'approved' AND cl.approved_by IS NOT NULL THEN 'CORRECTO: Aprobada manualmente'
        ELSE 'REVISAR'
    END as analisis_estado
FROM company_leaves cl
WHERE cl.employee_id = '201100070';

-- 2. Buscar patrones de bajas automáticamente aprobadas
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
    CASE 
        WHEN cl.leave_requested_at::date = cl.leave_date AND cl.status = 'approved' THEN 'ERROR: Aprobada automáticamente'
        ELSE 'NORMAL'
    END as problema
FROM company_leaves cl
WHERE cl.leave_requested_at::date = cl.leave_date 
    AND cl.status = 'approved'
    AND cl.approved_by IS NULL
ORDER BY cl.leave_date DESC;

-- 3. Verificar todos los empleados conflictivos con este patrón
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
        WHEN cl.leave_requested_at::date = cl.leave_date AND cl.status = 'approved' AND cl.approved_by IS NULL THEN 'ERROR: Aprobada automáticamente'
        WHEN cl.status = 'approved' AND cl.approved_by IS NOT NULL THEN 'CORRECTO: Aprobada manualmente'
        WHEN cl.status = 'pending' THEN 'CORRECTO: Pendiente'
        ELSE 'REVISAR'
    END as analisis
FROM company_leaves cl
LEFT JOIN employees e ON cl.employee_id = e.id_glovo
WHERE cl.employee_id IN (
    '201100070',
    '202793930', 
    '202845109',
    '203091752'
)
ORDER BY cl.employee_id;

-- 4. Estadísticas de bajas por tipo de aprobación
SELECT 
    cl.status as status_company_leave,
    cl.approved_by as aprobado_por,
    COUNT(*) as cantidad,
    STRING_AGG(cl.employee_id::text, ', ') as ids_empleados
FROM company_leaves cl
WHERE cl.status = 'approved'
GROUP BY cl.status, cl.approved_by
ORDER BY cantidad DESC;

-- 5. Verificar si hay bajas con approved_by NULL pero status approved
SELECT 
    COUNT(*) as total_bajas_aprobadas_sin_aprobador,
    STRING_AGG(cl.employee_id::text, ', ') as ids_empleados
FROM company_leaves cl
WHERE cl.status = 'approved' 
    AND cl.approved_by IS NULL;
