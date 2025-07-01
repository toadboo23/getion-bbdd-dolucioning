# Solucioning - Sistema de Gestión de Empleados

Sistema completo de gestión de empleados desarrollado con React, TypeScript, Node.js y PostgreSQL.

## 🚀 Instalación Rápida

```bash
git clone <repository-url>
cd solucioning
cp env.production.example .env
# Edita .env con tus configuraciones
docker-compose up -d --build
```

## 🛠️ Tecnologías

- **Frontend**: React, TypeScript, TailwindCSS, Radix UI
- **Backend**: Node.js, Express, PostgreSQL, Drizzle ORM
- **DevOps**: Docker, Docker Compose

## 👥 Usuarios por Defecto

- **Super Admin**: `superadmin@glovo.com` / `superadmin123`
- **Admin**: `admin@glovo.com` / `admin123`
- **User**: `user@glovo.com` / `user123`

## 📦 Características

- Gestión completa de empleados (CRUD, importación/exportación Excel)
- Cálculo automático de CDP%
- Gestión de bajas (IT y empresa) con flujo de aprobación
- Dashboard con métricas en tiempo real
- Sistema de notificaciones y auditoría
- Control de acceso por roles

## 🐳 Docker

- **Desarrollo:** `docker-compose up -d`
- **Producción:** `docker-compose -f docker-compose.prod.yml up -d`
- **Reconstruir:** `docker-compose build --no-cache`

---

> Para detalles avanzados, revisa la documentación interna o contacta al equipo de desarrollo.
