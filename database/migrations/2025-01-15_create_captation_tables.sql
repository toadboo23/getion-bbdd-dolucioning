-- Crear tabla para los requerimientos de horas por ciudad
CREATE TABLE IF NOT EXISTS city_hours_requirements (
    id SERIAL PRIMARY KEY,
    ciudad VARCHAR(100) NOT NULL UNIQUE,
    horas_fijas_requeridas INTEGER NOT NULL DEFAULT 0,
    horas_complementarias_requeridas INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(255) NOT NULL,
    updated_by VARCHAR(255)
);

-- Crear tabla para el historial de cambios en requerimientos
CREATE TABLE IF NOT EXISTS city_hours_requirements_history (
    id SERIAL PRIMARY KEY,
    city_requirement_id INTEGER REFERENCES city_hours_requirements(id) ON DELETE CASCADE,
    ciudad VARCHAR(100) NOT NULL,
    horas_fijas_anterior INTEGER,
    horas_fijas_nuevo INTEGER,
    horas_complementarias_anterior INTEGER,
    horas_complementarias_nuevo INTEGER,
    changed_by VARCHAR(255) NOT NULL,
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    motivo_cambio TEXT
);

-- Crear índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_city_hours_requirements_ciudad ON city_hours_requirements(ciudad);
CREATE INDEX IF NOT EXISTS idx_city_hours_history_ciudad ON city_hours_requirements_history(ciudad);
CREATE INDEX IF NOT EXISTS idx_city_hours_history_changed_at ON city_hours_requirements_history(changed_at);

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_city_hours_requirements_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar updated_at
CREATE TRIGGER trigger_update_city_hours_requirements_updated_at
    BEFORE UPDATE ON city_hours_requirements
    FOR EACH ROW
    EXECUTE FUNCTION update_city_hours_requirements_updated_at();

-- Función para calcular horas actuales por ciudad
CREATE OR REPLACE FUNCTION get_city_current_hours(city_name VARCHAR(100))
RETURNS TABLE (
    ciudad VARCHAR(100),
    horas_fijas_actuales INTEGER,
    horas_complementarias_actuales INTEGER,
    total_empleados_activos INTEGER,
    empleados_activos INTEGER,
    empleados_baja_it INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        e.ciudad,
        COALESCE(SUM(CASE WHEN e.status = 'active' THEN e.horas ELSE 0 END), 0) as horas_fijas_actuales,
        COALESCE(SUM(CASE WHEN e.status = 'active' THEN e.complementaries ELSE 0 END), 0) as horas_complementarias_actuales,
        COUNT(*) as total_empleados_activos,
        COUNT(CASE WHEN e.status = 'active' THEN 1 END) as empleados_activos,
        COUNT(CASE WHEN e.status = 'it_leave' THEN 1 END) as empleados_baja_it
    FROM employees e
    WHERE e.ciudad = city_name 
    AND e.status IN ('active', 'it_leave')
    GROUP BY e.ciudad;
END;
$$ LANGUAGE plpgsql;

-- Función para obtener dashboard completo de captación
CREATE OR REPLACE FUNCTION get_captation_dashboard()
RETURNS TABLE (
    ciudad VARCHAR(100),
    horas_fijas_requeridas INTEGER,
    horas_complementarias_requeridas INTEGER,
    horas_fijas_actuales INTEGER,
    horas_complementarias_actuales INTEGER,
    deficit_horas_fijas INTEGER,
    deficit_horas_complementarias INTEGER,
    total_empleados_activos INTEGER,
    empleados_activos INTEGER,
    empleados_baja_it INTEGER,
    porcentaje_cobertura_fijas NUMERIC,
    porcentaje_cobertura_complementarias NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(chr.ciudad, e.ciudad) as ciudad,
        COALESCE(chr.horas_fijas_requeridas, 0) as horas_fijas_requeridas,
        COALESCE(chr.horas_complementarias_requeridas, 0) as horas_complementarias_requeridas,
        COALESCE(SUM(CASE WHEN e.status = 'active' THEN e.horas ELSE 0 END), 0) as horas_fijas_actuales,
        COALESCE(SUM(CASE WHEN e.status = 'active' THEN e.complementaries ELSE 0 END), 0) as horas_complementarias_actuales,
        GREATEST(COALESCE(chr.horas_fijas_requeridas, 0) - COALESCE(SUM(CASE WHEN e.status = 'active' THEN e.horas ELSE 0 END), 0), 0) as deficit_horas_fijas,
        GREATEST(COALESCE(chr.horas_complementarias_requeridas, 0) - COALESCE(SUM(CASE WHEN e.status = 'active' THEN e.complementaries ELSE 0 END), 0), 0) as deficit_horas_complementarias,
        COUNT(*) as total_empleados_activos,
        COUNT(CASE WHEN e.status = 'active' THEN 1 END) as empleados_activos,
        COUNT(CASE WHEN e.status = 'it_leave' THEN 1 END) as empleados_baja_it,
        CASE 
            WHEN COALESCE(chr.horas_fijas_requeridas, 0) > 0 
            THEN ROUND((COALESCE(SUM(CASE WHEN e.status = 'active' THEN e.horas ELSE 0 END), 0)::NUMERIC / chr.horas_fijas_requeridas::NUMERIC) * 100, 2)
            ELSE 0 
        END as porcentaje_cobertura_fijas,
        CASE 
            WHEN COALESCE(chr.horas_complementarias_requeridas, 0) > 0 
            THEN ROUND((COALESCE(SUM(CASE WHEN e.status = 'active' THEN e.complementaries ELSE 0 END), 0)::NUMERIC / chr.horas_complementarias_requeridas::NUMERIC) * 100, 2)
            ELSE 0 
        END as porcentaje_cobertura_complementarias
    FROM employees e
    LEFT JOIN city_hours_requirements chr ON e.ciudad = chr.ciudad
    WHERE e.status IN ('active', 'it_leave')
    GROUP BY chr.ciudad, e.ciudad, chr.horas_fijas_requeridas, chr.horas_complementarias_requeridas
    ORDER BY ciudad;
END;
$$ LANGUAGE plpgsql;

-- Insertar datos iniciales para ciudades existentes
INSERT INTO city_hours_requirements (ciudad, horas_fijas_requeridas, horas_complementarias_requeridas, created_by)
SELECT DISTINCT 
    ciudad, 
    0 as horas_fijas_requeridas, 
    0 as horas_complementarias_requeridas,
    'system' as created_by
FROM employees 
WHERE ciudad IS NOT NULL 
AND ciudad NOT IN (SELECT ciudad FROM city_hours_requirements)
ON CONFLICT (ciudad) DO NOTHING; 