# 🚀 Instrucciones de Instalación en VPS - Solucioning

## 📋 Datos del VPS
- **IP**: 69.62.107.86
- **Usuario**: root
- **Contraseña**: Patoloco2323@@
- **Sistema**: CloudPanel (Ubuntu/Debian)

## 🔧 Pasos de Instalación

### 1. Conectar al VPS
```bash
ssh root@69.62.107.86
# Contraseña: Patoloco2323@@
```

### 2. Descargar el script de instalación
```bash
cd /opt
wget https://raw.githubusercontent.com/toadboo23/db_local/Develop/vps-setup.sh
chmod +x vps-setup.sh
```

### 3. Ejecutar el script de instalación
```bash
./vps-setup.sh
```

### 4. Verificar la instalación
```bash
# Verificar contenedores
docker ps

# Verificar logs
docker-compose -f /opt/solucioning/docker-compose.prod.yml logs -f
```

## 📊 Información del Despliegue

### URLs de Acceso
- **Frontend**: http://69.62.107.86:3000
- **Backend API**: http://69.62.107.86:5173
- **Base de datos**: 69.62.107.86:5432 (solo acceso interno)

### Usuarios por Defecto
- **Super Admin**: admin@dvv5.com / admin123
- **Super Admin**: lvega@solucioning.net / 84739265
- **Super Admin**: superadmin@solucioning.net / 39284756

## 🔒 Configuración de Seguridad

### Cambiar credenciales por defecto
```bash
nano /opt/solucioning/.env
```

Cambiar estas líneas:
```env
POSTGRES_PASSWORD=TuNuevoPasswordSuperSeguro
SESSION_SECRET=TuNuevoSessionSecretMuyLargo
```

### Reiniciar servicios después de cambiar credenciales
```bash
cd /opt/solucioning
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml up -d
```

## 📝 Comandos de Mantenimiento

### Ver logs en tiempo real
```bash
cd /opt/solucioning
docker-compose -f docker-compose.prod.yml logs -f
```

### Reiniciar servicios
```bash
cd /opt/solucioning
docker-compose -f docker-compose.prod.yml restart
```

### Actualizar aplicación
```bash
cd /opt/solucioning
git pull origin Develop
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml build --no-cache
docker-compose -f docker-compose.prod.yml up -d
```

### Backup de base de datos
```bash
cd /opt/solucioning
docker exec solucioning_db pg_dump -U postgres employee_management > backup_$(date +%Y%m%d_%H%M%S).sql
```

## 🚨 Solución de Problemas

### Si el script falla
```bash
# Verificar logs
docker-compose -f /opt/solucioning/docker-compose.prod.yml logs

# Reiniciar Docker
systemctl restart docker

# Ejecutar script nuevamente
cd /opt
./vps-setup.sh
```

### Si los puertos están ocupados
```bash
# Verificar qué está usando los puertos
netstat -tulpn | grep :3000
netstat -tulpn | grep :5173

# Matar procesos si es necesario
kill -9 PID
```

### Si hay problemas de memoria
```bash
# Verificar uso de memoria
free -h

# Limpiar Docker
docker system prune -a
```

## ✅ Verificación Final

### 1. Acceder al frontend
- Abrir http://69.62.107.86:3000 en el navegador
- Verificar que la página de login cargue

### 2. Probar autenticación
- Iniciar sesión con admin@dvv5.com / admin123
- Verificar que el dashboard cargue

### 3. Probar funcionalidades
- Verificar lista de empleados
- Probar filtros por flota
- Probar exportación de datos

### 4. Verificar logs
```bash
cd /opt/solucioning
docker-compose -f docker-compose.prod.yml logs backend --tail=50
```

## 📞 Contacto de Emergencia

En caso de problemas críticos:
1. Revisar logs: `docker-compose -f /opt/solucioning/docker-compose.prod.yml logs -f`
2. Reiniciar servicios: `docker-compose -f /opt/solucioning/docker-compose.prod.yml restart`
3. Contactar al equipo de desarrollo

---

**¡El sistema Solucioning estará funcionando en http://69.62.107.86:3000!** 🎉 