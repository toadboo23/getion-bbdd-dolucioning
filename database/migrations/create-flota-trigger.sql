-- Crear trigger para asignar flota automáticamente
CREATE OR REPLACE FUNCTION trg_asignar_flota()
RETURNS TRIGGER AS $$
BEGIN
    -- Solo asignar flota si no tiene una y tiene cityCode
    IF NEW.flota IS NULL AND NEW.citycode IS NOT NULL AND NEW.citycode != '' THEN
        NEW.flota := generar_flota(NEW.citycode);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear el trigger
DROP TRIGGER IF EXISTS trg_employees_asignar_flota ON employees;
CREATE TRIGGER trg_employees_asignar_flota
BEFORE INSERT OR UPDATE ON employees
FOR EACH ROW
EXECUTE FUNCTION trg_asignar_flota(); 