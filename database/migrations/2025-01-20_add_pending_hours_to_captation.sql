-- =====================================================
-- MIGRACIÓN: Agregar horas pendientes al dashboard de captación
-- Fecha: 2025-01-20
-- Descripción: Agregar campo para mostrar horas de empleados con notificaciones pendientes
-- =====================================================

-- Eliminar la función existente primero
DROP FUNCTION IF EXISTS get_captation_dashboard();

-- Actualizar la función get_captation_dashboard para incluir horas pendientes
CREATE OR REPLACE FUNCTION get_captation_dashboard()
RETURNS TABLE (
    ciudad VARCHAR(100),
    horas_fijas_requeridas INTEGER,
    horas_fijas_actuales INTEGER,
    horas_fijas_pendientes INTEGER,
    deficit_horas_fijas INTEGER,
    total_empleados_activos INTEGER,
    empleados_activos INTEGER,
    empleados_baja_it INTEGER,
    porcentaje_cobertura_fijas NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(chr.ciudad, e.ciudad) as ciudad,
        COALESCE(chr.horas_fijas_requeridas, 0) as horas_fijas_requeridas,
        COALESCE(SUM(CASE WHEN e.status = 'active' THEN e.horas ELSE 0 END), 0) as horas_fijas_actuales,
        COALESCE(SUM(CASE WHEN e.status = 'active' AND EXISTS (
            SELECT 1 FROM notifications n 
            WHERE n.metadata->>'employeeId' = e.id_glovo 
            AND n.status IN ('pending', 'pending_laboral', 'pendiente_laboral')
        ) THEN e.horas ELSE 0 END), 0) as horas_fijas_pendientes,
        GREATEST(COALESCE(chr.horas_fijas_requeridas, 0) - COALESCE(SUM(CASE WHEN e.status = 'active' THEN e.horas ELSE 0 END), 0), 0) as deficit_horas_fijas,
        COUNT(*) as total_empleados_activos,
        COUNT(CASE WHEN e.status = 'active' THEN 1 END) as empleados_activos,
        COUNT(CASE WHEN e.status = 'it_leave' THEN 1 END) as empleados_baja_it,
        CASE 
            WHEN COALESCE(chr.horas_fijas_requeridas, 0) > 0 
            THEN ROUND((COALESCE(SUM(CASE WHEN e.status = 'active' THEN e.horas ELSE 0 END), 0)::NUMERIC / chr.horas_fijas_requeridas::NUMERIC) * 100, 2)
            ELSE 0 
        END as porcentaje_cobertura_fijas
    FROM employees e
    LEFT JOIN city_hours_requirements chr ON e.ciudad = chr.ciudad
    WHERE e.status IN ('active', 'it_leave')
    GROUP BY chr.ciudad, e.ciudad, chr.horas_fijas_requeridas
    ORDER BY ciudad;
END;
$$ LANGUAGE plpgsql; 