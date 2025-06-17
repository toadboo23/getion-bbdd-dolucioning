# Sistema de Gestión de Empleados

Un sistema completo de gestión de empleados con funcionalidades avanzadas de seguimiento de bajas, control de acceso basado en roles y flujos de trabajo administrativos para procesos de RRHH.

## Tecnologías Principales

- **Frontend**: React.js con TypeScript
- **Backend**: Express.js con TypeScript
- **Base de Datos**: PostgreSQL
- **ORM**: Drizzle ORM
- **Gestión de Estado**: TanStack Query
- **Componentes UI**: Shadcn UI
- **Contenedores**: Docker y Docker Compose

## Configuración para Entorno Local

### Requisitos Previos

- Docker y Docker Compose instalados
- Node.js 20+ (opcional, si prefieres ejecutar sin Docker)
- Git

### Configuración Rápida con Docker

1. **Clonar el repositorio**
   ```bash
   git clone <tu-repositorio>
   cd employee-management-system
   ```

2. **Configurar variables de entorno**
   
   Copia el archivo de configuración local:
   ```bash
   cp .env.local .env
   ```

3. **Iniciar todos los servicios**
   ```bash
   docker-compose up -d
   ```

   Esto iniciará:
   - PostgreSQL en `http://localhost:5432`
   - Backend API en `http://localhost:5173`
   - Frontend en `http://localhost:3000`

4. **Verificar que todo funciona**
   
   Abre tu navegador en `http://localhost:3000`

### Configuración Manual (Sin Docker)

Si prefieres ejecutar los servicios individualmente:

1. **Base de Datos PostgreSQL**
   ```bash
   # Instalar y configurar PostgreSQL
   # Crear base de datos
   createdb employee_management
   
   # Ejecutar script de inicialización
   psql -d employee_management -f init.sql
   ```

2. **Backend**
   ```bash
   # Instalar dependencias
   npm install
   
   # Configurar variables de entorno
   export DATABASE_URL="postgresql://postgres:password123@localhost:5432/employee_management"
   export SESSION_SECRET="your-super-secret-session-key"
   
   # Iniciar backend en puerto 5173
   npm run dev:backend
   ```

3. **Frontend**
   ```bash
   # En otra terminal, iniciar frontend en puerto 3000
   npm run dev:frontend
   ```

## Estructura del Proyecto

```
employee-management-system/
├── client/                 # Frontend React
│   ├── src/
│   │   ├── components/     # Componentes UI reutilizables
│   │   ├── pages/          # Páginas de la aplicación
│   │   ├── hooks/          # React hooks personalizados
│   │   └── lib/            # Utilidades y configuraciones
├── server/                 # Backend Express
│   ├── index.ts            # Punto de entrada del servidor
│   ├── routes.ts           # Definición de rutas API
│   ├── storage.ts          # Almacenamiento en memoria (desarrollo)
│   ├── storage-postgres.ts # Almacenamiento PostgreSQL (producción)
│   ├── db.ts               # Configuración de base de datos
│   └── replitAuth.ts       # Configuración de autenticación
├── shared/                 # Esquemas y tipos compartidos
│   └── schema.ts           # Definiciones de base de datos con Drizzle
├── docker-compose.yml      # Orquestación de contenedores
├── init.sql                # Script de inicialización de BD
└── .env.local              # Variables de entorno locales
```

## Configuración de Puertos

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5173
- **PostgreSQL**: localhost:5432

## Variables de Entorno

El archivo `.env.local` contiene todas las configuraciones necesarias:

```env
# Base de Datos
DATABASE_URL=postgresql://postgres:password123@localhost:5432/employee_management
PGHOST=localhost
PGPORT=5432
PGDATABASE=employee_management
PGUSER=postgres
PGPASSWORD=password123

# Seguridad
SESSION_SECRET=your-super-secret-session-key-change-this-in-production

# Autenticación Local
REPL_ID=local-development
ISSUER_URL=http://localhost:5173/oidc
REPLIT_DOMAINS=localhost:5173

# API
VITE_API_URL=http://localhost:5173
```

