-- Migración completa para verificar y corregir horas de empleados
-- Fecha: 2025-07-15
-- Descripción: Verifica y corrige las horas de todos los empleados en estados que requieren horas originales

-- 1. Corregir empleados en baja IT que no tienen original_hours o tienen horas > 0
UPDATE employees 
SET 
  original_hours = CASE 
    WHEN original_hours IS NULL THEN horas 
    ELSE original_hours 
  END,
  horas = 0,
  updated_at = CURRENT_TIMESTAMP
WHERE 
  status = 'it_leave' 
  AND (original_hours IS NULL OR horas > 0);

-- 2. Corregir empleados en baja empresa que no tienen original_hours o tienen horas > 0
UPDATE employees 
SET 
  original_hours = CASE 
    WHEN original_hours IS NULL THEN horas 
    ELSE original_hours 
  END,
  horas = 0,
  updated_at = CURRENT_TIMESTAMP
WHERE 
  status = 'company_leave_approved' 
  AND (original_hours IS NULL OR horas > 0);

-- 3. Corregir empleados penalizados que no tienen original_hours o tienen horas > 0
UPDATE employees 
SET 
  original_hours = CASE 
    WHEN original_hours IS NULL THEN horas 
    ELSE original_hours 
  END,
  horas = 0,
  updated_at = CURRENT_TIMESTAMP
WHERE 
  status = 'penalizado' 
  AND (original_hours IS NULL OR horas > 0);

-- 4. Crear un resumen de las correcciones realizadas
WITH corrections_summary AS (
  SELECT 
    status,
    COUNT(*) as total_employees,
    COUNT(CASE WHEN original_hours IS NOT NULL AND horas = 0 THEN 1 END) as correct_employees,
    COUNT(CASE WHEN original_hours IS NULL OR horas > 0 THEN 1 END) as incorrect_employees
  FROM employees 
  WHERE status IN ('it_leave', 'company_leave_approved', 'penalizado')
  GROUP BY status
)
SELECT 
  status,
  total_employees,
  correct_employees,
  incorrect_employees,
  CASE 
    WHEN total_employees > 0 THEN 
      ROUND((correct_employees::numeric / total_employees * 100)::numeric, 2)
    ELSE 0 
  END as percentage_correct
FROM corrections_summary
ORDER BY status;

-- 5. Log de la migración con detalles
INSERT INTO audit_logs (
  user_id,
  user_role,
  action,
  entity_type,
  entity_id,
  description,
  old_data,
  new_data,
  created_at
) VALUES (
  'SYSTEM',
  'super_admin',
  'migration_verify_all_employee_hours',
  'migration',
  'verify-all-employee-hours',
  'Migración ejecutada: Verificación y corrección completa de horas de empleados en baja IT, baja empresa y penalizados.',
  '{}',
  '{"migration": "verify-all-employee-hours", "date": "2025-07-15", "description": "Verificación completa de horas de empleados"}',
  CURRENT_TIMESTAMP
);

-- 6. Mostrar resumen final de empleados por estado
SELECT 
  status,
  COUNT(*) as total,
  COUNT(CASE WHEN original_hours IS NOT NULL THEN 1 END) as with_original_hours,
  COUNT(CASE WHEN horas = 0 THEN 1 END) as with_zero_hours,
  COUNT(CASE WHEN original_hours IS NOT NULL AND horas = 0 THEN 1 END) as correctly_configured
FROM employees 
WHERE status IN ('it_leave', 'company_leave_approved', 'penalizado')
GROUP BY status
ORDER BY status; 