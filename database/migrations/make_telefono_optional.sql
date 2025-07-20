-- Migración para hacer el campo teléfono opcional
-- Fecha: 2024-07-20
-- Descripción: Eliminar cualquier restricción NOT NULL del campo telefono si existe

-- Verificar si el campo telefono tiene restricción NOT NULL y eliminarla si existe
DO $$
BEGIN
    -- Verificar si la columna telefono tiene restricción NOT NULL
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'employees' 
        AND column_name = 'telefono' 
        AND is_nullable = 'NO'
    ) THEN
        -- Eliminar la restricción NOT NULL
        ALTER TABLE employees ALTER COLUMN telefono DROP NOT NULL;
        RAISE NOTICE 'Restricción NOT NULL eliminada del campo telefono';
    ELSE
        RAISE NOTICE 'El campo telefono ya es opcional (nullable)';
    END IF;
END $$;

-- Verificar el estado final
SELECT 
    column_name,
    is_nullable,
    data_type,
    character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'employees' 
AND column_name = 'telefono'; 