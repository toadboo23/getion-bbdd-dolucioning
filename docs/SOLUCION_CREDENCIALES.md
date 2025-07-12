# 🔑 Solución Definitiva: Problema de Credenciales VPS → Local

## 📋 Problema Identificado

**Situación recurrente:** Cada vez que se clona el proyecto del VPS al entorno local, aparece el error:
- ❌ `401 Unauthorized` en `/api/auth/login`
- ❌ "Contraseña incorrecta" en la respuesta del backend
- ❌ Las credenciales `nmartinez@solucioning.net` / `39284756` no funcionan localmente

## 🔍 Causa Raíz

El hash de contraseña almacenado en los archivos `init.sql` (tanto en raíz como en `database/schemas/`) no coincide con el hash real de la base de datos del VPS en producción.

**Ejemplo del problema:**
- Hash en `init.sql`: `$2b$10$KunpNfnpDczxVRPB9rxJ4ey2RV2iRGTFtQR0ddIhvWV1.lo8QKidi`
- Hash real en VPS: `$2b$10$.excIDGjhooilgAnKOTycuoO1rYgyBgblgI.jv6/x3q96VJoTb..K`

Cuando bcrypt compara la contraseña "39284756" con el hash incorrecto, la validación falla.

## ✅ Solución Implementada

### 1. Scripts de Sincronización Automática

**Para Linux/Mac/WSL:**
- `sync-vps-credentials.sh` - Sincroniza credenciales del VPS
- `verify-credentials.sh` - Verifica que las credenciales funcionen

**Para Windows PowerShell:**
- `sync-vps-credentials.ps1` - Sincroniza credenciales del VPS  
- `verify-credentials.ps1` - Verifica que las credenciales funcionen

**Para setup completo:**
- `setup-local-development.sh` - Setup completo con sincronización automática

### 2. Qué Hacen los Scripts

Los scripts de sincronización:
1. 📡 Se conectan al VPS via SSH
2. 🔍 Obtienen el hash real de la contraseña del usuario `nmartinez@solucioning.net`
3. 📝 Actualizan los archivos `init.sql` con el hash correcto
4. 🔄 Actualizan la base de datos local si está ejecutándose
5. ✅ Verifican que el login funcione correctamente

### 3. Respaldo Automático

Los scripts crean automáticamente backups antes de modificar:
- `init.sql.backup.YYYYMMDD_HHMMSS`
- `database/schemas/init.sql.backup.YYYYMMDD_HHMMSS`

## 🚀 Uso de la Solución

### Configuración Inicial (Recomendado)

```bash
# Linux/Mac/WSL
git clone <repository-url>
cd solucioning
chmod +x setup-local-development.sh
./setup-local-development.sh
```

### Solo Sincronizar Credenciales

**Linux/Mac/WSL:**
```bash
./sync-vps-credentials.sh
```

**Windows PowerShell:**
```powershell
.\sync-vps-credentials.ps1
```

### Verificar Funcionamiento

**Linux/Mac/WSL:**
```bash
./verify-credentials.sh
```

**Windows PowerShell:**
```powershell
.\verify-credentials.ps1
```

## 🔧 Requisitos

### Para que funcionen los scripts

1. **SSH configurado** para conectar al VPS sin contraseña:
   ```bash
   ssh root@69.62.107.86
   ```

2. **Contenedores ejecutándose en el VPS:**
   - `solucioning_postgres`
   - Base de datos `employee_management` con tabla `system_users`

3. **Docker local** para actualizar la base de datos local

### Si SSH no está disponible

Puedes actualizar manualmente:

1. Conectar al VPS y obtener el hash:
   ```bash
   ssh root@69.62.107.86
   cd /root/solucioning-deploy
   docker exec solucioning_postgres psql -U postgres -d employee_management -c "SELECT password FROM system_users WHERE email = 'nmartinez@solucioning.net';"
   ```

2. Actualizar localmente con el script `fix-password.sql`:
   ```sql
   UPDATE system_users 
   SET password = 'HASH_OBTENIDO_DEL_VPS' 
   WHERE email = 'nmartinez@solucioning.net';
   ```

## 📈 Beneficios de la Solución

- ✅ **Automatización completa** - No más intervención manual
- ✅ **Detección automática** - Los scripts detectan y corrigen la incompatibilidad
- ✅ **Respaldos automáticos** - Nunca se pierden configuraciones previas
- ✅ **Verificación integrada** - Confirma que todo funciona antes de terminar
- ✅ **Cross-platform** - Funciona en Linux, Mac, Windows
- ✅ **Documentación completa** - Todo está documentado para futuros desarrolladores

## 🔄 Flujo de Trabajo Recomendado

1. **Clonar proyecto:**
   ```bash
   git clone <repository-url>
   cd solucioning
   ```

2. **Setup automático:**
   ```bash
   ./setup-local-development.sh
   ```

3. **Desarrollar normalmente** - Las credenciales ya están sincronizadas

4. **Si hay problemas de login en el futuro:**
   ```bash
   ./sync-vps-credentials.sh
   ```

## 📝 Archivos Creados/Modificados

### Nuevos archivos:
- `sync-vps-credentials.sh` - Script principal (Linux/Mac)
- `sync-vps-credentials.ps1` - Script principal (Windows)
- `setup-local-development.sh` - Setup completo
- `verify-credentials.sh` - Verificación (Linux/Mac)
- `verify-credentials.ps1` - Verificación (Windows)
- `docs/SOLUCION_CREDENCIALES.md` - Esta documentación

### Archivos actualizados:
- `README.md` - Documentación de la nueva solución
- `init.sql` - Se actualiza automáticamente con el hash correcto
- `database/schemas/init.sql` - Se actualiza automáticamente (si existe)

## 🎯 Resultado Final

Después de ejecutar la solución:

- ✅ Login funciona correctamente con `nmartinez@solucioning.net` / `39284756`
- ✅ No más errores 401 Unauthorized
- ✅ Base de datos local sincronizada con VPS
- ✅ Scripts disponibles para futuros problemas
- ✅ Documentación completa para el equipo

**¡El problema recurrente de credenciales está solucionado definitivamente!** 🎉 