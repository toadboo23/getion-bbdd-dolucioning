#!/bin/bash
# Script de backup diario de la base de datos

BACKUP_DIR=/root/solucioning-deploy/backups
DB_CONTAINER=solucioning_postgres
DB_NAME=employee_management
DB_USER=postgres
DATE=20250723_151439
BACKUP_FILE=/backup_daily_.sql

# Crear carpeta si no existe
mkdir -p 

# Hacer el backup fuera del contenedor
if docker exec -t  pg_dump -U   > ; then
  echo  Backup diario realizado correctamente: 
else
  echo  Error al realizar el backup diario
fi

# Mantener solo los últimos 7 backups
ls -1t /backup_daily_*.sql | tail -n +8 | xargs rm -f
