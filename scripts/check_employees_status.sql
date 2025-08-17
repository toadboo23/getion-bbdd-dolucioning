-- Verificar estado de empleados
SELECT status, COUNT(*) as cantidad 
FROM employees 
GROUP BY status 
ORDER BY cantidad DESC;

-- Verificar empleados con pending_laboral
SELECT id_glovo, nombre, apellido, status, created_at, updated_at
FROM employees 
WHERE status = 'pending_laboral'
ORDER BY updated_at DESC;

-- Verificar empleados con company_leave_approved
SELECT id_glovo, nombre, apellido, status, created_at, updated_at
FROM employees 
WHERE status = 'company_leave_approved'
ORDER BY updated_at DESC;

-- Verificar empleados específicos que mencionaste
SELECT id_glovo, nombre, apellido, status, created_at, updated_at
FROM employees 
WHERE id_glovo IN (
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
ORDER BY id_glovo;
