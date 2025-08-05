-- Migración: Sincronizar estructura de employees con producción
-- Fecha: 2025-01-08
-- Objetivo: Actualizar la estructura de la tabla employees para que coincida exactamente con base-produ-0408.sql

-- 1. Ajustar longitudes de campos para coincidir con producción
ALTER TABLE employees ALTER COLUMN telefono TYPE varchar(20);
ALTER TABLE employees ALTER COLUMN citycode TYPE varchar(20);
ALTER TABLE employees ALTER COLUMN dni_nie TYPE varchar(20);
ALTER TABLE employees ALTER COLUMN naf TYPE varchar(20);
ALTER TABLE employees ALTER COLUMN flota TYPE varchar(100);
ALTER TABLE employees ALTER COLUMN ciudad TYPE varchar(100);
ALTER TABLE employees ALTER COLUMN status_baja TYPE varchar(50);
ALTER TABLE employees ALTER COLUMN estado_ss TYPE varchar(50);
ALTER TABLE employees ALTER COLUMN vehiculo TYPE varchar(50);

-- 2. Agregar campos de vacaciones si no existen
ALTER TABLE employees ADD COLUMN IF NOT EXISTS vacaciones_disfrutadas numeric(10,2) DEFAULT 0 NOT NULL;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS vacaciones_pendientes numeric(10,2) DEFAULT 0 NOT NULL;

-- 3. Actualizar restricción CHECK para status para incluir todos los valores válidos
ALTER TABLE employees DROP CONSTRAINT IF EXISTS employees_status_check;
ALTER TABLE employees ADD CONSTRAINT employees_status_check 
  CHECK (status IN ('active', 'it_leave', 'company_leave_pending', 'company_leave_approved', 'pending_laboral', 'penalizado'));

-- 4. Asegurar que los índices existan
CREATE INDEX IF NOT EXISTS idx_employees_ciudad ON employees(ciudad);
CREATE INDEX IF NOT EXISTS idx_employees_status ON employees(status);
CREATE INDEX IF NOT EXISTS idx_employees_nombre ON employees(nombre);

-- 5. Asegurar que la restricción única en dni_nie exista
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'employees_dni_nie_unique' 
        AND conrelid = 'employees'::regclass
    ) THEN
        ALTER TABLE employees ADD CONSTRAINT employees_dni_nie_unique UNIQUE (dni_nie);
    END IF;
END $$; 