-- Initialize PostgreSQL database for Employee Management System
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create sessions table for authentication
CREATE TABLE IF NOT EXISTS sessions (
    sid VARCHAR NOT NULL COLLATE "default",
    sess JSON NOT NULL,
    expire TIMESTAMP(6) NOT NULL
);

-- Add index on sessions expire column
CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON sessions (expire);

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR PRIMARY KEY NOT NULL,
    email VARCHAR UNIQUE,
    first_name VARCHAR,
    last_name VARCHAR,
    profile_image_url VARCHAR,
    role VARCHAR DEFAULT 'super_admin',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create employees table with all required fields
CREATE TABLE IF NOT EXISTS employees (
    id SERIAL PRIMARY KEY,
    first_name VARCHAR NOT NULL,
    last_name VARCHAR NOT NULL,
    email VARCHAR,
    phone VARCHAR,
    city VARCHAR,
    dni_nie VARCHAR,
    birth_date DATE,
    nationality VARCHAR,
    naf VARCHAR,
    address TEXT,
    iban VARCHAR,
    vehicle VARCHAR,
    contract_hours VARCHAR,
    contract_type VARCHAR,
    ss_status VARCHAR,
    start_date DATE,
    age INTEGER,
    status VARCHAR DEFAULT 'active',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create company_leaves table (Baja Empresa)
CREATE TABLE IF NOT EXISTS company_leaves (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER,
    first_name VARCHAR,
    last_name VARCHAR,
    email VARCHAR,
    phone VARCHAR,
    city VARCHAR,
    dni_nie VARCHAR,
    birth_date DATE,
    nationality VARCHAR,
    naf VARCHAR,
    address TEXT,
    iban VARCHAR,
    vehicle VARCHAR,
    contract_hours VARCHAR,
    contract_type VARCHAR,
    ss_status VARCHAR,
    start_date DATE,
    age INTEGER,
    leave_type VARCHAR,
    leave_date DATE,
    leave_requested_at TIMESTAMP,
    leave_requested_by VARCHAR,
    approved_at TIMESTAMP DEFAULT NOW(),
    approved_by VARCHAR,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create it_leaves table
CREATE TABLE IF NOT EXISTS it_leaves (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER REFERENCES employees(id),
    leave_type VARCHAR,
    leave_date DATE,
    requested_at TIMESTAMP DEFAULT NOW(),
    requested_by VARCHAR,
    approved_at TIMESTAMP,
    approved_by VARCHAR,
    status VARCHAR DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    type VARCHAR NOT NULL,
    title VARCHAR NOT NULL,
    message TEXT,
    requested_by VARCHAR,
    status VARCHAR DEFAULT 'pending',
    metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Insert sample data
INSERT INTO employees (first_name, last_name, email, phone, city, dni_nie, birth_date, nationality, naf, address, iban, vehicle, contract_hours, contract_type, ss_status, start_date, age, status) VALUES
('María', 'García López', 'maria.garcia@empresa.com', '+34 612 345 678', 'Madrid', '12345678A', '1990-05-15', 'Española', 'NAF001', 'Calle Mayor 123, 28001 Madrid', 'ES91 2100 0418 4502 0005 1332', 'Coche propio', '40 horas/semana', 'Indefinido', 'Alta', '2020-01-15', 34, 'active'),
('Carlos', 'Rodríguez Martín', 'carlos.rodriguez@empresa.com', '+34 687 654 321', 'Barcelona', '87654321B', '1985-08-20', 'Española', 'NAF002', 'Passeig de Gràcia 456, 08007 Barcelona', 'ES76 0075 0130 4806 0158 1234', 'Transporte público', '35 horas/semana', 'Temporal', 'Alta', '2021-03-10', 39, 'active'),
('Ana', 'Martínez Fernández', 'ana.martinez@empresa.com', '+34 654 987 321', 'Valencia', '33445566C', '1988-11-30', 'Española', 'NAF003', 'Avenida del Puerto 789, 46021 Valencia', 'ES12 0182 5555 4400 0123 4567', 'Motocicleta', '40 horas/semana', 'Indefinido', 'Alta', '2019-07-20', 36, 'active'),
('Javier', 'López Sánchez', 'javier.lopez@empresa.com', '+34 678 123 456', 'Sevilla', '99887766D', '1992-02-14', 'Española', 'NAF004', 'Calle Betis 321, 41010 Sevilla', 'ES65 0049 0001 5020 9876 5432', 'Coche propio', '40 horas/semana', 'Indefinido', 'Alta', '2022-01-10', 32, 'active');

-- Insert sample notifications
INSERT INTO notifications (type, title, message, requested_by, status) VALUES
('system', 'Sistema Iniciado', 'El sistema de gestión de empleados ha sido iniciado correctamente', 'Sistema', 'processed'),
('info', 'Base de Datos Configurada', 'La base de datos PostgreSQL ha sido configurada para el entorno local', 'Sistema', 'processed');