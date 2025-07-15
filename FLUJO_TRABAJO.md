# 🚀 Flujo de Trabajo Automático - Solucioning

## 📋 Resumen Ejecutivo

Este documento describe el flujo de trabajo automatizado para el proyecto Solucioning, que utiliza el repositorio principal [https://github.com/toadboo23/db_solucioning](https://github.com/toadboo23/db_solucioning) y mantiene un proceso de desarrollo y despliegue robusto y sin errores.

## 🏗️ Estructura de Ramas

### Ramas Principales
- **`main`** - Rama de producción (siempre desplegable)
- **`feature/sistema-notificaciones-empleados`** - Rama de desarrollo para nuevas funcionalidades

### Política de Ramas
- ✅ Solo trabajar en `main` para cambios directos
- ✅ Usar `feature/sistema-notificaciones-empleados` para desarrollo de nuevas funcionalidades
- ❌ No crear ramas adicionales sin justificación
- ❌ No trabajar directamente en producción sin testing

## 🔧 Scripts Automatizados

### 1. `deploy-automatic.ps1` - Despliegue Automático
**Uso:** `.\deploy-automatic.ps1 [mensaje_commit]`

**Funcionalidades:**
- ✅ Validación automática del estado del repositorio
- ✅ Commit automático con timestamp si no se proporciona mensaje
- ✅ Push automático a la rama `main`
- ✅ Despliegue automático al VPS (69.62.107.86)
- ✅ Backup automático de la base de datos antes del despliegue
- ✅ Verificación automática del despliegue
- ✅ Manejo de errores y rollback automático

**Ejemplo de uso:**
```powershell
# Despliegue con mensaje personalizado
.\deploy-automatic.ps1 "Fix: Corregir error de login"

# Despliegue automático con mensaje por defecto
.\deploy-automatic.ps1
```

### 2. `develop-feature.ps1` - Desarrollo en Feature
**Uso:** `.\develop-feature.ps1 [comando] [mensaje]`

**Comandos disponibles:**
- `start` - Iniciar desarrollo en rama feature
- `commit` - Hacer commit en feature
- `push` - Hacer push de feature
- `merge` - Merge feature a main
- `status` - Mostrar estado del repositorio

**Ejemplo de uso:**
```powershell
# Iniciar desarrollo
.\develop-feature.ps1 start

# Hacer commit
.\develop-feature.ps1 commit "Agregar notificaciones push"

# Merge a main
.\develop-feature.ps1 merge "Integrar sistema de notificaciones"
```

### 3. `check-system.ps1` - Verificación del Sistema
**Uso:** `.\check-system.ps1 [local|vps|all]`

**Funcionalidades:**
- ✅ Verificación del entorno local (Git, Docker, Node.js)
- ✅ Diagnóstico completo del VPS
- ✅ Verificación de conectividad y servicios
- ✅ Estado de contenedores y logs
- ✅ Resumen del sistema

**Ejemplo de uso:**
```powershell
# Verificar todo el sistema
.\check-system.ps1 all

# Solo verificar local
.\check-system.ps1 local

# Solo verificar VPS
.\check-system.ps1 vps
```

## 🔄 Flujo de Trabajo Recomendado

### Para Cambios Directos (Rápido)
```powershell
# 1. Hacer cambios en el código
# 2. Desplegar automáticamente
.\deploy-automatic.ps1 "Descripción del cambio"
```

### Para Nuevas Funcionalidades (Recomendado)
```powershell
# 1. Iniciar desarrollo en feature
.\develop-feature.ps1 start

# 2. Hacer cambios en el código

# 3. Hacer commits regulares
.\develop-feature.ps1 commit "Implementar primera parte"

# 4. Continuar desarrollo...
.\develop-feature.ps1 commit "Agregar validaciones"

# 5. Merge a main cuando esté listo
.\develop-feature.ps1 merge "Integrar nueva funcionalidad"

# 6. Desplegar a producción
.\deploy-automatic.ps1
```

## 🛡️ Validaciones y Seguridad

### Validaciones Automáticas
- ✅ Verificación de rama correcta antes de despliegue
- ✅ Detección de cambios sin commit
- ✅ Validación de credenciales del VPS
- ✅ Verificación de conectividad
- ✅ Backup automático antes de cambios
- ✅ Verificación de servicios después del despliegue

### Manejo de Errores
- ❌ No se permite despliegue desde ramas incorrectas
- ❌ No se permite despliegue con cambios sin commit
- ❌ Rollback automático en caso de error
- ❌ Notificaciones de error detalladas

## 🌐 Configuración del VPS

### Especificaciones
- **IP:** 69.62.107.86
- **Directorio:** `/root/solucioning-deploy`
- **Puertos:** 
  - Frontend: 3000
  - Backend: 5173
  - Base de datos: 5432

### Servicios
- **Frontend:** React/Vite
- **Backend:** Node.js/TypeScript
- **Base de datos:** PostgreSQL
- **Contenedores:** Docker Compose

## 📁 Archivos de Configuración

### Requeridos
- `.env.local` - Credenciales del VPS
  ```
  VPS_USER=tu_usuario
  VPS_PASSWORD=tu_contraseña
  ```

### Opcionales
- `docker-compose.yml` - Configuración local
- `docker-compose.prod.yml` - Configuración producción

## 🚨 Troubleshooting

### Problemas Comunes

#### Error 502 Bad Gateway
```powershell
# Verificar estado del sistema
.\check-system.ps1 vps

# Si hay problemas, reiniciar manualmente en el VPS:
ssh usuario@69.62.107.86
cd /root/solucioning-deploy
docker-compose down
docker-compose up --build -d
```

#### Error de Credenciales
```powershell
# Verificar archivo .env.local
# Asegurarse de que contenga:
VPS_USER=tu_usuario
VPS_PASSWORD=tu_contraseña
```

#### Error de Git
```powershell
# Verificar estado del repositorio
.\develop-feature.ps1 status

# Si hay conflictos, resolver manualmente
git status
git add .
git commit -m "Resolve conflicts"
```

## 📊 Monitoreo y Logs

### Logs del Backend
```bash
# En el VPS
docker logs solucioning_backend --tail 50
```

### Logs del Frontend
```bash
# En el VPS
docker logs solucioning_frontend --tail 50
```

### Logs de la Base de Datos
```bash
# En el VPS
docker logs solucioning_db --tail 50
```

## 🔄 Backup y Restauración

### Backup Automático
- ✅ Se crea automáticamente antes de cada despliegue
- ✅ Ubicación: `/root/solucioning-deploy/backup_YYYYMMDD_HHMMSS.sql`

### Restauración Manual
```bash
# En el VPS
cd /root/solucioning-deploy
docker-compose exec -T db psql -U postgres employee_management < backup_YYYYMMDD_HHMMSS.sql
```

## 📈 Métricas y Rendimiento

### URLs de Monitoreo
- **Frontend:** http://69.62.107.86:3000
- **Backend Health:** http://69.62.107.86:5173/api/health
- **Backend API:** http://69.62.107.86:5173

### Verificación de Salud
```powershell
# Verificar todos los servicios
.\check-system.ps1 vps
```

## 🎯 Mejores Prácticas

### Desarrollo
1. ✅ Siempre hacer commits descriptivos
2. ✅ Probar cambios localmente antes de desplegar
3. ✅ Usar ramas feature para funcionalidades complejas
4. ✅ Verificar el sistema antes de despliegues importantes

### Despliegue
1. ✅ Usar `deploy-automatic.ps1` para todos los despliegues
2. ✅ Verificar el estado después del despliegue
3. ✅ Mantener backups regulares
4. ✅ Monitorear logs en caso de problemas

### Mantenimiento
1. ✅ Ejecutar `check-system.ps1` regularmente
2. ✅ Limpiar backups antiguos
3. ✅ Actualizar dependencias cuando sea necesario
4. ✅ Revisar logs de errores

## 📞 Soporte

### Comandos de Emergencia
```powershell
# Diagnóstico completo
.\check-system.ps1 all

# Reinicio manual en VPS
ssh usuario@69.62.107.86
cd /root/solucioning-deploy
docker-compose restart

# Rollback a versión anterior
git log --oneline -5
git checkout <commit-hash>
.\deploy-automatic.ps1 "Rollback a versión estable"
```

### Contacto
- **Repositorio:** https://github.com/toadboo23/db_solucioning
- **VPS:** 69.62.107.86
- **Documentación:** Este archivo y `/docs`

---

**Última actualización:** $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
**Versión del flujo:** 2.0
**Estado:** ✅ Activo y funcionando 