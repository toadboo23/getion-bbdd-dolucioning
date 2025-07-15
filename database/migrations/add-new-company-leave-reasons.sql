-- Migración para documentar las nuevas causas de baja empresa
-- Fecha: 2025-07-15
-- Descripción: Documentar las causas de baja empresa que están disponibles en el sistema

-- Esta migración documenta las causas de baja empresa que están disponibles:
-- 1. despido - Despido
-- 2. voluntaria - Baja Voluntaria  
-- 3. nspp - NSPP
-- 4. anulacion - Anulación
-- 5. fin_contrato_temporal - Fin de Contrato Temporal
-- 6. agotamiento_it - Agotamiento IT
-- 7. otras_causas - Otras Causas

-- Log de la migración
INSERT INTO audit_logs (
  user_id,
  user_role,
  action,
  entity_type,
  entity_id,
  description,
  old_data,
  new_data,
  created_at
) VALUES (
  'SYSTEM',
  'super_admin',
  'migration_add_company_leave_reasons',
  'migration',
  'add-new-company-leave-reasons',
  'Migración ejecutada: Documentación de causas de baja empresa disponibles en el sistema.',
  '{}',
  '{"migration": "add-new-company-leave-reasons", "date": "2025-07-15", "reasons": ["despido", "voluntaria", "nspp", "anulacion", "fin_contrato_temporal", "agotamiento_it", "otras_causas"]}',
  CURRENT_TIMESTAMP
);

-- Comentario: Las causas de baja empresa están manejadas en el frontend y backend
-- No se requieren cambios en la base de datos ya que el campo leaveType es VARCHAR
-- y puede almacenar cualquier valor de texto. 