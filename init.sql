-- Initialize PostgreSQL database for Solucioning System
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create sessions table for authentication
CREATE TABLE IF NOT EXISTS session (
  sid varchar(255) NOT NULL PRIMARY KEY,
  sess json NOT NULL,
  expire timestamp(6) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_session_expire ON session(expire);

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id varchar(255) PRIMARY KEY,
  email varchar(255) UNIQUE NOT NULL,
  "firstName" varchar(255) NOT NULL,
  "lastName" varchar(255) NOT NULL,
  role varchar(50) NOT NULL CHECK (role IN ('super_admin', 'admin', 'normal')),
  created_at timestamp DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp DEFAULT CURRENT_TIMESTAMP
);

-- Create employees table
CREATE TABLE IF NOT EXISTS employees (
  id_glovo varchar(50) PRIMARY KEY,
  email_glovo varchar(100) UNIQUE,
  turno varchar(50),
  nombre varchar(100) NOT NULL,
  apellido varchar(100),
  telefono varchar(20),
  email varchar(100),
  horas integer,
  cdp integer, -- Cumplimiento de Horas (porcentaje basado en 38h = 100%)
  complementaries text,
  ciudad varchar(100),
  citycode varchar(20),
  dni_nie varchar(20),
  iban varchar(34),
  direccion varchar(255),
  vehiculo varchar(50),
  naf varchar(20),
  fecha_alta_seg_soc date,
  status_baja varchar(50),
  estado_ss varchar(50),
  informado_horario boolean DEFAULT false,
  cuenta_divilo varchar(100),
  proxima_asignacion_slots date,
  jefe_trafico varchar(100),
  coments_jefe_de_trafico text,
  incidencias text,
  fecha_incidencia date,
  faltas_no_check_in_en_dias integer DEFAULT 0,
  cruce text,
  status varchar(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'it_leave', 'company_leave_pending', 'company_leave_approved', 'pending_laboral', 'penalizado')),
  penalization_start_date date,
  penalization_end_date date,
  original_hours integer,
  flota varchar(100),
  created_at timestamp DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp DEFAULT CURRENT_TIMESTAMP
);

-- Create company_leaves table for historical data
CREATE TABLE IF NOT EXISTS company_leaves (
  id serial PRIMARY KEY,
  employee_id varchar(50) NOT NULL,
  employee_data jsonb NOT NULL,
  leave_type varchar(100) NOT NULL,
  leave_date date NOT NULL,
  leave_requested_at timestamp NOT NULL,
  leave_requested_by varchar(255) NOT NULL,
  approved_by varchar(255),
  approved_at timestamp,
  status varchar(50) DEFAULT 'approved',
  created_at timestamp DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp DEFAULT CURRENT_TIMESTAMP
);

-- Create it_leaves table
CREATE TABLE IF NOT EXISTS it_leaves (
  id serial PRIMARY KEY,
  employee_id varchar(50) NOT NULL,
  leave_type varchar(100) NOT NULL,
  leave_date timestamp NOT NULL,
  requested_at timestamp DEFAULT CURRENT_TIMESTAMP,
  requested_by varchar(255) NOT NULL,
  approved_by varchar(255),
  approved_at timestamp,
  status varchar(50) DEFAULT 'pending',
  created_at timestamp DEFAULT CURRENT_TIMESTAMP
);

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id serial PRIMARY KEY,
  type varchar(100) NOT NULL,
  title varchar(255) NOT NULL,
  message text NOT NULL,
  requested_by varchar(255) NOT NULL,
  status varchar(50) DEFAULT 'pending',
  metadata jsonb,
  processing_date timestamp,
  created_at timestamp DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp DEFAULT CURRENT_TIMESTAMP
);

-- Create system_users table (for user management by super admin)
CREATE TABLE IF NOT EXISTS system_users (
  id serial PRIMARY KEY,
  email varchar(255) UNIQUE NOT NULL,
  first_name varchar(100) NOT NULL,
  last_name varchar(100) NOT NULL,
  password varchar(255) NOT NULL, -- Hashed password
  role varchar(20) NOT NULL CHECK (role IN ('super_admin', 'admin', 'normal')),
  is_active boolean DEFAULT true,
  created_by varchar(255) NOT NULL, -- Email of creator
  last_login timestamp,
  created_at timestamp DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp DEFAULT CURRENT_TIMESTAMP
);

