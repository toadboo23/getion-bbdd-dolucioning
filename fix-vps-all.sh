#!/bin/bash
set -e

# 1. Crear/actualizar archivo .env
cat > .env << 'EOF'
POSTGRES_HOST=postgres
POSTGRES_PORT=5432
POSTGRES_DB=employee_management
POSTGRES_USER=postgres
POSTGRES_PASSWORD=dev_password_2025

SESSION_SECRET=super-long-random-string-for-solucioning-session-security-2024
BACKEND_PORT=5173

API_URL=http://69.62.107.86:5173
FRONTEND_PORT=3000

NODE_ENV=production
EOF

echo "[1/5] Archivo .env actualizado."

# 2. Copiar init.sql al contenedor de PostgreSQL
docker cp init.sql employee_management_db:/init.sql || docker cp init.sql solucioning_postgres:/init.sql

echo "[2/5] init.sql copiado al contenedor de PostgreSQL."

# 3. Ejecutar script de inicialización en la base de datos
if docker ps --format '{{.Names}}' | grep -q employee_management_db; then
  PG_CONTAINER=employee_management_db
else
  PG_CONTAINER=solucioning_postgres
fi

docker exec -i $PG_CONTAINER psql -U postgres -d employee_management -f /init.sql

echo "[3/5] Script de inicialización ejecutado en la base de datos."

# 4. Reiniciar todos los contenedores
docker-compose down
sleep 2
docker-compose up -d

echo "[4/5] Contenedores reiniciados."

# 5. Verificar usuarios en la base de datos
docker exec -i $PG_CONTAINER psql -U postgres -d employee_management -c "SELECT email, role, is_active FROM system_users;"

echo "[5/5] Verificación de usuarios completada."

echo "=== TODO LISTO. Prueba el login desde el frontend. ===" 