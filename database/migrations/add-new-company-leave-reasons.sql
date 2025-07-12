-- Migración para agregar nuevos motivos de baja empresa
-- Fecha: 2024-12-19
-- Descripción: Agregar 3 nuevos tipos de motivo de baja empresa y campo de comentarios

-- Agregar campo de comentarios a la tabla company_leaves
ALTER TABLE company_leaves 
ADD COLUMN IF NOT EXISTS comments TEXT;

-- Crear un tipo ENUM para los motivos de baja empresa (si no existe)
-- Nota: PostgreSQL no permite modificar ENUMs fácilmente, por lo que usamos VARCHAR con CHECK constraint

-- Agregar constraint para validar los nuevos motivos de baja empresa
-- Los motivos válidos ahora son: 'despido', 'voluntaria', 'nspp', 'anulacion', 'fin_contrato_temporal', 'agotamiento_it', 'otras_causas'
ALTER TABLE company_leaves 
DROP CONSTRAINT IF EXISTS company_leaves_leave_type_check;

ALTER TABLE company_leaves 
ADD CONSTRAINT company_leaves_leave_type_check 
CHECK (leave_type IN ('despido', 'voluntaria', 'nspp', 'anulacion', 'fin_contrato_temporal', 'agotamiento_it', 'otras_causas'));

-- Agregar constraint para asegurar que 'otras_causas' tenga comentarios
ALTER TABLE company_leaves 
ADD CONSTRAINT company_leaves_otras_causas_comments_check 
CHECK (
  (leave_type != 'otras_causas') OR 
  (leave_type = 'otras_causas' AND comments IS NOT NULL AND TRIM(comments) != '')
);

-- Crear índice para mejorar performance en consultas por tipo de baja
CREATE INDEX IF NOT EXISTS idx_company_leaves_leave_type ON company_leaves(leave_type);

-- Comentarios para documentar los nuevos tipos
COMMENT ON COLUMN company_leaves.leave_type IS 'Tipos de baja empresa: despido, voluntaria, nspp, anulacion, fin_contrato_temporal, agotamiento_it, otras_causas';
COMMENT ON COLUMN company_leaves.comments IS 'Comentarios obligatorios cuando leave_type es otras_causas'; 