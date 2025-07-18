# Sistema de Gestión - Versión Desarrollo

## 🚀 Configuración Inicial

### 1. Clonar el repositorio
```bash
git clone <repository-url>
cd db_local
```

### 2. Configurar variables de entorno
```bash
# Copiar el archivo de ejemplo
cp env.example .env

# Editar el archivo .env con tus valores
# IMPORTANTE: Nunca subir .env al repositorio
```

### 3. Variables de entorno requeridas
```bash
# Database Configuration
POSTGRES_DB=employee_management
POSTGRES_USER=postgres
POSTGRES_PASSWORD=tu_password_seguro
POSTGRES_HOST_AUTH_METHOD=trust

# Backend Configuration
NODE_ENV=development
DATABASE_URL=postgresql://postgres:tu_password_seguro@postgres:5432/employee_management
SESSION_SECRET=tu_session_secret_seguro
PORT=5173

# PgAdmin Configuration
PGADMIN_DEFAULT_EMAIL=admin@solucioning.local
PGADMIN_DEFAULT_PASSWORD=tu_pgadmin_password
PGADMIN_CONFIG_SERVER_MODE=False

# Frontend Configuration
VITE_API_URL=http://localhost:5173
```

## 🐳 Ejecutar con Docker

### Iniciar todos los servicios
```bash
docker-compose up -d
```

### Ver logs
```bash
# Todos los servicios
docker-compose logs -f

# Servicio específico
docker-compose logs -f frontend
docker-compose logs -f backend
docker-compose logs -f postgres
```

### Detener servicios
```bash
docker-compose down
```

## 🌐 URLs de Acceso

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5173
- **PgAdmin**: http://localhost:5050
- **PostgreSQL**: localhost:5432

## 🔧 Desarrollo

### Hot Reload
- **Frontend**: Los cambios en `client/` se reflejan automáticamente
- **Backend**: Los cambios en `server/` se reflejan automáticamente

### Credenciales de Desarrollo
- **Super Admins**: `nmartinez@solucioning.net`, `lvega@solucioning.net`
- **Admins**: `trafico1@solucioning.net` a `trafico20@solucioning.net`

### Estructura del Proyecto
```
db_local/
├── client/          # Frontend React
├── server/          # Backend Node.js
├── shared/          # Código compartido
├── database/        # Migraciones y seeds
├── docs/           # Documentación
└── docker-compose.yml
```

## 🛠️ Comandos Útiles

### Reconstruir contenedores
```bash
docker-compose build
docker-compose up -d
```

### Reiniciar servicio específico
```bash
docker-compose restart frontend
docker-compose restart backend
```

### Ver estado de servicios
```bash
docker-compose ps
```

### Acceder a contenedor
```bash
docker exec -it solucioning_frontend sh
docker exec -it solucioning_backend sh
```

## 🔒 Seguridad

### Archivos que NO se suben al repositorio
- `.env` (variables de entorno locales)
- `node_modules/`
- `logs/`
- Archivos de base de datos
- Credenciales y secretos

### Archivos de ejemplo
- `env.example` - Variables de entorno de ejemplo
- `docker-compose.yml` - Configuración con valores por defecto seguros

## 📝 Notas de Desarrollo

- Esta es la versión de **desarrollo** con hot reload
- Para producción, usar `docker-compose.prod.yml`
- Los botones de ticket están implementados en landing y dashboard
- El sistema de autenticación está configurado para desarrollo local 