-- Migración para agregar trigger de límite de horas a 38
-- Fecha: 2024-07-20
-- Descripción: Crea un trigger que limita automáticamente las horas a máximo 38 y calcula el CDP

-- Corregir empleados existentes con más de 38 horas
UPDATE employees SET horas = 38 WHERE horas > 38;

-- Crear función para limitar horas a máximo 38 y calcular CDP
CREATE OR REPLACE FUNCTION limit_hours_to_38() 
RETURNS TRIGGER AS $$
BEGIN 
    -- Si las horas son mayores a 38, limitarlas a 38
    IF NEW.horas > 38 THEN
        NEW.horas = 38;
        RAISE NOTICE 'Empleado %: Horas limitadas de % a 38 (máximo permitido)', NEW.id_glovo, OLD.horas;
    END IF;
    
    -- Calcular CDP automáticamente
    NEW.cdp = CASE 
        WHEN NEW.horas IS NOT NULL AND NEW.horas > 0 
        THEN ROUND((NEW.horas / 38.0) * 100) 
        ELSE 0 
    END;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear trigger para limitar horas antes de insertar o actualizar
DROP TRIGGER IF EXISTS trigger_limit_hours ON employees;
CREATE TRIGGER trigger_limit_hours
    BEFORE INSERT OR UPDATE ON employees
    FOR EACH ROW
    EXECUTE FUNCTION limit_hours_to_38();

-- Verificar que no hay empleados con más de 38 horas
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM employees WHERE horas > 38) THEN
        RAISE EXCEPTION 'Aún existen empleados con más de 38 horas después de la corrección';
    END IF;
END $$; 