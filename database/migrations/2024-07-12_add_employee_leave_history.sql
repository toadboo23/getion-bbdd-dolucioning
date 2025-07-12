-- Historial de cambios de bajas (IT y Empresa)
CREATE TABLE IF NOT EXISTS employee_leave_history (
  id serial PRIMARY KEY,
  employee_id varchar(50) NOT NULL,
  leave_type varchar(100) NOT NULL, -- 'it_leave' o 'company_leave'
  motivo_anterior varchar(100),
  motivo_nuevo varchar(100),
  comentarios text,
  fecha_cambio timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  cambiado_por varchar(255) NOT NULL,
  rol_usuario varchar(20) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_employee_leave_history_employee_id ON employee_leave_history(employee_id); 