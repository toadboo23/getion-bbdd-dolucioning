-- CORREGIR ESTADO DE BAJA DEL EMPLEADO 201100070

-- 1. Verificar estado actual del empleado 201100070
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
    e.status as status_employee
FROM company_leaves cl
LEFT JOIN employees e ON cl.employee_id = e.id_glovo
WHERE cl.employee_id = '201100070';

-- 2. Corregir el estado de la baja de 'approved' a 'pending'
UPDATE company_leaves 
SET 
    status = 'pending',
    approved_at = NULL,
    approved_by = NULL
WHERE employee_id = '201100070' 
    AND status = 'approved' 
    AND approved_by IS NULL;

-- 3. Verificar que el cambio se aplicó correctamente
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
    'CORREGIDO: Ahora está en pending' as estado_actual
FROM company_leaves cl
LEFT JOIN employees e ON cl.employee_id = e.id_glovo
WHERE cl.employee_id = '201100070';
