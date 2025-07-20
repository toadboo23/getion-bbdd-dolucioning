# Solucioning - Sistema de Gestión de Empleados

Sistema completo de gestión de empleados con backend en Node.js/TypeScript, frontend en React/Vite, y base de datos PostgreSQL.

## 🏗️ Estructura del Proyecto

```
db_local/
├── client/                 # Frontend React/Vite
│   ├── src/
│   │   ├── components/     # Componentes React
│   │   ├── pages/         # Páginas de la aplicación
│   │   ├── hooks/         # Custom hooks
│   │   ├── lib/           # Utilidades y configuración
│   │   └── utils/         # Funciones auxiliares
│   ├── public/            # Archivos estáticos
│   └── index.html         # Punto de entrada HTML
├── server/                # Backend Node.js/TypeScript
│   ├── audit-service.ts   # Servicio de auditoría
│   ├── auth-local.ts      # Autenticación local
│   ├── db.ts             # Configuración de base de datos
│   ├── index-clean.ts    # Servidor principal
│   ├── routes-clean.ts   # Rutas de la API
│   ├── scheduler.ts      # Programador de tareas
│   ├── storage-postgres.ts # Almacenamiento PostgreSQL
│   └── telegram-bot.ts   # Bot de Telegram
├── database/             # Scripts de base de datos
│   ├── migrations/       # Migraciones SQL
│   ├── schemas/          # Esquemas de base de datos
│   └── seeds/           # Datos de prueba
├── shared/              # Código compartido
│   ├── constants/       # Constantes del sistema
│   ├── schema.ts        # Esquemas de validación
│   └── types/           # Tipos TypeScript
├── docs/               # Documentación
├── docker-compose.yml   # Configuración Docker local
├── docker-compose.prod.yml # Configuración Docker producción
├── Dockerfile.backend   # Dockerfile del backend
├── Dockerfile.frontend  # Dockerfile del frontend
├── init.sql            # Script de inicialización de BD
└── package.json        # Dependencias del proyecto
```

## 🚀 Inicio Rápido

### Prerrequisitos
- Docker y Docker Compose
- Node.js 18+ (para desarrollo local)
- Git

### Desarrollo Local (Recomendado)

1. **Clonar el repositorio**
   ```bash
   git clone <repository-url>
   cd db_local
   ```

2. **Iniciar servicios locales (SIN variables de entorno)**
   ```powershell
   # Iniciar todos los servicios locales
   .\scripts\dev-local.ps1 up
   
   # Ver logs
   .\scripts\dev-local.ps1 logs
   
   # Detener servicios
   .\scripts\dev-local.ps1 down
   ```

3. **Desarrollo tradicional (No recomendado)**
   ```bash
   # Solo si necesitas usar variables de entorno
   docker-compose up -d
   ```

**⚠️ IMPORTANTE**: Usa siempre `.\scripts\dev-local.ps1` para evitar conflictos de variables de entorno.

### Acceso a la Aplicación
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5173
- **Base de datos**: localhost:5432

## 🔧 Configuración

### Variables de Entorno
El proyecto utiliza las siguientes variables de entorno:

```env
# Base de datos
DATABASE_URL=postgresql://postgres:SolucioningSecurePass2024!@localhost:5432/employee_management

# Sesión
SESSION_SECRET=SolucioningSecretKey2024!

# Puerto del backend
PORT=5173
```

### Sincronización con VPS
Para mantener las credenciales sincronizadas entre el entorno local y el VPS:

**Windows:**
```powershell
.\sync-vps-credentials.ps1
```

**Linux/Mac:**
```bash
./sync-vps-credentials.sh
```

## 📚 Documentación

- [Manual de Usuario](MANUAL_USUARIO.md) - Guía completa de uso
- [Guía Rápida](GUIA_RAPIDA.md) - Comandos esenciales
- [Resumen Ejecutivo](RESUMEN_EJECUTIVO.md) - Visión general del proyecto
- [Backup y Restauración](BACKUP_README.md) - Gestión de respaldos

`



### Manual
1. Conectar al VPS
2. Navegar a `/solucioning-deploy`
3. Ejecutar `git pull origin main`
4. Reconstruir contenedores: `docker-compose -f docker-compose.prod.yml up -d --build`

## 📊 Monitoreo

El sistema incluye:
- Auditoría automática de acciones
- Logs de sistema
- Notificaciones por Telegram
- Backup automático de base de datos

## 📝 Notas Importantes

- **Puertos**: Backend (5173), Frontend (3000), DB (5432)
- **Rama de desarrollo**: `Develop-Local`
- **Directorio VPS**: `/solucioning-deploy`
- **Backup automático**: Diario a las 2:00 AM

## 🆘 Soporte

Para problemas técnicos o consultas, revisar:
1. Logs de Docker: `docker-compose logs -f`
2. Documentación en `/docs`
3. Scripts de sincronización para problemas de credenciales
