# 🧹 Instrucciones de Despliegue Limpio - Solucioning

## ⚠️ ADVERTENCIA IMPORTANTE

**Este proceso borrará TODO en el VPS y reinstalará desde cero. Se perderán todos los datos existentes.**

## 📋 Requisitos Previos

1. **Acceso SSH al VPS**: IP `69.62.107.86`, usuario `root`
2. **Git Bash o WSL** instalado en Windows para comandos SSH
3. **Conexión a internet** estable

## 🚀 Opciones de Despliegue

### Opción 1: Script Automático (Recomendado)

#### Para Windows (PowerShell):
```powershell
# Ejecutar desde PowerShell como administrador
.\deploy-clean-vps.ps1
```

#### Para Linux/Mac:
```bash
# Ejecutar desde terminal
./deploy-clean-vps.sh
```

### Opción 2: Manual

Si prefieres hacerlo manualmente:

1. **Conectar al VPS**:
   ```bash
   ssh root@69.62.107.86
   ```

2. **Subir el script de limpieza**:
   ```bash
   scp vps-clean-install.sh root@69.62.107.86:/opt/
   ```

3. **Ejecutar la limpieza**:
   ```bash
   ssh root@69.62.107.86 "cd /opt && chmod +x vps-clean-install.sh && ./vps-clean-install.sh"
   ```

## 🔄 Proceso de Limpieza

El script realizará las siguientes acciones:

### 1. Limpieza Completa
- ✅ Detener todos los contenedores Docker
- ✅ Eliminar todas las imágenes Docker
- ✅ Eliminar todos los volúmenes Docker
- ✅ Eliminar todas las redes Docker
- ✅ Limpieza completa del sistema Docker
- ✅ Eliminar directorio del proyecto
- ✅ Limpiar archivos temporales

### 2. Reinstalación
- ✅ Actualizar sistema operativo
- ✅ Instalar dependencias básicas
- ✅ Instalar Docker y Docker Compose
- ✅ Clonar repositorio desde GitHub
- ✅ Configurar variables de entorno
- ✅ Configurar firewall
- ✅ Construir y levantar contenedores

### 3. Verificación
- ✅ Verificar estado de contenedores
- ✅ Verificar logs de servicios
- ✅ Probar endpoints
- ✅ Mostrar información de acceso

## ⏱️ Tiempo Estimado

- **Limpieza**: 2-3 minutos
- **Reinstalación**: 5-10 minutos
- **Verificación**: 1-2 minutos
- **Total**: 8-15 minutos

## 📊 Información Post-Despliegue

### URLs de Acceso
- **Frontend**: http://69.62.107.86:3000
- **Backend API**: http://69.62.107.86:5173
- **Base de datos**: 69.62.107.86:5432

### Usuarios Disponibles
```
Super Admin: admin@dvv5.com / admin123
Super Admin: lvega@solucioning.net / 84739265
Super Admin: superadmin@solucioning.net / 39284756
```

### Comandos Útiles

#### Conectar al VPS:
```bash
ssh root@69.62.107.86
```

#### Ver logs en tiempo real:
```bash
cd /opt/solucioning
docker-compose -f docker-compose.prod.yml logs -f
```

#### Reiniciar servicios:
```bash
cd /opt/solucioning
docker-compose -f docker-compose.prod.yml restart
```

#### Actualizar desde GitHub:
```bash
cd /opt/solucioning
git pull
docker-compose -f docker-compose.prod.yml up -d --build
```

#### Ver estado de contenedores:
```bash
cd /opt/solucioning
docker-compose -f docker-compose.prod.yml ps
```

## 🔒 Seguridad Post-Despliegue

### Cambios Obligatorios
1. **Cambiar contraseñas** en `/opt/solucioning/.env`
2. **Configurar backups** automáticos de la base de datos
3. **Revisar firewall** y configuraciones de seguridad

### Archivo .env a modificar:
```env
# Cambiar estas credenciales por seguridad
POSTGRES_PASSWORD=TuNuevaContraseñaSegura2024!
SESSION_SECRET=TuNuevoSecretMuyLargoYSeguro2024!
```

## 🆘 Solución de Problemas

### Error de Conexión SSH
```bash
# Verificar conectividad
ping 69.62.107.86

# Probar SSH
ssh -o ConnectTimeout=10 root@69.62.107.86
```

### Error de Permisos
```bash
# En Windows, ejecutar PowerShell como administrador
# En Linux/Mac, verificar permisos de ejecución
chmod +x deploy-clean-vps.sh
```

### Error de Docker
```bash
# Verificar instalación de Docker
docker --version
docker-compose --version

# Reiniciar Docker si es necesario
sudo systemctl restart docker
```

### Logs de Error
```bash
# Ver logs detallados
cd /opt/solucioning
docker-compose -f docker-compose.prod.yml logs --tail=50
```

## 📞 Soporte

Si encuentras problemas durante el despliegue:

1. **Revisar logs** de los contenedores
2. **Verificar conectividad** de red
3. **Comprobar recursos** del VPS (CPU, RAM, disco)
4. **Revisar firewall** y puertos abiertos

## ✅ Checklist Post-Despliegue

- [ ] Frontend accesible en http://69.62.107.86:3000
- [ ] Backend respondiendo en http://69.62.107.86:5173
- [ ] Login funcionando con usuarios super admin
- [ ] Base de datos conectada y funcionando
- [ ] Contenedores en estado "Up"
- [ ] Logs sin errores críticos
- [ ] Credenciales cambiadas por seguridad
- [ ] Backups configurados

---

**🎉 ¡Sistema Solucioning reinstalado y funcionando en el VPS!** 