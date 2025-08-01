-- Migración para arreglar el trigger de CDP para empleados penalizados
-- Fecha: 2024-12-19
-- Descripción: Modifica el trigger de CDP para que no modifique el CDP cuando un empleado está penalizado

-- Función para actualizar CDP automáticamente (versión mejorada)
CREATE OR REPLACE FUNCTION update_cdp() 
RETURNS TRIGGER AS $$
BEGIN 
    -- NO modificar CDP si el empleado está penalizado
    IF NEW.status = 'penalizado' THEN
        -- Mantener el CDP actual sin modificarlo
        NEW.cdp = COALESCE(NEW.cdp, OLD.cdp);
        RETURN NEW;
    END IF;
    
    -- Para empleados no penalizados, calcular CDP normalmente
    NEW.cdp = CASE 
        WHEN NEW.horas IS NOT NULL AND NEW.horas > 0 
        THEN ROUND((NEW.horas / 38.0) * 100) 
        ELSE 0 
    END;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- El trigger ya existe, solo se actualiza la función
-- No es necesario recrear el trigger ya que usa la función actualizada 