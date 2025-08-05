-- Migración corregida para completar la sincronización local
-- Fecha: 2025-01-15

-- 1. Corregir los valores por defecto de vacaciones
ALTER TABLE employees ALTER COLUMN vacaciones_disfrutadas DROP DEFAULT;
ALTER TABLE employees ALTER COLUMN vacaciones_pendientes DROP DEFAULT;

-- 2. Cambiar el tipo de datos de vacaciones
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

-- 3. Establecer los valores por defecto correctos
ALTER TABLE employees ALTER COLUMN vacaciones_disfrutadas SET DEFAULT 0;
ALTER TABLE employees ALTER COLUMN vacaciones_pendientes SET DEFAULT 0;

-- 4. Eliminar la constraint actual de status
ALTER TABLE employees DROP CONSTRAINT IF EXISTS employees_status_check1;
ALTER TABLE employees DROP CONSTRAINT IF EXISTS employees_status_check;

-- 5. Crear la constraint de producción con pendiente_activacion
ALTER TABLE employees ADD CONSTRAINT employees_status_check 
CHECK (status::text = ANY (ARRAY['active'::character varying::text, 'it_leave'::character varying::text, 'company_leave_pending'::character varying::text, 'company_leave_approved'::character varying::text, 'pending_laboral'::character varying::text, 'penalizado'::character varying::text, 'pendiente_activacion'::character varying::text]));

-- 6. Verificar que no hay datos que violen la constraint
-- Si hay datos con status 'pendiente_laboral', cambiarlos a 'pending_laboral'
UPDATE employees SET status = 'pending_laboral' WHERE status = 'pendiente_laboral'; 