# 🚀 Despliegue de Solucioning en VPS

Esta guía te ayudará a desplegar el sistema Solucioning en un VPS (Virtual Private Server).

## 📋 Requisitos Previos

### VPS
- **Sistema Operativo**: Ubuntu 20.04+ o Debian 11+
- **RAM**: Mínimo 2GB (recomendado 4GB)
- **Almacenamiento**: Mínimo 20GB
- **CPU**: 2 cores mínimo
- **Acceso**: SSH con permisos de root o sudo

### Dominio (Opcional)
- Dominio configurado para apuntar a tu VPS
- Certificados SSL (Let's Encrypt)

## 🔧 Preparación del VPS

### 1. Conectar al VPS
```bash
ssh root@tu-ip-vps
```

### 2. Actualizar el sistema
```bash
apt update && apt upgrade -y
```

### 3. Instalar dependencias básicas
```bash
apt install -y curl wget git ufw
```

## 🐳 Instalación Automática

### Opción 1: Script Automático (Recomendado)
```bash
# Descargar el script de despliegue
wget https://raw.githubusercontent.com/tu-usuario/db_local/Develop/deploy-vps.sh

# Dar permisos de ejecución
chmod +x deploy-vps.sh

# Ejecutar el script
./deploy-vps.sh
```

### Opción 2: Instalación Manual

#### 1. Instalar Docker
```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
usermod -aG docker $USER
rm get-docker.sh
```

#### 2. Instalar Docker Compose
```bash
curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose
```

#### 3. Clonar el repositorio
```bash
cd /opt
git clone https://github.com/tu-usuario/db_local.git solucioning
cd solucioning
git checkout Develop
```

#### 4. Configurar variables de entorno
```bash
cp env.production.example .env
nano .env
```

Editar el archivo `.env` con tus configuraciones:
```env
# Variables de Entorno para Producción - Solucioning
POSTGRES_PASSWORD=TuPasswordSuperSeguro2024!
POSTGRES_EXTERNAL_PORT=5432
SESSION_SECRET=tu-super-secreto-session-key-muy-largo-y-seguro
BACKEND_PORT=5173
API_URL=http://tu-ip-vps:5173
FRONTEND_PORT=3000
NODE_ENV=production
```

#### 5. Desplegar la aplicación
```bash
docker-compose -f docker-compose.prod.yml build --no-cache
docker-compose -f docker-compose.prod.yml up -d
```

## 🔒 Configuración de Seguridad

### 1. Configurar Firewall
```bash
ufw allow 22/tcp    # SSH
ufw allow 80/tcp    # HTTP
ufw allow 443/tcp   # HTTPS
ufw allow 3000/tcp  # Frontend
ufw allow 5173/tcp  # Backend
ufw --force enable
```

### 2. Cambiar credenciales por defecto
```bash
# Editar el archivo .env
nano .env

# Cambiar estas líneas:
POSTGRES_PASSWORD=TuNuevoPasswordSuperSeguro
SESSION_SECRET=TuNuevoSessionSecretMuyLargo
```

### 3. Configurar SSL (Opcional)
```bash
# Instalar Certbot
apt install certbot

# Obtener certificado SSL
certbot certonly --standalone -d tu-dominio.com
```

## 📊 Verificación del Despliegue

### 1. Verificar contenedores
```bash
docker-compose -f docker-compose.prod.yml ps
```

### 2. Verificar logs
```bash
# Backend
docker-compose -f docker-compose.prod.yml logs backend

# Frontend
docker-compose -f docker-compose.prod.yml logs frontend

# Base de datos
docker-compose -f docker-compose.prod.yml logs postgres
```

### 3. Probar endpoints
```bash
# Frontend
curl http://tu-ip-vps:3000

# Backend
curl http://tu-ip-vps:5173/api/health
```

## 👥 Usuarios por Defecto

### Super Administradores
- **admin@dvv5.com** / admin123
- **lvega@solucioning.net** / 84739265
- **superadmin@solucioning.net** / 39284756

### Administradores
- **admin@solucioning.net** / (contraseña en super-admin-users.txt)
- **trafico1@solucioning.net** hasta **trafico20@solucioning.net** / (contraseñas de 8 dígitos)

## 🔧 Comandos de Mantenimiento

### Ver logs en tiempo real
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

### Actualizar aplicación
```bash
cd /opt/solucioning
git pull origin Develop
docker-compose -f docker-compose.prod.yml up -d --build
```

### Backup de base de datos
```bash
docker exec solucioning_db pg_dump -U postgres employee_management > backup_$(date +%Y%m%d_%H%M%S).sql
```

### Restaurar base de datos
```bash
docker exec -i solucioning_db psql -U postgres employee_management < backup.sql
```

## 🚨 Solución de Problemas

### Error de puerto en uso
```bash
# Verificar qué está usando el puerto
netstat -tulpn | grep :3000
netstat -tulpn | grep :5173

# Matar proceso si es necesario
kill -9 PID
```

### Error de permisos Docker
```bash
# Agregar usuario al grupo docker
usermod -aG docker $USER
newgrp docker
```

### Error de memoria insuficiente
```bash
# Verificar uso de memoria
free -h

# Limpiar Docker
docker system prune -a
```

### Error de conexión a base de datos
```bash
# Verificar logs de PostgreSQL
docker-compose -f docker-compose.prod.yml logs postgres

# Reiniciar solo la base de datos
docker-compose -f docker-compose.prod.yml restart postgres
```

## 📞 Soporte

Si encuentras problemas durante el despliegue:

1. **Verificar logs**: `docker-compose -f docker-compose.prod.yml logs`
2. **Verificar estado**: `docker-compose -f docker-compose.prod.yml ps`
3. **Revisar configuración**: Verificar archivo `.env`
4. **Reiniciar servicios**: `docker-compose -f docker-compose.prod.yml restart`

## 🔄 Actualizaciones

Para mantener el sistema actualizado:

```bash
cd /opt/solucioning
git pull origin Develop
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml build --no-cache
docker-compose -f docker-compose.prod.yml up -d
```

---

**¡El sistema Solucioning está listo para usar en producción!** 🎉 