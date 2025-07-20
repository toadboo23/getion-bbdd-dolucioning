# 🔒 MANEJO SEGURO DE VARIABLES DE ENTORNO

## 🎯 **OBJETIVO**
Evitar conflictos entre variables de entorno locales y del VPS, asegurando que los despliegues sean seguros y no afecten la configuración de producción.

## ⚠️ **PROBLEMAS COMUNES**
- Variables de entorno locales se suben al repositorio
- Configuración de producción se sobrescribe con valores de desarrollo
- Conflictos entre docker-compose.yml y docker-compose.prod.yml
- Contraseñas y secretos expuestos en el código

## 🛡️ **SOLUCIÓN IMPLEMENTADA**

### **1. Separación de Entornos**

#### **Desarrollo Local**
- **Archivo**: `docker-compose.local.yml`
- **Variables**: Hardcodeadas para desarrollo
- **Contenedores**: Con sufijo `_local`
- **Volúmenes**: Separados de producción

#### **Producción (VPS)**
- **Archivo**: `docker-compose.prod.yml`
- **Variables**: Hardcodeadas para producción
- **Contenedores**: Sin sufijo
- **Volúmenes**: Separados de desarrollo

### **2. Archivos Protegidos**

Los siguientes archivos **NUNCA** se suben al repositorio:
```
.env*
docker-compose.local.yml
docker-compose.prod.yml
docker-compose.override.yml
config.local.*
*.local.*
```

### **3. Scripts de Desarrollo**

#### **Desarrollo Local**
```powershell
# Iniciar servicios locales
.\scripts\dev-local.ps1 up

# Detener servicios locales
.\scripts\dev-local.ps1 down

# Reiniciar servicios locales
.\scripts\dev-local.ps1 restart

# Ver logs locales
.\scripts\dev-local.ps1 logs

# Reconstruir servicios locales
.\scripts\dev-local.ps1 build

# Limpiar todo
.\scripts\dev-local.ps1 clean
```

#### **Despliegue Seguro**
```powershell
# Despliegue automático seguro
.\scripts\deploy-safe.ps1

# Despliegue con mensaje personalizado
.\scripts\deploy-safe.ps1 "Mi mensaje de commit"
```

## 📋 **FLUJO DE TRABAJO SEGURO**

### **1. Desarrollo Local**
1. Usar `docker-compose.local.yml` para desarrollo
2. Variables hardcodeadas para evitar conflictos
3. Contenedores con nombres únicos (`_local`)
4. Volúmenes separados de producción

### **2. Commit y Push**
1. Solo código, nunca variables de entorno
2. Archivos de configuración local ignorados
3. Validación automática antes del push

### **3. Despliegue al VPS**
1. Pull del código desde GitHub
2. **NO** tocar variables de entorno del VPS
3. Solo reconstruir contenedores
4. Backup automático de base de datos

## 🔧 **CONFIGURACIÓN ACTUAL**

### **Variables de Entorno Locales**
```yaml
# docker-compose.local.yml
POSTGRES_PASSWORD: dev_password_local
SESSION_SECRET: dev_session_secret_local_2024
PGADMIN_DEFAULT_PASSWORD: admin2024_local
```

### **Variables de Entorno de Producción**
```yaml
# docker-compose.prod.yml
POSTGRES_PASSWORD: SolucioningSecurePass2024!
SESSION_SECRET: SolucioningSecretKey2024!
```

## 🚨 **REGLAS IMPORTANTES**

### **✅ PERMITIDO**
- Modificar `docker-compose.local.yml` para desarrollo
- Usar scripts de desarrollo local
- Hacer commits de código (sin variables de entorno)
- Desplegar con `deploy-safe.ps1`

### **❌ PROHIBIDO**
- Crear archivos `.env` en el proyecto
- Modificar `docker-compose.prod.yml` desde local
- Subir variables de entorno al repositorio
- Usar `docker-compose.yml` original (con variables de entorno)

## 🔍 **VERIFICACIÓN**

### **Antes de Commit**
```powershell
# Verificar que no hay archivos .env
Get-ChildItem -Path . -Name ".env*" -Force

# Verificar estado del repositorio
git status
```

### **Después de Despliegue**
```powershell
# Verificar servicios en VPS
ssh root@69.62.107.86 "docker ps"

# Verificar logs
ssh root@69.62.107.86 "docker logs solucioning_backend --tail 10"
```

## 🆘 **SOLUCIÓN DE PROBLEMAS**

### **Error: Variables de entorno no encontradas**
- Usar `docker-compose.local.yml` para desarrollo
- Verificar que no hay archivos `.env` en el proyecto

### **Error: Conflictos de puertos**
- Los servicios locales usan los mismos puertos
- Detener servicios locales: `.\scripts\dev-local.ps1 down`

### **Error: Contenedores no inician**
- Reconstruir servicios: `.\scripts\dev-local.ps1 build`
- Verificar logs: `.\scripts\dev-local.ps1 logs`

### **Error en VPS después de despliegue**
- Verificar logs del VPS
- Restaurar backup si es necesario
- **NO** modificar variables de entorno del VPS

## 📞 **CONTACTO**

Si tienes problemas con variables de entorno:
1. Revisar esta documentación
2. Usar los scripts seguros
3. **NO** modificar configuración de producción manualmente 