-- Migración: Ampliar campos clave de employees a 50 caracteres
-- Fecha: 2024-07-21
 
ALTER TABLE employees ALTER COLUMN telefono TYPE varchar(50);
ALTER TABLE employees ALTER COLUMN citycode TYPE varchar(50);
ALTER TABLE employees ALTER COLUMN dni_nie TYPE varchar(50);
ALTER TABLE employees ALTER COLUMN naf TYPE varchar(50); 