## Comandos Útiles

### Docker
```bash
# Iniciar servicios
docker-compose up -d

# Ver logs en tiempo real
docker-compose logs -f

# Detener servicios
docker-compose down

# Reconstruir contenedores
docker-compose build
```

### Base de Datos
```bash
# Conectar a PostgreSQL
docker exec -it employee_management_db psql -U postgres -d employee_management

# Ver tablas
\dt

# Exportar datos
docker exec employee_management_db pg_dump -U postgres employee_management > backup.sql
```

### Desarrollo
```bash
# Frontend en modo desarrollo
npm run dev:frontend

# Backend en modo desarrollo  
npm run dev:backend

# Verificar tipos TypeScript
npm run check

# Aplicar cambios de esquema a BD
npm run db:push
```

## Funcionalidades del Sistema

### Gestión de Empleados
- ✅ CRUD completo de empleados con 16 campos específicos
- ✅ Búsqueda y filtrado por ciudad, estado y términos
- ✅ Seguimiento de estado (activo, baja IT, baja empresa)
- ✅ Carga masiva via Excel (reemplaza base de datos completa)

### Sistema de Bajas
- ✅ **Baja IT**: Seguimiento de bajas técnicas
- ✅ **Baja Empresa**: Sistema completo con auditoría
- ✅ Trail de auditoría: quién solicitó, cuándo, quién aprobó
- ✅ Traslado automático a tabla de bajas al aprobar

### Control de Acceso
- ✅ Autenticación con roles (super_admin, admin, normal)
- ✅ Páginas protegidas según rol
- ✅ Control de permisos a nivel de API

### Dashboard y Notificaciones
- ✅ Métricas en tiempo real
- ✅ Sistema de notificaciones administrativas
- ✅ Aprobación/rechazo de solicitudes

## Datos de Ejemplo

El sistema incluye datos de muestra:
- 4 empleados con información completa
- Notificaciones del sistema
- Estructura completa de tablas

## Solución de Problemas

### Error de Conexión a Base de Datos
```bash
# Verificar que PostgreSQL esté ejecutándose
docker ps | grep postgres

# Revisar logs
docker-compose logs postgres
```

### Puerto en Uso
```bash
# Verificar qué está usando el puerto
lsof -i :3000
lsof -i :5173
lsof -i :5432

# Cambiar puertos en docker-compose.yml si es necesario
```

### Problemas de Autenticación
- Verificar que `SESSION_SECRET` esté configurado
- Comprobar que la tabla `sessions` existe en la base de datos
- Revisar logs del backend para errores específicos

## Desarrollo y Contribución

1. **Fork del repositorio**
2. **Crear rama para feature**: `git checkout -b feature/nueva-funcionalidad`
3. **Realizar cambios y tests**
4. **Commit**: `git commit -m "Descripción clara"`
5. **Push**: `git push origin feature/nueva-funcionalidad`
6. **Crear Pull Request**

## Estructura de la Base de Datos

### Tablas Principales

- **users**: Usuarios y roles del sistema
- **employees**: Empleados activos con 16 campos específicos
- **company_leaves**: Empleados en baja empresa (con auditoría completa)
- **it_leaves**: Registro de bajas IT
- **notifications**: Sistema de notificaciones
- **sessions**: Gestión de sesiones de usuario

### Campos de Empleado

Apellidos, Telefono, Correo, Ciudad, DNI_NIE, Fecha_de_Nacimiento, Nacionalidad, NAF, Dirección, IBAN, Vehículo, Contrato(Horas), Tipo_Contrato, Estado_SS, Fecha_Alta, Edad

## Licencia

MIT License - Ver archivo LICENSE para detalles.

## Soporte

Para problemas o preguntas:
1. Revisar este README
2. Consultar logs: `docker-compose logs -f`
3. Verificar variables de entorno
4. Comprobar conectividad de puertos

---

**¡El sistema está listo para ejecutarse en tu entorno local!** 🚀