-- Create audit_logs table (for tracking all admin/super_admin actions)
CREATE TABLE IF NOT EXISTS audit_logs (
  id serial PRIMARY KEY,
  user_id varchar(255) NOT NULL, -- Email of user performing action
  user_role varchar(20) NOT NULL CHECK (user_role IN ('super_admin', 'admin')),
  action varchar(100) NOT NULL, -- create_employee, edit_employee, delete_employee, etc.
  entity_type varchar(50) NOT NULL, -- employee, user, notification, etc.
  entity_id varchar(255), -- ID of affected entity
  entity_name varchar(255), -- Name/description for easy reading
  description text NOT NULL, -- Human readable description
  old_data jsonb, -- Previous state (for updates)
  new_data jsonb, -- New state (for creates/updates)
  ip_address varchar(45), -- User's IP
  user_agent text, -- Browser info
  created_at timestamp DEFAULT CURRENT_TIMESTAMP
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_employees_ciudad ON employees(ciudad);
CREATE INDEX IF NOT EXISTS idx_employees_status ON employees(status);
CREATE INDEX IF NOT EXISTS idx_employees_nombre ON employees(nombre);
CREATE INDEX IF NOT EXISTS idx_company_leaves_employee_id ON company_leaves(employee_id);
CREATE INDEX IF NOT EXISTS idx_it_leaves_employee_id ON it_leaves(employee_id);
CREATE INDEX IF NOT EXISTS idx_notifications_status ON notifications(status);

-- Add indexes for new tables
CREATE INDEX IF NOT EXISTS idx_system_users_email ON system_users(email);
CREATE INDEX IF NOT EXISTS idx_system_users_role ON system_users(role);
CREATE INDEX IF NOT EXISTS idx_system_users_is_active ON system_users(is_active);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity_type ON audit_logs(entity_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);

-- Insert test data only if tables are empty
INSERT INTO employees (id_glovo, nombre, apellido, telefono, email_glovo, email, flota, status) 
SELECT * FROM (VALUES 
  ('TEST001', 'Juan', 'García', '+34600123456', 'juan.garcia@glovo.com', 'juan.garcia@personal.com', 'FLOTA1', 'active'),
  ('TEST002', 'María', 'López', '+34600654321', 'maria.lopez@glovo.com', 'maria.lopez@personal.com', 'FLOTA1', 'active'),
  ('TEST003', 'Carlos', 'Martín', '+34600789012', 'carlos.martin@glovo.com', 'carlos.martin@personal.com', 'FLOTA2', 'active')
) AS v(id_glovo, nombre, apellido, telefono, email_glovo, email, flota, status)
WHERE NOT EXISTS (SELECT 1 FROM employees);

-- Migration: Add status column if it doesn't exist (for existing databases)
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'employees' AND column_name = 'status') THEN
        ALTER TABLE employees ADD COLUMN status varchar(50) NOT NULL DEFAULT 'active' 
        CHECK (status IN ('active', 'it_leave', 'company_leave_pending', 'company_leave_approved'));
    END IF;
END $$;

-- Migration: Add created_at and updated_at columns if they don't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'employees' AND column_name = 'created_at') THEN
        ALTER TABLE employees ADD COLUMN created_at timestamp DEFAULT CURRENT_TIMESTAMP;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'employees' AND column_name = 'updated_at') THEN
        ALTER TABLE employees ADD COLUMN updated_at timestamp DEFAULT CURRENT_TIMESTAMP;
    END IF;
END $$;

-- Migration: Fix it_leaves table structure to match schema
DO $$ 
BEGIN 
    -- Add requested_at column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'it_leaves' AND column_name = 'requested_at') THEN
        ALTER TABLE it_leaves ADD COLUMN requested_at timestamp DEFAULT CURRENT_TIMESTAMP;
    END IF;
    
    -- Change leave_date from date to timestamp if it exists as date
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'it_leaves' AND column_name = 'leave_date' AND data_type = 'date') THEN
        ALTER TABLE it_leaves ALTER COLUMN leave_date TYPE timestamp USING leave_date::timestamp;
    END IF;
    
    -- Update status default to 'pending' if column exists with different default
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'it_leaves' AND column_name = 'status') THEN
        ALTER TABLE it_leaves ALTER COLUMN status SET DEFAULT 'pending';
    END IF;
    
    -- Remove updated_at column if it exists (not in schema)
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'it_leaves' AND column_name = 'updated_at') THEN
        ALTER TABLE it_leaves DROP COLUMN updated_at;
    END IF;
