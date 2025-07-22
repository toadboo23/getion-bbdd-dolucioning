-- Migración: Agregar campos de vacaciones a employees
-- Fecha: 2024-07-21
 
ALTER TABLE employees ADD COLUMN IF NOT EXISTS vacaciones_disfrutadas numeric(6,2) DEFAULT 0.00;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS vacaciones_pendientes numeric(6,2) DEFAULT 0.00; 