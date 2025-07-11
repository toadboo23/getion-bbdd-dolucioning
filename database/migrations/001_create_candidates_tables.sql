-- =====================================================
-- MIGRACIÓN: Crear tablas de candidatos y comentarios
-- Fecha: 2024-01-10
-- Descripción: Sistema completo de captación de candidatos
-- =====================================================

-- Crear enum para estados de candidatos
CREATE TYPE candidate_state AS ENUM (
  'nuevo',
  'contactado', 
  'no_contactado',
  'en_proceso_seleccion',
  'entrevistado',
  'aprobado',
  'rechazado',
  'contratado',
  'descartado',
  'en_espera'
);

-- Crear enum para tipos de comentarios
CREATE TYPE comment_type AS ENUM (
  'llamada',
  'email',
  'entrevista',
  'whatsapp',
  'observacion',
  'seguimiento',
  'otro'
);

-- Tabla principal de candidatos
CREATE TABLE candidates (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  apellido VARCHAR(100) NOT NULL,
  dni_nie VARCHAR(20) UNIQUE NOT NULL,
  telefono VARCHAR(20) NOT NULL,
  email VARCHAR(255) NOT NULL,
  estado candidate_state DEFAULT 'nuevo' NOT NULL,
  direccion TEXT,
  ciudad VARCHAR(100),
  experiencia TEXT,
  observaciones TEXT,
  fuente VARCHAR(50),
  created_by VARCHAR(100) NOT NULL,
  updated_by VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de comentarios de candidatos
CREATE TABLE candidate_comments (
  id SERIAL PRIMARY KEY,
  candidate_id INTEGER NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  tipo comment_type NOT NULL,
  comentario TEXT NOT NULL,
  created_by VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- ÍNDICES PARA OPTIMIZACIÓN
-- =====================================================

-- Índices para búsquedas frecuentes
CREATE INDEX idx_candidates_estado ON candidates(estado);
CREATE INDEX idx_candidates_ciudad ON candidates(ciudad);
CREATE INDEX idx_candidates_email ON candidates(email);
CREATE INDEX idx_candidates_dni_nie ON candidates(dni_nie);
CREATE INDEX idx_candidates_created_at ON candidates(created_at);
CREATE INDEX idx_candidates_created_by ON candidates(created_by);

-- Índice compuesto para filtros combinados
CREATE INDEX idx_candidates_estado_ciudad ON candidates(estado, ciudad);

-- Índices para comentarios
CREATE INDEX idx_candidate_comments_candidate_id ON candidate_comments(candidate_id);
CREATE INDEX idx_candidate_comments_tipo ON candidate_comments(tipo);
CREATE INDEX idx_candidate_comments_created_at ON candidate_comments(created_at);

-- Índice de texto completo para búsquedas
CREATE INDEX idx_candidates_search ON candidates USING gin(
  to_tsvector('spanish', nombre || ' ' || apellido || ' ' || COALESCE(observaciones, ''))
);

-- =====================================================
-- TRIGGERS PARA MANTENIMIENTO AUTOMÁTICO
-- =====================================================

-- Trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_candidates_updated_at 
  BEFORE UPDATE ON candidates 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- VISTAS PARA CONSULTAS FRECUENTES
-- =====================================================

-- Vista para estadísticas de candidatos por estado
CREATE VIEW candidate_stats_by_state AS
SELECT 
  estado,
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '30 days') as nuevos_30_dias
FROM candidates 
GROUP BY estado
ORDER BY total DESC;

-- Vista para estadísticas por ciudad
CREATE VIEW candidate_stats_by_city AS
SELECT 
  ciudad,
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE estado = 'nuevo') as nuevos,
  COUNT(*) FILTER (WHERE estado = 'contactado') as contactados,
  COUNT(*) FILTER (WHERE estado = 'contratado') as contratados
FROM candidates 
WHERE ciudad IS NOT NULL
GROUP BY ciudad
ORDER BY total DESC;

-- Vista para candidatos con último comentario
CREATE VIEW candidates_with_last_comment AS
SELECT 
  c.*,
  cc.tipo as ultimo_comentario_tipo,
  cc.comentario as ultimo_comentario,
  cc.created_at as ultimo_comentario_fecha
FROM candidates c
LEFT JOIN LATERAL (
  SELECT tipo, comentario, created_at
  FROM candidate_comments cc2
  WHERE cc2.candidate_id = c.id
  ORDER BY created_at DESC
  LIMIT 1
) cc ON true;

-- =====================================================
-- FUNCIONES UTILITARIAS
-- =====================================================

-- Función para buscar candidatos por texto
CREATE OR REPLACE FUNCTION search_candidates(search_term TEXT)
RETURNS TABLE (
  id INTEGER,
  nombre VARCHAR(100),
  apellido VARCHAR(100),
  email VARCHAR(255),
  estado candidate_state,
  ciudad VARCHAR(100),
  similarity REAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    c.nombre,
    c.apellido,
    c.email,
    c.estado,
    c.ciudad,
    GREATEST(
      similarity(c.nombre || ' ' || c.apellido, search_term),
      similarity(c.email, search_term),
      similarity(c.dni_nie, search_term)
    ) as similarity
  FROM candidates c
  WHERE 
    c.nombre ILIKE '%' || search_term || '%' OR
    c.apellido ILIKE '%' || search_term || '%' OR
    c.email ILIKE '%' || search_term || '%' OR
    c.dni_nie ILIKE '%' || search_term || '%'
  ORDER BY similarity DESC;
END;
$$ LANGUAGE plpgsql;

-- Función para obtener estadísticas generales
CREATE OR REPLACE FUNCTION get_candidate_stats()
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'total', (SELECT COUNT(*) FROM candidates),
    'nuevos', (SELECT COUNT(*) FROM candidates WHERE estado = 'nuevo'),
    'contactados', (SELECT COUNT(*) FROM candidates WHERE estado = 'contactado'),
    'contratados', (SELECT COUNT(*) FROM candidates WHERE estado = 'contratado'),
    'por_estado', (
      SELECT json_object_agg(estado, total)
      FROM candidate_stats_by_state
    ),
    'por_ciudad', (
      SELECT json_object_agg(ciudad, total)
      FROM candidate_stats_by_city
    )
  ) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- COMENTARIOS Y DOCUMENTACIÓN
-- =====================================================

COMMENT ON TABLE candidates IS 'Tabla principal de candidatos para el sistema de captación';
COMMENT ON COLUMN candidates.estado IS 'Estado actual del candidato en el proceso de selección';
COMMENT ON COLUMN candidates.fuente IS 'Origen del candidato (Indeed, LinkedIn, etc.)';

COMMENT ON TABLE candidate_comments IS 'Comentarios y seguimiento de candidatos';
COMMENT ON COLUMN candidate_comments.tipo IS 'Tipo de interacción o comentario';

-- =====================================================
-- FIN DE MIGRACIÓN
-- ===================================================== 