END $$;

-- Insert sample data
INSERT INTO employees (
    ID_GLOVO, EMAIL_GLOVO, TURNO, NOMBRE, APELLIDO, TELEFONO, EMAIL, 
    HORAS, CIUDAD, DNI_NIE, IBAN, DIRECCION, VEHICULO, NAF, 
    FECHA_ALTA_SEG_SOC, STATUS_BAJA, ESTADO_SS, INFORMADO_HORARIO, FLOTA
) VALUES
('GLV001', 'maria.garcia@glovo.com', 'MAÑANA', 'María', 'García', '+34 612 345 678', 'maria.garcia@email.com',
 40, 'Madrid', '12345678A', 'ES91 2100 0418 4502 0005 1332', 'Calle Mayor 123', 'Coche propio', 'NAF001',
 '2022-01-10', NULL, 'ALTA', true, 'FLOTA1');

-- Insert sample notifications
INSERT INTO notifications (type, title, message, requested_by, status) VALUES
('system', 'Sistema Iniciado', 'El sistema Solucioning ha sido iniciado correctamente', 'Sistema', 'processed'),
('info', 'Base de Datos Configurada', 'La base de datos PostgreSQL ha sido configurada para el entorno local', 'Sistema', 'processed');

-- Insert production super admin users
INSERT INTO system_users (email, first_name, last_name, password, role, created_by, is_active) 
VALUES 
  ('nmartinez@solucioning.net', 'Nicolas', 'Martinez', '$2b$10$DsYjQKJM/dj1Xqm1iPjlG.NhMxW2XY.CsZ1eOwqsX8WP8SwgXZ/5u', 'super_admin', 'SYSTEM', true),
  ('lvega@solucioning.net', 'Luciana', 'Vega', '$2b$10$uXIrjF2pO/CeY./qT825ruTZOocZ0o7BdpOhGASaBGdaUOncUTaF.', 'super_admin', 'SYSTEM', true)
ON CONFLICT (email) DO NOTHING;

-- Insert additional super admin users
INSERT INTO system_users (email, first_name, last_name, password, role, created_by, is_active) 
VALUES 
  ('lvega@solucioning.net', 'Luciana', 'Vega', '84739265', 'super_admin', 'SYSTEM', true),
  ('superadmin@solucioning.net', 'Super', 'Admin', '39284756', 'super_admin', 'SYSTEM', true)
ON CONFLICT (email) DO NOTHING;

-- Insert admin users for traffic management
INSERT INTO system_users (email, first_name, last_name, password, role, created_by, is_active) 
VALUES 
  ('trafico1@solucioning.net', 'trafico1', 'Admin', '83931493', 'admin', 'SYSTEM', true),
  ('trafico2@solucioning.net', 'trafico2', 'Admin', '69243740', 'admin', 'SYSTEM', true),
  ('trafico3@solucioning.net', 'trafico3', 'Admin', '57442923', 'admin', 'SYSTEM', true),
  ('trafico4@solucioning.net', 'trafico4', 'Admin', '70843610', 'admin', 'SYSTEM', true),
  ('trafico5@solucioning.net', 'trafico5', 'Admin', '44261275', 'admin', 'SYSTEM', true),
  ('trafico6@solucioning.net', 'trafico6', 'Admin', '11002575', 'admin', 'SYSTEM', true),
  ('trafico7@solucioning.net', 'trafico7', 'Admin', '90446835', 'admin', 'SYSTEM', true),
  ('trafico8@solucioning.net', 'trafico8', 'Admin', '61740149', 'admin', 'SYSTEM', true),
  ('trafico9@solucioning.net', 'trafico9', 'Admin', '75117531', 'admin', 'SYSTEM', true),
  ('trafico10@solucioning.net', 'trafico10', 'Admin', '25215238', 'admin', 'SYSTEM', true),
  ('trafico11@solucioning.net', 'trafico11', 'Admin', '10404579', 'admin', 'SYSTEM', true),
  ('trafico12@solucioning.net', 'trafico12', 'Admin', '92143056', 'admin', 'SYSTEM', true),
  ('trafico13@solucioning.net', 'trafico13', 'Admin', '20276604', 'admin', 'SYSTEM', true),
  ('trafico14@solucioning.net', 'trafico14', 'Admin', '10194566', 'admin', 'SYSTEM', true),
  ('trafico15@solucioning.net', 'trafico15', 'Admin', '85264810', 'admin', 'SYSTEM', true),
  ('trafico16@solucioning.net', 'trafico16', 'Admin', '49055073', 'admin', 'SYSTEM', true),
  ('trafico17@solucioning.net', 'trafico17', 'Admin', '46719224', 'admin', 'SYSTEM', true),
  ('trafico18@solucioning.net', 'trafico18', 'Admin', '74772716', 'admin', 'SYSTEM', true),
  ('trafico19@solucioning.net', 'trafico19', 'Admin', '14516355', 'admin', 'SYSTEM', true),
  ('trafico20@solucioning.net', 'trafico20', 'Admin', '98167078', 'admin', 'SYSTEM', true)
