-- Migración para actualizar columnas de employees para usar guiones bajos como en el CSV de producción
-- Fecha: 2025-01-15
-- Descripción: Renombrar columnas para que coincidan con el formato del CSV de producción

BEGIN;

-- Crear tabla temporal con la nueva estructura
CREATE TABLE employees_new (
  id_glovo character varying(50) PRIMARY KEY,
  email_glovo character varying(100) UNIQUE,
  turno character varying(50),
  nombre character varying(100) NOT NULL,
  apellido character varying(100),
  telefono character varying(20),
  email character varying(100),
  horas integer,
  cdp integer,
  complementaries text,
  ciudad character varying(100),
  citycode character varying(20),
  dni_nie character varying(20) UNIQUE,
  iban character varying(34),
  direccion character varying(255),
  vehiculo character varying(50),
  naf character varying(20),
  fecha_alta_seg_soc date,
  status_baja character varying(50),
  estado_ss character varying(50),
  informado_horario boolean DEFAULT false,
  cuenta_divilo character varying(100),
  proxima_asignacion_slots date,
  jefe_trafico character varying(100),
  coments_jefe_de_trafico text,
  incidencias text,
  fecha_incidencia date,
  faltas_no_check_in_en_dias integer DEFAULT 0,
  cruce text,
  status character varying(50) NOT NULL DEFAULT 'active',
  penalization_start_date date,
  penalization_end_date date,
  original_hours integer,
  flota character varying(100),
  created_at timestamp without time zone DEFAULT now(),
  updated_at timestamp without time zone DEFAULT now(),
  vacaciones_disfrutadas character varying(10) DEFAULT '0',
  vacaciones_pendientes character varying(10) DEFAULT '0'
);

-- Copiar datos de la tabla antigua a la nueva
INSERT INTO employees_new (
  id_glovo, email_glovo, turno, nombre, apellido, telefono, email, horas, cdp,
  complementaries, ciudad, citycode, dni_nie, iban, direccion, vehiculo, naf,
  fecha_alta_seg_soc, status_baja, estado_ss, informado_horario, cuenta_divilo,
  proxima_asignacion_slots, jefe_trafico, coments_jefe_de_trafico, incidencias,
  fecha_incidencia, faltas_no_check_in_en_dias, cruce, status,
  penalization_start_date, penalization_end_date, original_hours, flota,
  created_at, updated_at, vacaciones_disfrutadas, vacaciones_pendientes
)
SELECT 
  idglovo, emailglovo, turno, nombre, apellido, telefono, email, horas, cdp,
  complementaries, ciudad, citycode, dninie, iban, direccion, vehiculo, naf,
  fechaaltasegsoc, statusbaja, estadoss, informadohorario, cuentadivilo,
  proximaasignacionslots, jefetrafico, comentsjefedetrafico, incidencias,
  fechaincidencia, faltasnocheckinendias, cruce, status,
  penalizationstartdate, penalizationenddate, originalhours, flota,
  createdat, updatedat, vacacionesdisfrutadas, vacacionespendientes
FROM employees;

-- Eliminar la tabla antigua
DROP TABLE employees;

-- Renombrar la nueva tabla
ALTER TABLE employees_new RENAME TO employees;

-- Recrear índices
CREATE INDEX idx_employees_ciudad ON employees(ciudad);
CREATE INDEX idx_employees_status ON employees(status);
CREATE INDEX idx_employees_nombre ON employees(nombre);
CREATE INDEX idx_employees_created_at ON employees(created_at);
CREATE INDEX idx_employees_updated_at ON employees(updated_at);

-- Recrear constraint de status
ALTER TABLE employees ADD CONSTRAINT employees_status_check1 
CHECK (status::text = ANY (ARRAY['active'::character varying, 'it_leave'::character varying, 'company_leave_pending'::character varying, 'company_leave_approved'::character varying, 'pending_laboral'::character varying, 'pendiente_laboral'::character varying, 'penalizado'::character varying, 'pendiente_activacion'::character varying]::text[]));

COMMIT; 