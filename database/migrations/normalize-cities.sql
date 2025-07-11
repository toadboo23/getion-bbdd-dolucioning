-- Script para normalizar ciudades en toda la base de datos
-- Ejecutar este script para unificar el formato de las ciudades en todas las tablas relevantes

-- 1. EMPLOYEES
SELECT 'CIUDADES ANTES DE NORMALIZAR (employees):' as info;
SELECT DISTINCT ciudad FROM employees WHERE ciudad IS NOT NULL ORDER BY ciudad;
UPDATE employees 
SET ciudad = INITCAP(LOWER(ciudad))
WHERE ciudad IS NOT NULL;
SELECT 'CIUDADES DESPUÉS DE NORMALIZAR (employees):' as info;
SELECT DISTINCT ciudad FROM employees WHERE ciudad IS NOT NULL ORDER BY ciudad;

-- 2. SYSTEM_USERS
SELECT 'CIUDADES ANTES DE NORMALIZAR (system_users.assigned_city):' as info;
SELECT DISTINCT assigned_city FROM system_users WHERE assigned_city IS NOT NULL ORDER BY assigned_city;
UPDATE system_users SET assigned_city = INITCAP(LOWER(assigned_city)) WHERE assigned_city IS NOT NULL;
SELECT 'CIUDADES DESPUÉS DE NORMALIZAR (system_users.assigned_city):' as info;
SELECT DISTINCT assigned_city FROM system_users WHERE assigned_city IS NOT NULL ORDER BY assigned_city;

-- Si existe columna ciudad en system_users
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='system_users' AND column_name='ciudad') THEN
        EXECUTE 'UPDATE system_users SET ciudad = INITCAP(LOWER(ciudad)) WHERE ciudad IS NOT NULL;';
    END IF;
END $$;

-- 3. COMPANY_LEAVES (employee_data JSON)
SELECT 'CIUDADES ANTES DE NORMALIZAR (company_leaves.employee_data->ciudad):' as info;
SELECT DISTINCT employee_data->>'ciudad' as ciudad FROM company_leaves WHERE employee_data->>'ciudad' IS NOT NULL ORDER BY ciudad;
UPDATE company_leaves
SET employee_data = jsonb_set(
  employee_data,
  '{ciudad}',
  to_jsonb(INITCAP(LOWER(employee_data->>'ciudad')))
)
WHERE employee_data->>'ciudad' IS NOT NULL;
SELECT 'CIUDADES DESPUÉS DE NORMALIZAR (company_leaves.employee_data->ciudad):' as info;
SELECT DISTINCT employee_data->>'ciudad' as ciudad FROM company_leaves WHERE employee_data->>'ciudad' IS NOT NULL ORDER BY ciudad;

-- 4. IT_LEAVES (si existe campo ciudad)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='it_leaves' AND column_name='ciudad') THEN
        EXECUTE 'UPDATE it_leaves SET ciudad = INITCAP(LOWER(ciudad)) WHERE ciudad IS NOT NULL;';
    END IF;
END $$;

-- Verificación final de ciudades en todas las tablas
SELECT 'VERIFICACIÓN FINAL DE CIUDADES:' as info;
SELECT 'employees' as tabla, ciudad as valor FROM employees WHERE ciudad IS NOT NULL
UNION ALL
SELECT 'system_users', assigned_city FROM system_users WHERE assigned_city IS NOT NULL
UNION ALL
SELECT 'company_leaves', employee_data->>'ciudad' FROM company_leaves WHERE employee_data->>'ciudad' IS NOT NULL
ORDER BY tabla, valor; 