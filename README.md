# Solucioning - Sistema de Gestión de Empleados

Sistema completo de gestión de empleados desarrollado con React, TypeScript, Node.js y PostgreSQL.

## 🚀 Características Principales

- **Gestión completa de empleados** (CRUD, importación/exportación Excel)
- **Cálculo automático de CDP%** (Carga de Trabajo Porcentual)
- **Gestión de bajas** (IT y empresa) con flujo de aprobación
- **Dashboard** con métricas en tiempo real
- **Sistema de notificaciones** y auditoría
- **Control de acceso** por roles (Super Admin, Admin, Usuario)

## 🛠️ Tecnologías

- **Frontend**: React 18, TypeScript, TailwindCSS, Radix UI
- **Backend**: Node.js, Express, PostgreSQL, Drizzle ORM
- **DevOps**: Docker, Docker Compose

## 📦 Instalación Rápida

```bash
# Clonar repositorio
git clone <repository-url>
cd solucioning

# Configurar variables de entorno
cp env.production.example .env
# Editar .env con tus configuraciones

# Levantar con Docker
docker-compose up -d --build
```

## 🔧 Configuración

### Variables de Entorno Esenciales
```env
POSTGRES_PASSWORD=tu_password_seguro
SESSION_SECRET=tu-super-secreto-session-key
API_URL=http://localhost:5173
NODE_ENV=production
```

### Usuarios por Defecto
- **Super Admin**: `superadmin@glovo.com` / `superadmin123`
- **Admin**: `admin@glovo.com` / `admin123`
- **Usuario**: `user@glovo.com` / `user123`

## 📊 CDP% (Carga de Trabajo Porcentual)

El sistema calcula automáticamente el CDP% basado en las horas de trabajo:
- **Fórmula**: `CDP% = (horas_trabajadas / 38) * 100`
- **Base**: 38 horas = 100% de carga de trabajo

## 🚀 Despliegue

```bash
# Usar scripts de administración
source vps-admin-scripts.sh

# Desplegar en producción
deploy_production

# Verificar estado
check_status
```

## 📁 Estructura del Proyecto

```
solucioning/
├── client/                 # Frontend React
├── server/                 # Backend Node.js
├── shared/                 # Esquemas compartidos
├── docker-compose.yml      # Desarrollo
├── docker-compose.prod.yml # Producción
└── vps-admin-scripts.sh    # Scripts de administración
```

## 📝 Licencia

MIT License

---

**Solucioning** - Sistema de Gestión de Empleados v1.0.0