-- Verificar empleados con pending_laboral y su estado en company_leaves
SELECT 
    e.id_glovo,
    e.nombre,
    e.apellido,
    e.status as status_employee,
    cl.employee_id,
    cl.status as status_company_leave,
    cl.leave_type,
    cl.leave_date,
    cl.approved_at,
    cl.approved_by
FROM employees e
LEFT JOIN company_leaves cl ON e.id_glovo = cl.employee_id
WHERE e.status = 'pending_laboral'
ORDER BY e.id_glovo;
