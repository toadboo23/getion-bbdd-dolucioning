# Solucioning - Sistema de Gestión de Empleados

Sistema completo de gestión de empleados con frontend en React/TypeScript y backend en Node.js/Express, utilizando PostgreSQL como base de datos.

## 🚀 Características

- **Gestión completa de empleados** con información detallada
- **Sistema de autenticación** con roles (Super Admin, Admin, User)
- **Dashboard interactivo** con métricas y gráficos
- **Gestión de permisos y licencias** de empleados
- **Sistema de auditoría** para seguimiento de cambios
- **Interfaz moderna** con TailwindCSS y componentes reutilizables
- **API RESTful** completa
- **Base de datos PostgreSQL** con Drizzle ORM

## 🏗️ Arquitectura

```
solucioning/
├── client/                 # Frontend React/TypeScript
│   ├── src/
│   │   ├── components/     # Componentes reutilizables
│   │   ├── pages/         # Páginas de la aplicación
│   │   ├── hooks/         # Custom hooks
│   │   └── lib/           # Utilidades y configuración
├── server/                # Backend Node.js/Express
│   ├── index-clean.ts     # Servidor principal
│   ├── routes-clean.ts    # Rutas de la API
│   ├── db.ts             # Configuración de base de datos
│   └── auth-local.ts     # Autenticación local
├── shared/               # Esquemas compartidos
│   └── schema.ts         # Esquemas de base de datos
└── docker-compose.yml    # Configuración Docker
```

## 🛠️ Tecnologías

### Frontend
- **React 18** con TypeScript
- **Vite** como bundler
- **TailwindCSS** para estilos
- **React Query** para gestión de estado
- **React Router** para navegación
- **Recharts** para gráficos
- **React Hook Form** para formularios

### Backend
- **Node.js** con TypeScript
- **Express.js** como framework
- **PostgreSQL** como base de datos
- **Drizzle ORM** para consultas
- **Express Session** para autenticación
- **bcryptjs** para encriptación

### DevOps
- **Docker** y **Docker Compose**
- **PostgreSQL** en contenedor
- **Nginx** para servir archivos estáticos

## 📋 Requisitos

- Node.js 18+ 
- Docker y Docker Compose
- PostgreSQL (opcional para desarrollo local)

## 🚀 Instalación

### Desarrollo Local

1. **Clonar el repositorio**
```bash
git clone <repository-url>
cd solucioning
```

2. **Configurar variables de entorno**
```bash
cp env.production.example .env.local
# Editar .env.local con tus configuraciones
```

3. **Instalar dependencias**
```bash
# Backend
cd server && npm install

# Frontend
cd client && npm install
```

4. **Ejecutar con Docker**
```bash
docker-compose up -d
```

### Producción (VPS)

1. **Subir archivos al servidor**
```bash
scp -r . root@your-vps-ip:/opt/solucioning/
```

2. **Configurar variables de entorno**
```bash
ssh root@your-vps-ip
cd /opt/solucioning
cp env.production .env
# Editar .env con la IP del servidor
```

3. **Ejecutar en producción**
```bash
docker-compose -f docker-compose.prod.yml up -d
```

## 🔧 Configuración

### Variables de Entorno

```env
# Base de Datos
POSTGRES_PASSWORD=your-secure-password
POSTGRES_EXTERNAL_PORT=5432

# Backend
SESSION_SECRET=your-session-secret
BACKEND_PORT=5173

# Frontend
API_URL=http://your-server-ip:5173
FRONTEND_PORT=3000

# Entorno
NODE_ENV=production
```

## 👥 Usuarios por Defecto

- **Super Admin**: `superadmin@glovo.com` / `superadmin123`
- **Admin**: `admin@glovo.com` / `admin123`
- **User**: `user@glovo.com` / `user123`

## 📊 Endpoints de la API

### Autenticación
- `POST /api/auth/login` - Iniciar sesión
- `GET /api/auth/user` - Obtener usuario actual
- `POST /api/auth/logout` - Cerrar sesión

### Empleados
- `GET /api/employees` - Listar empleados
- `POST /api/employees` - Crear empleado
- `PUT /api/employees/:id` - Actualizar empleado
- `DELETE /api/employees/:id` - Eliminar empleado

### Dashboard
- `GET /api/dashboard/metrics` - Métricas del dashboard

## 🐳 Docker

### Construir imágenes
```bash
docker-compose build
```

### Ejecutar servicios
```bash
docker-compose up -d
```

### Ver logs
```bash
docker-compose logs -f
```

## 📝 Scripts Disponibles

- `npm run dev:backend` - Ejecutar backend en desarrollo
- `npm run dev` - Ejecutar frontend en desarrollo
- `npm run build` - Construir para producción
- `npm run preview` - Previsualizar build

## 🔒 Seguridad

- Autenticación con sesiones
- Encriptación de contraseñas con bcrypt
- Validación de datos con Zod
- Headers de seguridad con Helmet
- CORS configurado
- Rate limiting implementado

## 📈 Monitoreo

- Logs estructurados
- Métricas de rendimiento
- Auditoría de cambios
- Health checks

## 🤝 Contribución

1. Fork el proyecto
2. Crear una rama para tu feature
3. Commit tus cambios
4. Push a la rama
5. Abrir un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT.

## 🆘 Soporte

Para soporte técnico, contacta al equipo de desarrollo.

---

**Solucioning** - Sistema de Gestión de Empleados © 2024