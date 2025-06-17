# Guía de Despliegue Local

## Resumen de Configuración

Este proyecto está configurado para ejecutarse en tu entorno local con:
- **Frontend**: http://localhost:3000
- **Backend**: http://localhost:5173  
- **PostgreSQL**: localhost:5432

## Inicio Rápido

```bash
# 1. Clonar repositorio
git clone <tu-repositorio>
cd employee-management-system

# 2. Configurar entorno
cp .env.local .env

# 3. Iniciar con Docker
docker-compose up -d

# 4. Acceder a la aplicación
open http://localhost:3000
```

## Archivos de Configuración Creados

### Docker
- `docker-compose.yml` - Orquestación completa de servicios
- `Dockerfile.backend` - Contenedor para API Express
- `Dockerfile.frontend` - Contenedor para React
- `docker-entrypoint.sh` - Script de inicialización
- `.dockerignore` - Archivos excluidos de Docker

### Base de Datos
- `init.sql` - Inicialización completa de PostgreSQL con datos de ejemplo
- `server/db.ts` - Configuración de conexión a PostgreSQL
- `server/storage-postgres.ts` - Implementación para base de datos real
- `server/storage-config.ts` - Selector de almacenamiento según entorno

### Configuración
- `.env.local` - Variables de entorno para desarrollo local
- `README.md` - Documentación completa del proyecto

## Datos Incluidos

El sistema incluye:
- 4 empleados de ejemplo con todos los campos requeridos
- Estructura completa de tablas (employees, company_leaves, it_leaves, notifications, users, sessions)
- Configuración de roles y permisos
- Datos de prueba para todas las funcionalidades

## Verificación de Funcionamiento

Después de ejecutar `docker-compose up -d`:

1. **PostgreSQL**: `docker exec -it employee_management_db psql -U postgres -d employee_management -c "\dt"`
2. **Backend**: `curl http://localhost:5173/api/auth/user`
3. **Frontend**: Abrir http://localhost:3000

## Comandos Útiles

```bash
# Ver logs en tiempo real
docker-compose logs -f

# Reiniciar servicios
docker-compose restart

# Limpiar y reconstruir
docker-compose down && docker-compose build && docker-compose up -d

# Acceso directo a base de datos
docker exec -it employee_management_db psql -U postgres -d employee_management
```

## Funcionalidades Verificadas

- ✅ Autenticación y roles
- ✅ CRUD completo de empleados  
- ✅ Sistema de bajas con auditoría
- ✅ Carga masiva que reemplaza base de datos
- ✅ Dashboard con métricas
- ✅ Notificaciones y aprobaciones
- ✅ 16 campos específicos de empleados

El proyecto está completamente preparado para ejecutarse en tu entorno local.