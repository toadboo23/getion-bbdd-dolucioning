-- Crear función para generar flotas
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