-- Migración para agregar 'pendiente_activacion' a la constraint de producción
-- Fecha: 2025-01-15
-- Descripción: Agrega el estado 'pendiente_activacion' a la constraint de producción

-- 1. Eliminar la constraint actual de producción
ALTER TABLE employees DROP CONSTRAINT IF EXISTS employees_status_check;

-- 2. Crear la nueva constraint que incluye 'pendiente_activacion'
ALTER TABLE employees ADD CONSTRAINT employees_status_check 
CHECK (status::text = ANY (ARRAY['active'::character varying::text, 'it_leave'::character varying::text, 'company_leave_pending'::character varying::text, 'company_leave_approved'::character varying::text, 'pending_laboral'::character varying::text, 'penalizado'::character varying::text, 'pendiente_activacion'::character varying::text]));

-- 3. Verificar que la constraint se aplicó correctamente
-- SELECT conname, pg_get_constraintdef(oid) FROM pg_constraint WHERE conname = 'employees_status_check'; 