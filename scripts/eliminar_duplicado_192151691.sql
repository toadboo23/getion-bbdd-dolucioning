-- ELIMINAR REGISTRO DUPLICADO DEL EMPLEADO 192151691

-- 1. Verificar los dos registros duplicados
SELECT 
    id,
    employee_id,
    employee_data->>'nombre' as nombre,
    employee_data->>'apellido' as apellido,
    leave_type as tipo_baja,
    leave_date as fecha_baja,
    status as status_company_leave,
    approved_at as fecha_aprobacion,
    approved_by as aprobado_por,
    leave_requested_at as fecha_solicitud,
    leave_requested_by as solicitado_por,
    created_at,
    updated_at
FROM company_leaves 
WHERE employee_id = '192151691' 
    AND status = 'approved' 
    AND approved_by IS NULL
ORDER BY leave_requested_at DESC;

-- 2. Eliminar el registro más reciente (el que tiene fecha_solicitud más nueva)
DELETE FROM company_leaves 
WHERE id = (
    SELECT id 
    FROM company_leaves 
    WHERE employee_id = '192151691' 
        AND status = 'approved' 
        AND approved_by IS NULL
    ORDER BY leave_requested_at DESC 
    LIMIT 1
);

-- 3. Verificar que solo queda un registro
SELECT 
    id,
    employee_id,
    employee_data->>'nombre' as nombre,
    employee_data->>'apellido' as apellido,
    leave_type as tipo_baja,
    leave_date as fecha_baja,
    status as status_company_leave,
    approved_at as fecha_aprobacion,
    approved_by as aprobado_por,
    leave_requested_at as fecha_solicitud,
    leave_requested_by as solicitado_por,
    'REGISTRO ÚNICO RESTANTE' as estado
FROM company_leaves 
WHERE employee_id = '192151691' 
    AND status = 'approved' 
    AND approved_by IS NULL;
