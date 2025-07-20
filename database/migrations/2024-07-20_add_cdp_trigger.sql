-- Migración para agregar trigger automático de CDP
-- Fecha: 2024-07-20
-- Descripción: Crea un trigger que actualiza automáticamente el campo CDP cuando se modifican las horas

-- Función para actualizar CDP automáticamente
CREATE OR REPLACE FUNCTION update_cdp() 
RETURNS TRIGGER AS $$
BEGIN 
    NEW.cdp = CASE 
        WHEN NEW.horas IS NOT NULL AND NEW.horas > 0 
        THEN ROUND((NEW.horas / 38.0) * 100) 
        ELSE 0 
    END;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear trigger para actualizar CDP antes de insertar o actualizar
DROP TRIGGER IF EXISTS trigger_update_cdp ON employees;
CREATE TRIGGER trigger_update_cdp
    BEFORE INSERT OR UPDATE ON employees
    FOR EACH ROW
    EXECUTE FUNCTION update_cdp();

-- Actualizar CDP para todos los empleados existentes que no lo tengan
UPDATE employees 
SET cdp = CASE 
    WHEN horas IS NOT NULL AND horas > 0 
    THEN ROUND((horas / 38.0) * 100) 
    ELSE 0 
END 
WHERE cdp IS NULL OR cdp = 0; 