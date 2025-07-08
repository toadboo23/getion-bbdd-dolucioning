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

## ⚠️ Importante: Compatibilidad de versiones de PostgreSQL

- El sistema está diseñado para funcionar con **PostgreSQL 16** (imagen oficial `postgres:16-alpine`).
- Si intentas usar un volumen de datos creado con otra versión (por ejemplo, PostgreSQL 15), Docker mostrará un error de incompatibilidad y la base de datos no arrancará.
- **Solución:** Si es un entorno de desarrollo y puedes perder los datos, ejecuta:

```bash
docker-compose down -v
# o para producción (¡solo si sabes lo que haces!)
docker-compose -f docker-compose.prod.yml down -v
```
Esto eliminará el volumen y lo recreará limpio con la versión correcta.

- Si necesitas migrar datos de una versión anterior, consulta la documentación oficial de PostgreSQL para hacer un `pg_dump` y restaurar en la nueva versión.

---

> Para detalles avanzados, revisa la documentación interna o contacta al equipo de desarrollo.
