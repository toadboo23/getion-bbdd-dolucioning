# Sistema de Gestión de Empleados - Proyecto Limpio

## Entregable para Entorno Local

Este es un proyecto completamente limpio, sin configuraciones de Replit, listo para tu entorno local.

## Configuración de Puertos

- **Frontend**: http://localhost:3000
- **Backend**: http://localhost:5173
- **PostgreSQL**: localhost:5432

## Estructura Limpia del Proyecto

```
employee-management-system/
├── client/                    # Frontend React (mantener igual)
├── server/
│   ├── index-clean.ts         # Servidor limpio sin Replit
│   ├── routes-clean.ts        # Rutas API limpias
│   ├── storage-clean.ts       # Almacenamiento en memoria
│   ├── auth-local.ts          # Autenticación local simple
│   └── db.ts                  # Conexión PostgreSQL
├── shared/
│   └── schema.ts              # Esquemas de base de datos
├── package-clean.json         # Package.json limpio
├── docker-compose.yml         # Docker para local
├── init.sql                   # Inicialización PostgreSQL
├── .env.local                 # Variables locales
└── vite.config.ts             # Configuración Vite
```

## Pasos para Configurar

### 1. Archivos a Usar

**IMPORTANTE**: Usa estos archivos limpios en lugar de los existentes:
- `package-clean.json` → renombrar a `package.json`
- `server/index-clean.ts` → usar como servidor principal
- `server/routes-clean.ts` → rutas API limpias
- `server/storage-clean.ts` → almacenamiento sin dependencias Replit
- `server/auth-local.ts` → autenticación local simple

### 2. Configuración Rápida

```bash
# 1. Usar package.json limpio
mv package-clean.json package.json

# 2. Instalar dependencias
npm install

# 3. Configurar entorno
cp .env.local .env

# 4. Iniciar con Docker
docker-compose up -d

# O manualmente:
# Terminal 1: Backend
npm run dev:backend

# Terminal 2: Frontend  
npm run dev:frontend
```

### 3. Variables de Entorno (.env)

```env
NODE_ENV=development
DATABASE_URL=postgresql://postgres:password123@localhost:5432/employee_management
SESSION_SECRET=your-super-secret-session-key-change-this
PORT=5173
VITE_API_URL=http://localhost:5173
```

## Funcionalidades Incluidas

- ✅ Sistema completo de empleados con 16 campos
- ✅ Gestión de bajas empresa con auditoría
- ✅ Carga masiva que reemplaza base de datos
- ✅ Dashboard con métricas
- ✅ Notificaciones y aprobaciones
- ✅ Autenticación local simple
- ✅ Datos de ejemplo incluidos

## Autenticación Local

Para simplificar el desarrollo local, incluye autenticación básica:
- Usuario: admin@local.com
- Login automático como super_admin
- Sin dependencias externas

## Base de Datos

### Con Docker (Recomendado)
PostgreSQL se inicializa automáticamente con datos de ejemplo.

### Manual
1. Instalar PostgreSQL
2. Crear base de datos: `createdb employee_management`
3. Ejecutar: `psql -d employee_management -f init.sql`

## Diferencias con Versión Replit

### Eliminado:
- ❌ Configuraciones específicas de Replit
- ❌ Variables REPL_ID, REPLIT_DOMAINS
- ❌ OpenID Connect de Replit
- ❌ Dependencias @replit/*
- ❌ Configuraciones de workflow

### Añadido:
- ✅ Autenticación local simple
- ✅ CORS para localhost:3000
- ✅ Scripts npm limpios
- ✅ Configuración Docker completa
- ✅ Variables de entorno locales

## Comandos Disponibles

```bash
# Desarrollo
npm run dev              # Frontend + Backend
npm run dev:backend      # Solo backend (puerto 5173)
npm run dev:frontend     # Solo frontend (puerto 3000)

# Docker
npm run docker:up        # Iniciar servicios
npm run docker:down      # Detener servicios
npm run docker:logs      # Ver logs

# Producción
npm run build            # Construir proyecto
npm run start            # Ejecutar en producción
```

## Verificación

Después de iniciar:
1. Backend: `curl http://localhost:5173/api/auth/user`
2. Frontend: Abrir http://localhost:3000
3. PostgreSQL: `docker exec -it employee_management_db psql -U postgres -d employee_management`

El proyecto está completamente desacoplado de Replit y listo para tu entorno local.