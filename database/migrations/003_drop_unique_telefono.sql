-- Eliminar la restricción única sobre telefono si existe
ALTER TABLE IF EXISTS candidates DROP CONSTRAINT IF EXISTS candidates_telefono_key; 