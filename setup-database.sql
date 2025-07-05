-- Script para configurar la base de datos Solucioning
-- Ejecutar como usuario postgres

-- Crear el usuario de la aplicación
CREATE USER solucioning WITH PASSWORD 'Patoloco2323@@';

-- Otorgar privilegios al usuario
GRANT ALL PRIVILEGES ON DATABASE solucioning TO solucioning;

-- Conectar a la base de datos solucioning
\c solucioning;

-- Otorgar privilegios en el esquema público
GRANT ALL ON SCHEMA public TO solucioning;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO solucioning;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO solucioning;

-- Configurar permisos para tablas futuras
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO solucioning;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO solucioning; 