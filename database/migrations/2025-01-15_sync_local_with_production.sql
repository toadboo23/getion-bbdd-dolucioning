-- Migración para sincronizar la estructura local con la de producción
-- Fecha: 2025-01-15
-- Descripción: Sincroniza la estructura de la tabla employees local con la de producción

-- 1. Eliminar constraints únicos que no existen en producción
ALTER TABLE employees DROP CONSTRAINT IF EXISTS employees_new_dni_nie_key;
ALTER TABLE employees DROP CONSTRAINT IF EXISTS employees_new_email_glovo_key;

-- 2. Eliminar índices que no existen en producción
DROP INDEX IF EXISTS idx_employees_created_at;
DROP INDEX IF EXISTS idx_employees_updated_at;

-- 3. Cambiar el tipo de datos de complementaries de text a numeric(10,1)
ALTER TABLE employees ALTER COLUMN complementaries TYPE numeric(10,1) USING 
  CASE 
    WHEN complementaries IS NULL OR complementaries = '' THEN NULL
    ELSE complementaries::numeric(10,1)
  END;

-- 4. Cambiar el tipo de datos de vacaciones_disfrutadas y vacaciones_pendientes
ALTER TABLE employees ALTER COLUMN vacaciones_disfrutadas TYPE numeric(10,2) USING 
  CASE 
    WHEN vacaciones_disfrutadas IS NULL OR vacaciones_disfrutadas = '' THEN 0
    ELSE vacaciones_disfrutadas::numeric(10,2)
  END;

ALTER TABLE employees ALTER COLUMN vacaciones_pendientes TYPE numeric(10,2) USING 
  CASE 
    WHEN vacaciones_pendientes IS NULL OR vacaciones_pendientes = '' THEN 0
    ELSE vacaciones_pendientes::numeric(10,2)
  END;

-- 5. Actualizar los valores por defecto
ALTER TABLE employees ALTER COLUMN vacaciones_disfrutadas SET DEFAULT 0;
ALTER TABLE employees ALTER COLUMN vacaciones_pendientes SET DEFAULT 0;

-- 6. Eliminar la constraint de status actual y crear la de producción
ALTER TABLE employees DROP CONSTRAINT IF EXISTS employees_status_check1;
ALTER TABLE employees DROP CONSTRAINT IF EXISTS employees_status_check;

-- 7. Crear la constraint de producción (sin pendiente_activacion)
ALTER TABLE employees ADD CONSTRAINT employees_status_check 
CHECK (status::text = ANY (ARRAY['active'::character varying::text, 'it_leave'::character varying::text, 'company_leave_pending'::character varying::text, 'company_leave_approved'::character varying::text, 'pending_laboral'::character varying::text, 'penalizado'::character varying::text]));

-- 8. Actualizar valores por defecto de timestamps
ALTER TABLE employees ALTER COLUMN created_at SET DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE employees ALTER COLUMN updated_at SET DEFAULT CURRENT_TIMESTAMP;

-- 9. Verificar que la estructura sea idéntica a producción
-- (Esta migración hace que la estructura local sea idéntica a la de producción) 