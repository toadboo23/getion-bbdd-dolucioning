-- Migración para corregir horas de empleados en baja empresa
-- Fecha: 2025-07-15
-- Descripción: Guardar las horas originales de empleados en company_leave_approved que no las tienen

-- Actualizar empleados en company_leave_approved que no tienen original_hours
-- Guardar sus horas actuales como original_hours y poner horas a 0
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

-- Log de la migración
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
  'migration_fix_company_leave_hours',
  'migration',
  'fix-company-leave-hours',
  'Migración ejecutada: Corregidas horas de empleados en baja empresa. Se guardaron horas originales y se pusieron horas actuales a 0.',
  '{}',
  '{"migration": "fix-company-leave-hours", "date": "2025-07-15"}',
  CURRENT_TIMESTAMP
); 