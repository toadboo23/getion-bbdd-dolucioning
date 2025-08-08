-- Corregir tipos de datos en las funciones de captación
-- El problema es que SUM() y COUNT() devuelven bigint pero las funciones esperan integer
-- También hay que manejar que horas es integer y complementaries es numeric
-- Incluir empleados con status 'pendiente_activacion' como activos

-- Eliminar funciones existentes
DROP FUNCTION IF EXISTS get_city_current_hours(VARCHAR(100));
DROP FUNCTION IF EXISTS get_captation_dashboard();

-- Recrear función get_city_current_hours con tipos correctos
CREATE OR REPLACE FUNCTION get_city_current_hours(city_name VARCHAR(100))
RETURNS TABLE (
    ciudad VARCHAR(100),
    horas_fijas_actuales BIGINT,
    horas_complementarias_actuales NUMERIC,
    total_empleados_activos BIGINT,
    empleados_activos BIGINT,
    empleados_baja_it BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        e.ciudad,
        COALESCE(SUM(CASE WHEN e.status IN ('active', 'pendiente_activacion') THEN e.horas ELSE 0 END), 0) as horas_fijas_actuales,
        COALESCE(SUM(CASE WHEN e.status IN ('active', 'pendiente_activacion') THEN e.complementaries ELSE 0 END), 0) as horas_complementarias_actuales,
        COUNT(*) as total_empleados_activos,
        COUNT(CASE WHEN e.status IN ('active', 'pendiente_activacion') THEN 1 END) as empleados_activos,
        COUNT(CASE WHEN e.status = 'it_leave' THEN 1 END) as empleados_baja_it
    FROM employees e
    WHERE e.ciudad = city_name 
    AND e.status IN ('active', 'it_leave', 'pendiente_activacion')
    GROUP BY e.ciudad;
END;
$$ LANGUAGE plpgsql;

-- Recrear función get_captation_dashboard con tipos correctos
CREATE OR REPLACE FUNCTION get_captation_dashboard()
RETURNS TABLE (
    ciudad VARCHAR(100),
    horas_fijas_requeridas INTEGER,
    horas_complementarias_requeridas INTEGER,
    horas_fijas_actuales BIGINT,
    horas_complementarias_actuales NUMERIC,
    deficit_horas_fijas BIGINT,
    deficit_horas_complementarias NUMERIC,
    total_empleados_activos BIGINT,
    empleados_activos BIGINT,
    empleados_baja_it BIGINT,
    porcentaje_cobertura_fijas NUMERIC,
    porcentaje_cobertura_complementarias NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(chr.ciudad, e.ciudad) as ciudad,
        COALESCE(chr.horas_fijas_requeridas, 0) as horas_fijas_requeridas,
        COALESCE(chr.horas_complementarias_requeridas, 0) as horas_complementarias_requeridas,
        COALESCE(SUM(CASE WHEN e.status IN ('active', 'pendiente_activacion') THEN e.horas ELSE 0 END), 0) as horas_fijas_actuales,
        COALESCE(SUM(CASE WHEN e.status IN ('active', 'pendiente_activacion') THEN e.complementaries ELSE 0 END), 0) as horas_complementarias_actuales,
        GREATEST(COALESCE(chr.horas_fijas_requeridas, 0) - COALESCE(SUM(CASE WHEN e.status IN ('active', 'pendiente_activacion') THEN e.horas ELSE 0 END), 0), 0) as deficit_horas_fijas,
        GREATEST(COALESCE(chr.horas_complementarias_requeridas, 0) - COALESCE(SUM(CASE WHEN e.status IN ('active', 'pendiente_activacion') THEN e.complementaries ELSE 0 END), 0), 0) as deficit_horas_complementarias,
        COUNT(*) as total_empleados_activos,
        COUNT(CASE WHEN e.status IN ('active', 'pendiente_activacion') THEN 1 END) as empleados_activos,
        COUNT(CASE WHEN e.status = 'it_leave' THEN 1 END) as empleados_baja_it,
        CASE 
            WHEN COALESCE(chr.horas_fijas_requeridas, 0) > 0 
            THEN ROUND((COALESCE(SUM(CASE WHEN e.status IN ('active', 'pendiente_activacion') THEN e.horas ELSE 0 END), 0)::NUMERIC / chr.horas_fijas_requeridas::NUMERIC) * 100, 2)
            ELSE 0 
        END as porcentaje_cobertura_fijas,
        CASE 
            WHEN COALESCE(chr.horas_complementarias_requeridas, 0) > 0 
            THEN ROUND((COALESCE(SUM(CASE WHEN e.status IN ('active', 'pendiente_activacion') THEN e.complementaries ELSE 0 END), 0)::NUMERIC / chr.horas_complementarias_requeridas::NUMERIC) * 100, 2)
            ELSE 0 
        END as porcentaje_cobertura_complementarias
    FROM employees e
    LEFT JOIN city_hours_requirements chr ON e.ciudad = chr.ciudad
    WHERE e.status IN ('active', 'it_leave', 'pendiente_activacion')
    GROUP BY chr.ciudad, e.ciudad, chr.horas_fijas_requeridas, chr.horas_complementarias_requeridas
    ORDER BY ciudad;
END;
$$ LANGUAGE plpgsql; 