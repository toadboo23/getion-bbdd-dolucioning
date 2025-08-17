# 🔧 Configuración de GitHub Actions para Deployment Seguro

## 📋 **Secrets Requeridos**

Para que el workflow funcione correctamente, necesitas configurar los siguientes secrets en tu repositorio de GitHub:

### **Configuración del VPS**
- `VPS_HOST`: IP o dominio del VPS
- `VPS_USER`: Usuario SSH (ej: `root`)
- `VPS_PASSWORD`: Contraseña del usuario SSH

### **Configuración Opcional**
- `VPS_PORT`: Puerto SSH (por defecto: `22`)
- `VPS_KEY`: Clave SSH privada (alternativa a password)

## 🔐 **Cómo Configurar los Secrets**

### **Paso 1: Ir a Settings del Repositorio**
1. Ve a tu repositorio en GitHub
2. Haz clic en **Settings** (Configuración)
3. En el menú lateral, haz clic en **Secrets and variables** → **Actions**

### **Paso 2: Agregar los Secrets**
1. Haz clic en **New repository secret**
2. Agrega cada secret con su valor correspondiente:

```
VPS_HOST = 192.168.1.100 (o tu IP del VPS)
VPS_USER = root
VPS_PASSWORD = tu_contraseña_del_vps
VPS_PORT = 22 (opcional)
```

### **Paso 3: Verificar Configuración**
Los secrets aparecerán como `***` en la interfaz de GitHub por seguridad.

## 🚀 **Activación del Workflow**

### **Workflow Principal**
- **Archivo**: `.github/workflows/deploy-source-only.yml`
- **Trigger**: Push a la rama `main`
- **Función**: Deploy automático de solo código fuente

### **Workflow de Backup (Opcional)**
- **Archivo**: `.github/workflows/deploy.yml` (existente)
- **Función**: Deploy completo (mantener como respaldo)

## 📊 **Monitoreo del Deployment**

### **En GitHub**
1. Ve a la pestaña **Actions** de tu repositorio
2. Verás el workflow ejecutándose en tiempo real
3. Puedes ver logs detallados de cada paso

### **En el VPS**
```bash
# Verificar backups creados
ls -la /root/solucioning-deploy/backups/

# Verificar estado de contenedores
docker ps

# Ver logs del backend
docker logs solucioning_backend

# Ver logs del frontend
docker logs solucioning_frontend
```

## 🛡️ **Seguridad**

### **Recomendaciones**
1. **Usar claves SSH** en lugar de contraseñas cuando sea posible
2. **Limitar acceso SSH** solo desde IPs específicas
3. **Rotar contraseñas** regularmente
4. **Monitorear logs** de acceso SSH

### **Configuración SSH con Clave**
Si prefieres usar claves SSH:

1. **Generar clave SSH** (si no tienes una):
```bash
ssh-keygen -t rsa -b 4096 -C "github-actions@tu-dominio.com"
```

2. **Agregar clave pública al VPS**:
```bash
# En tu máquina local
ssh-copy-id root@TU_IP_VPS
```

3. **Configurar secret en GitHub**:
```
VPS_KEY = contenido_de_tu_clave_privada
```

## 🔄 **Rollback en Caso de Problemas**

### **Rollback Automático**
El workflow crea backups automáticamente en:
```
/root/solucioning-deploy/backups/YYYYMMDD_HHMMSS/
```

### **Rollback Manual**
```bash
# Conectar al VPS
ssh root@TU_IP_VPS

# Ir al directorio del proyecto
cd /root/solucioning-deploy

# Listar backups disponibles
ls -la backups/

# Restaurar desde backup específico
BACKUP_DIR="backups/20240115_143022"
cp -r $BACKUP_DIR/client-src-backup client/src
cp -r $BACKUP_DIR/server-backup server
cp -r $BACKUP_DIR/shared-backup shared

# Reiniciar servicios
docker-compose restart backend frontend
```

## 📝 **Logs y Debugging**

### **Logs del Workflow**
- **GitHub Actions**: Ver en la pestaña Actions
- **VPS**: Los logs se muestran en la consola del workflow

### **Comandos de Debugging**
```bash
# Verificar conectividad SSH
ssh -p 22 root@TU_IP_VPS "echo 'Conexión exitosa'"

# Verificar directorio del proyecto
ssh root@TU_IP_VPS "ls -la /root/solucioning-deploy/"

# Verificar contenedores
ssh root@TU_IP_VPS "docker ps"

# Ver logs de contenedores
ssh root@TU_IP_VPS "docker logs solucioning_backend --tail 20"
```

## ✅ **Verificación Final**

### **Checklist de Configuración**
- [ ] Secrets configurados en GitHub
- [ ] Acceso SSH funcionando
- [ ] Workflow activado
- [ ] Primer deployment exitoso
- [ ] Backup automático funcionando
- [ ] Rollback probado

### **Prueba de Deployment**
1. Haz un commit a la rama `main`
2. Ve a la pestaña **Actions** en GitHub
3. Verifica que el workflow se ejecute correctamente
4. Confirma que los cambios lleguen al VPS
5. Verifica que la aplicación funcione correctamente

## 🎯 **Beneficios de Esta Configuración**

1. **🔒 Seguridad**: Solo código fuente, no configuración del servidor
2. **⚡ Velocidad**: Deploy rápido y eficiente
3. **🔄 Confiabilidad**: Backup automático y rollback disponible
4. **📈 Escalabilidad**: Fácil de mantener y extender
5. **🛡️ Estabilidad**: No afecta servicios existentes
