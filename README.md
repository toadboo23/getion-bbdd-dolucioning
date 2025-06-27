# Solucioning - Sistema de Gestión de Empleados

Sistema completo de gestión de empleados con frontend en React/TypeScript y backend en Node.js, utilizando PostgreSQL como base de datos.

## 🚀 Instalación Rápida en VPS

### Requisitos
- VPS con Ubuntu 20.04+ o similar
- Acceso root al servidor
- Conexión a internet

### Instalación Automática

1. **Conectarse al VPS:**
```bash
ssh root@69.62.107.86
```

2. **Descargar y ejecutar el script de instalación:**
```bash
curl -fsSL https://raw.githubusercontent.com/tu-usuario/solucioning/main/install-vps.sh | bash
```

### Instalación Manual

1. **Clonar el repositorio:**
```bash
git clone https://github.com/tu-usuario/solucioning.git
cd solucioning
```

2. **Configurar variables de entorno:**
```bash
cp env.production .env
# Editar .env con tu configuración
```

3. **Construir y ejecutar:**
```bash
docker-compose -f docker-compose.prod.yml build --no-cache
docker-compose -f docker-compose.prod.yml up -d
```

## 📋 Características

- **Gestión de Empleados**: CRUD completo con campos personalizados
- **Sistema de Roles**: Super Admin, Admin, User
- **Dashboard Interactivo**: Métricas y gráficos en tiempo real
- **Gestión de Ausencias**: Solicitudes y aprobaciones
- **Sistema de Penalizaciones**: Control de incidencias
- **Exportación de Datos**: CSV y Excel
- **Interfaz Responsiva**: Diseño moderno con TailwindCSS
- **API RESTful**: Backend robusto con TypeScript

## 🏗️ Arquitectura

```
solucioning/
├── client/                 # Frontend React/TypeScript
│   ├── src/
│   │   ├── components/     # Componentes reutilizables
│   │   ├── pages/         # Páginas de la aplicación
│   │   ├── hooks/         # Custom hooks
│   │   └── lib/           # Utilidades y configuración
│   └── public/            # Archivos estáticos
├── server/                # Backend Node.js/TypeScript
│   ├── routes-clean.ts    # Rutas de la API
│   ├── db.ts             # Configuración de base de datos
│   └── auth-local.ts     # Autenticación local
├── shared/               # Código compartido
│   └── schema.ts         # Esquemas de base de datos
├── docker-compose.prod.yml  # Configuración de producción
├── Dockerfile.backend    # Docker para backend
├── Dockerfile.frontend   # Docker para frontend
└── init.sql             # Inicialización de base de datos
```

## 🔧 Configuración

### Variables de Entorno

```bash
# Base de Datos
POSTGRES_PASSWORD=tu_contraseña_segura
POSTGRES_EXTERNAL_PORT=5432

# Backend
SESSION_SECRET=tu_session_secret
BACKEND_PORT=5173

# Frontend
API_URL=http://tu-ip:5173
FRONTEND_PORT=3000

# Entorno
NODE_ENV=production
```

### Puertos

- **Frontend**: 3000
- **Backend API**: 5173
- **PostgreSQL**: 5432

## 👥 Usuarios por Defecto

- **Super Admin**: `superadmin@glovo.com` / `superadmin123`
- **Admin**: `admin@glovo.com` / `admin123`
- **User**: `user@glovo.com` / `user123`

## 🐳 Docker

### Desarrollo
```bash
docker-compose up -d
```

### Producción
```bash
docker-compose -f docker-compose.prod.yml up -d
```

### Construir desde cero
```bash
docker-compose -f docker-compose.prod.yml build --no-cache
```

## 📊 Endpoints de la API

- `GET /api/health` - Estado del servidor
- `POST /api/auth/login` - Iniciar sesión
- `GET /api/auth/user` - Información del usuario
- `POST /api/auth/logout` - Cerrar sesión
- `GET /api/dashboard/metrics` - Métricas del dashboard
- `GET /api/employees` - Lista de empleados
- `POST /api/employees` - Crear empleado
- `PUT /api/employees/:id` - Actualizar empleado
- `DELETE /api/employees/:id` - Eliminar empleado

## 🛠️ Comandos Útiles

### Ver logs
```bash
docker-compose -f docker-compose.prod.yml logs -f
```

### Reiniciar servicios
```bash
docker-compose -f docker-compose.prod.yml restart
```

### Detener servicios
```bash
docker-compose -f docker-compose.prod.yml down
```

### Backup de base de datos
```bash
docker exec solucioning_db pg_dump -U postgres employee_management > backup.sql
```

## 🔒 Seguridad

- Contraseñas hasheadas con bcrypt
- Sesiones seguras con express-session
- Validación de entrada con Zod
- CORS configurado correctamente
- Variables de entorno para configuración sensible

## 📝 Licencia

Este proyecto está bajo la Licencia MIT.

## 🤝 Contribución

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📞 Soporte

Para soporte técnico o preguntas, contacta al equipo de desarrollo.