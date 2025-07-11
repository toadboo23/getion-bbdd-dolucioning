-- Script para agregar campo Flota a la tabla employees
-- Ejecutar este script en la base de datos local

-- 1. Agregar columna Flota a la tabla employees
ALTER TABLE employees ADD COLUMN IF NOT EXISTS flota VARCHAR(10);

-- 2. Crear función para generar flota automáticamente
CREATE OR REPLACE FUNCTION generar_flota(city_code VARCHAR(10))
RETURNS VARCHAR(10) AS $$
DECLARE
    siguiente_numero INTEGER;
    flota_generada VARCHAR(10);
BEGIN
    -- Si no hay cityCode, retornar NULL
    IF city_code IS NULL OR city_code = '' THEN
        RETURN NULL;
    END IF;
    
    -- Obtener el siguiente número disponible para esta ciudad
    SELECT COALESCE(MAX(CAST(SUBSTRING(flota FROM LENGTH(city_code) + 1) AS INTEGER)), 0) + 1
    INTO siguiente_numero
    FROM employees 
    WHERE flota IS NOT NULL 
    AND flota LIKE city_code || '%'
    AND SUBSTRING(flota FROM LENGTH(city_code) + 1) ~ '^[0-9]+$';
    
    -- Generar la flota (ej: MAD1, MAD2, etc.)
    flota_generada := city_code || siguiente_numero::VARCHAR;
    
    RETURN flota_generada;
END;
$$ LANGUAGE plpgsql;

-- 3. Crear trigger para asignar flota automáticamente al insertar/actualizar
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

-- 4. Generar flotas para empleados existentes que no tengan flota
UPDATE employees 
SET flota = generar_flota(citycode)
WHERE flota IS NULL 
AND citycode IS NOT NULL 
AND citycode != '';

-- 5. Mostrar estadísticas de flotas generadas
SELECT 'ESTADÍSTICAS DE FLOTAS:' as info;
SELECT 
    citycode,
    COUNT(*) as total_empleados,
    COUNT(CASE WHEN flota IS NOT NULL THEN 1 END) as con_flota,
    COUNT(CASE WHEN flota IS NULL THEN 1 END) as sin_flota
FROM employees 
GROUP BY citycode 
ORDER BY citycode;

-- 6. Mostrar algunas flotas generadas como ejemplo
SELECT 'EJEMPLOS DE FLOTAS GENERADAS:' as info;
SELECT id_glovo, nombre, citycode, flota 
FROM employees 
WHERE flota IS NOT NULL 
ORDER BY citycode, flota 
LIMIT 10; 