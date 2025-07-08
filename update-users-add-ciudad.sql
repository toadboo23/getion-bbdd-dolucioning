-- Script para agregar el campo ciudad a la tabla system_users
-- Ejecutar este script para actualizar la estructura de la base de datos

-- Agregar columna ciudad a la tabla system_users
ALTER TABLE system_users ADD COLUMN IF NOT EXISTS ciudad VARCHAR(200);

-- Actualizar usuarios existentes con una ciudad por defecto (opcional)
-- UPDATE system_users SET ciudad = 'Madrid' WHERE ciudad IS NULL AND role = 'normal';
-- UPDATE system_users SET ciudad = 'Barcelona' WHERE ciudad IS NULL AND role = 'admin';

-- Comentario: Los super_admin pueden tener ciudad NULL para acceder a todas las ciudades 