ON CONFLICT (email) DO NOTHING;

-- Insert initial audit log for system setup
INSERT INTO audit_logs (user_id, user_role, action, entity_type, entity_id, entity_name, description, ip_address, user_agent)
SELECT * FROM (VALUES 
  ('SYSTEM', 'super_admin', 'system_init', 'database', 'db_init', 'Database Initialization', 'Sistema Solucioning inicializado con tablas de usuarios y logs de auditoría', '127.0.0.1', 'System')
) AS v(user_id, user_role, action, entity_type, entity_id, entity_name, description, ip_address, user_agent)
WHERE NOT EXISTS (SELECT 1 FROM audit_logs WHERE action = 'system_init');

-- Migration: Add unique constraint to dni_nie field to prevent duplicates
DO $$ 
BEGIN 
    -- Check if the unique constraint already exists
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'employees_dni_nie_unique' 
        AND conrelid = 'employees'::regclass
    ) THEN
        -- Add unique constraint to dni_nie field
        ALTER TABLE employees ADD CONSTRAINT employees_dni_nie_unique UNIQUE (dni_nie);
        
        -- Log the migration
        INSERT INTO audit_logs (user_id, user_role, action, entity_type, entity_id, entity_name, description, ip_address, user_agent)
        VALUES ('SYSTEM', 'super_admin', 'migration', 'database', 'employees', 'Employees Table', 'Añadida restricción única al campo dni_nie para prevenir duplicados', '127.0.0.1', 'Migration Script');
    END IF;
END $$;

-- Migration: Update employee status enum to include pending_laboral
DO $$ 
BEGIN 
    -- Update the check constraint for employees status
    ALTER TABLE employees DROP CONSTRAINT IF EXISTS employees_status_check;
    ALTER TABLE employees ADD CONSTRAINT employees_status_check 
    CHECK (status IN ('active', 'it_leave', 'company_leave_pending', 'company_leave_approved', 'pending_laboral', 'penalizado'));
    
    -- Log the migration
    INSERT INTO audit_logs (user_id, user_role, action, entity_type, entity_id, entity_name, description, ip_address, user_agent)
    VALUES ('SYSTEM', 'super_admin', 'migration', 'database', 'employees', 'Employees Table', 'Actualizado enum de status para incluir pending_laboral', '127.0.0.1', 'Migration Script');
END $$;

-- Migration: Add penalization fields to employees table
DO $$ 
BEGIN 
    -- Add penalization_start_date column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'employees' AND column_name = 'penalization_start_date') THEN
        ALTER TABLE employees ADD COLUMN penalization_start_date date;
    END IF;
    
    -- Add penalization_end_date column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'employees' AND column_name = 'penalization_end_date') THEN
        ALTER TABLE employees ADD COLUMN penalization_end_date date;
    END IF;
    
    -- Add original_hours column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'employees' AND column_name = 'original_hours') THEN
        ALTER TABLE employees ADD COLUMN original_hours integer;
    END IF;
    
    -- Log the migration
    INSERT INTO audit_logs (user_id, user_role, action, entity_type, entity_id, entity_name, description, ip_address, user_agent)
    VALUES ('SYSTEM', 'super_admin', 'migration', 'database', 'employees', 'Employees Table', 'Añadidos campos de penalización (fechas y horas originales)', '127.0.0.1', 'Migration Script');
END $$;