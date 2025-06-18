-- Initialize PostgreSQL database for Employee Management System
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
  status varchar(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'it_leave', 'company_leave_pending', 'company_leave_approved')),
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
  leave_date date NOT NULL,
  requested_by varchar(255) NOT NULL,
  approved_by varchar(255),
  approved_at timestamp,
  status varchar(50) DEFAULT 'approved',
  created_at timestamp DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp DEFAULT CURRENT_TIMESTAMP
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
INSERT INTO employees (id_glovo, nombre, apellido, telefono, email_glovo, email, status) 
SELECT * FROM (VALUES 
  ('TEST001', 'Juan', 'García', '+34600123456', 'juan.garcia@glovo.com', 'juan.garcia@personal.com', 'active'),
  ('TEST002', 'María', 'López', '+34600654321', 'maria.lopez@glovo.com', 'maria.lopez@personal.com', 'active'),
  ('TEST003', 'Carlos', 'Martín', '+34600789012', 'carlos.martin@glovo.com', 'carlos.martin@personal.com', 'active')
) AS v(id_glovo, nombre, apellido, telefono, email_glovo, email, status)
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

-- Insert sample data
INSERT INTO employees (
    ID_GLOVO, EMAIL_GLOVO, TURNO, NOMBRE, APELLIDO, TELEFONO, EMAIL, 
    HORAS, CIUDAD, DNI_NIE, IBAN, DIRECCION, VEHICULO, NAF, 
    FECHA_ALTA_SEG_SOC, STATUS_BAJA, ESTADO_SS, INFORMADO_HORARIO
) VALUES
('GLV001', 'maria.garcia@glovo.com', 'MAÑANA', 'María', 'García', '+34 612 345 678', 'maria.garcia@email.com',
 40, 'Madrid', '12345678A', 'ES91 2100 0418 4502 0005 1332', 'Calle Mayor 123', 'Coche propio', 'NAF001',
 '2020-01-15', 'ACTIVO', 'ALTA', true),
('GLV002', 'carlos.rodriguez@glovo.com', 'TARDE', 'Carlos', 'Rodríguez', '+34 687 654 321', 'carlos.rodriguez@email.com',
 35, 'Barcelona', 'X1234567B', 'ES76 0075 0130 4806 0158 1234', 'Passeig de Gràcia 456', 'Transporte público', 'NAF002',
 '2021-03-10', 'ACTIVO', 'ALTA', true);

-- Insert sample notifications
INSERT INTO notifications (type, title, message, requested_by, status) VALUES
('system', 'Sistema Iniciado', 'El sistema de gestión de empleados ha sido iniciado correctamente', 'Sistema', 'processed'),
('info', 'Base de Datos Configurada', 'La base de datos PostgreSQL ha sido configurada para el entorno local', 'Sistema', 'processed');

-- Insert default super admin user (password: admin123)
-- Note: In production, this should be changed immediately
INSERT INTO system_users (email, first_name, last_name, password, role, created_by, is_active) 
SELECT * FROM (VALUES 
  ('admin@dvv5.com', 'Super', 'Admin', '$2b$10$8R1QkTQZJZGvKb4vJ7QJrOXYR1QkTQZJZGvKb4vJ7QJrOXYR1QkTQ', 'super_admin', 'SYSTEM', true)
) AS v(email, first_name, last_name, password, role, created_by, is_active)
WHERE NOT EXISTS (SELECT 1 FROM system_users WHERE email = 'admin@dvv5.com');

-- Insert initial audit log for system setup
INSERT INTO audit_logs (user_id, user_role, action, entity_type, entity_id, entity_name, description, ip_address, user_agent)
SELECT * FROM (VALUES 
  ('SYSTEM', 'super_admin', 'system_init', 'database', 'db_init', 'Database Initialization', 'Sistema DVV5 inicializado con tablas de usuarios y logs de auditoría', '127.0.0.1', 'System')
) AS v(user_id, user_role, action, entity_type, entity_id, entity_name, description, ip_address, user_agent)
WHERE NOT EXISTS (SELECT 1 FROM audit_logs WHERE action = 'system_init');