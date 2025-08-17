-- MOVER EMPLEADO 203091752 DE EMPLOYEES A COMPANY_LEAVES

-- 1. Verificar estado actual del empleado 203091752
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
    e.ciudad,
    e.horas
FROM company_leaves cl
LEFT JOIN employees e ON cl.employee_id = e.id_glovo
WHERE cl.employee_id = '203091752';

-- 2. Verificar que la baja está aprobada antes de eliminar
SELECT 
    'Verificando que la baja está aprobada' as accion,
    cl.status as status_baja,
    cl.approved_by as aprobado_por,
    CASE 
        WHEN cl.status = 'approved' THEN 'BAJA APROBADA - Proceder a eliminar'
        ELSE 'BAJA NO APROBADA - No eliminar'
    END as decision
FROM company_leaves cl
WHERE cl.employee_id = '203091752';

-- 3. Eliminar empleado de la tabla employees (solo si la baja está aprobada)
DELETE FROM employees 
WHERE id_glovo = '203091752' 
    AND EXISTS (
        SELECT 1 FROM company_leaves cl 
        WHERE cl.employee_id = '203091752' 
        AND cl.status = 'approved'
    );

-- 4. Verificar que el empleado fue eliminado correctamente
SELECT 
    'Verificación post-eliminación' as accion,
    CASE 
        WHEN EXISTS (SELECT 1 FROM employees WHERE id_glovo = '203091752') THEN 'ERROR: Empleado sigue en employees'
        ELSE 'CORRECTO: Empleado eliminado de employees'
    END as resultado;

-- 5. Verificar que sigue en company_leaves
SELECT 
    cl.employee_id,
    cl.employee_data->>'nombre' as nombre,
    cl.employee_data->>'apellido' as apellido,
    cl.leave_type as tipo_baja,
    cl.leave_date as fecha_baja,
    cl.status as status_company_leave,
    cl.approved_at as fecha_aprobacion,
    cl.approved_by as aprobado_por,
    'EMPLEADO MOVIDO A COMPANY_LEAVES' as estado_actual
FROM company_leaves cl
WHERE cl.employee_id = '203091752';
