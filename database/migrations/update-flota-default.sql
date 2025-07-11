-- Actualizar función para asignar número 1 por defecto
CREATE OR REPLACE FUNCTION generar_flota(city_code VARCHAR(10))
RETURNS VARCHAR(10) AS $$
DECLARE
    flota_generada VARCHAR(10);
BEGIN
    -- Si no hay cityCode, retornar NULL
    IF city_code IS NULL OR city_code = '' THEN
        RETURN NULL;
    END IF;
    
    -- Siempre asignar el número 1 por defecto
    flota_generada := city_code || '1';
    
    RETURN flota_generada;
END;
$$ LANGUAGE plpgsql;

-- Actualizar todas las flotas existentes para que tengan el número 1
UPDATE employees 
SET flota = citycode || '1'
WHERE citycode IS NOT NULL 
AND citycode != '';

-- Mostrar ejemplos de flotas actualizadas
SELECT 'EJEMPLOS DE FLOTAS CON NÚMERO 1:' as info;
SELECT id_glovo, nombre, citycode, flota 
FROM employees 
WHERE flota IS NOT NULL 
ORDER BY citycode 
LIMIT 10; 