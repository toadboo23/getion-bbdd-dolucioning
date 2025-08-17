-- ANÁLISIS DETALLADO DE LOS 70 EMPLEADOS RESTANTES CON BAJAS AUTOMÁTICAMENTE APROBADAS

-- 1. Lista completa de los 70 empleados restantes (excluyendo los 4 ya corregidos)
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
    e.horas,
    CASE 
        WHEN cl.leave_requested_at::date = cl.leave_date THEN 'MISMA_FECHA'
        ELSE 'FECHAS_DIFERENTES'
    END as analisis_fechas,
    CASE 
        WHEN e.status = 'active' THEN 'CONFLICTO_ACTIVO'
        WHEN e.status IS NULL THEN 'YA_ELIMINADO'
        ELSE 'OTRO_ESTADO'
    END as estado_empleado,
    CASE 
        WHEN cl.leave_type = 'voluntaria' THEN 'CORREGIR_A_PENDING'
        WHEN cl.leave_type = 'despido' THEN 'MANTENER_APPROVED'
        WHEN cl.leave_type = 'otras_causas' THEN 'REVISAR_CASO'
        WHEN cl.leave_type = 'anulacion' THEN 'REVISAR_CASO'
        WHEN cl.leave_type = 'nspp' THEN 'REVISAR_CASO'
        ELSE 'REVISAR_CASO'
    END as accion_recomendada,
    CASE 
        WHEN cl.leave_type = 'voluntaria' AND e.status = 'active' THEN 'CORREGIR_BAJA_Y_MANTENER_ACTIVO'
        WHEN cl.leave_type = 'despido' AND e.status = 'active' THEN 'ELIMINAR_DE_EMPLOYEES'
        WHEN cl.leave_type = 'despido' AND e.status IS NULL THEN 'YA_CORRECTO'
        WHEN cl.leave_type = 'otras_causas' AND e.status = 'active' THEN 'REVISAR_CASO_ESPECIFICO'
        WHEN cl.leave_type = 'anulacion' AND e.status = 'active' THEN 'REVISAR_CASO_ESPECIFICO'
        WHEN cl.leave_type = 'nspp' AND e.status = 'active' THEN 'REVISAR_CASO_ESPECIFICO'
        ELSE 'REVISAR_CASO_ESPECIFICO'
    END as accion_detallada
FROM company_leaves cl
LEFT JOIN employees e ON cl.employee_id = e.id_glovo
WHERE cl.status = 'approved' 
    AND cl.approved_by IS NULL
    AND cl.employee_id NOT IN ('201100070', '202845109', '203091752', '202793930')
ORDER BY cl.leave_date DESC, cl.employee_id;

-- 2. Resumen por tipo de acción recomendada
SELECT 
    accion_recomendada,
    COUNT(*) as cantidad,
    STRING_AGG(cl.employee_id::text, ', ') as ids_empleados
FROM (
    SELECT 
        cl.employee_id,
        CASE 
            WHEN cl.leave_type = 'voluntaria' THEN 'CORREGIR_A_PENDING'
            WHEN cl.leave_type = 'despido' THEN 'MANTENER_APPROVED'
            WHEN cl.leave_type = 'otras_causas' THEN 'REVISAR_CASO'
            WHEN cl.leave_type = 'anulacion' THEN 'REVISAR_CASO'
            WHEN cl.leave_type = 'nspp' THEN 'REVISAR_CASO'
            ELSE 'REVISAR_CASO'
        END as accion_recomendada
    FROM company_leaves cl
    WHERE cl.status = 'approved' 
        AND cl.approved_by IS NULL
        AND cl.employee_id NOT IN ('201100070', '202845109', '203091752', '202793930')
) subquery
GROUP BY accion_recomendada
ORDER BY cantidad DESC;

-- 3. Resumen por estado del empleado
SELECT 
    estado_empleado,
    COUNT(*) as cantidad,
    STRING_AGG(cl.employee_id::text, ', ') as ids_empleados
FROM (
    SELECT 
        cl.employee_id,
        CASE 
            WHEN e.status = 'active' THEN 'CONFLICTO_ACTIVO'
            WHEN e.status IS NULL THEN 'YA_ELIMINADO'
            ELSE 'OTRO_ESTADO'
        END as estado_empleado
    FROM company_leaves cl
    LEFT JOIN employees e ON cl.employee_id = e.id_glovo
    WHERE cl.status = 'approved' 
        AND cl.approved_by IS NULL
        AND cl.employee_id NOT IN ('201100070', '202845109', '203091752', '202793930')
) subquery
GROUP BY estado_empleado
ORDER BY cantidad DESC;
