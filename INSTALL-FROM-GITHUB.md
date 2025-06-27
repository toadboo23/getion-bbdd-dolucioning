# Instalación desde GitHub - Solucioning

## 🚀 Instalación Automática en VPS

### Paso 1: Preparar el VPS

Conectarse al VPS:
```bash
ssh root@69.62.107.86
```

### Paso 2: Limpiar instalación anterior (si existe)

```bash
# Detener y eliminar contenedores
docker stop $(docker ps -aq) 2>/dev/null || true
docker rm $(docker ps -aq) 2>/dev/null || true

# Eliminar imágenes
docker rmi $(docker images -q) 2>/dev/null || true

# Limpiar Docker completamente
docker system prune -af --volumes

# Eliminar directorio anterior
rm -rf /opt/solucioning
```

### Paso 3: Instalar Docker (si no está instalado)

```bash
# Actualizar sistema
apt update && apt upgrade -y

# Instalar dependencias
apt install -y curl wget git unzip software-properties-common apt-transport-https ca-certificates gnupg lsb-release

# Instalar Docker
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
apt update
apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Habilitar y iniciar Docker
systemctl enable docker
systemctl start docker

# Instalar Docker Compose
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose
```

### Paso 4: Clonar desde GitHub

```bash
# Crear directorio
mkdir -p /opt/solucioning
cd /opt/solucioning

# Clonar repositorio (REEMPLAZAR CON TU URL DE GITHUB)
git clone https://github.com/tu-usuario/solucioning.git .
```

### Paso 5: Configurar variables de entorno

```bash
# Copiar archivo de configuración
cp env.production .env

# Configurar IP del VPS
VPS_IP="69.62.107.86"
sed -i "s|API_URL=http://localhost:5173|API_URL=http://$VPS_IP:5173|g" .env
sed -i "s|API_URL=http://69.62.107.86:5173|API_URL=http://$VPS_IP:5173|g" .env

# Dar permisos al script de entrada
chmod +x docker-entrypoint.sh
```

### Paso 6: Construir y ejecutar

```bash
# Construir contenedores desde cero
docker-compose -f docker-compose.prod.yml build --no-cache

# Iniciar servicios
docker-compose -f docker-compose.prod.yml up -d

# Esperar a que los servicios estén listos
sleep 30

# Verificar estado
docker-compose -f docker-compose.prod.yml ps
```

### Paso 7: Verificar instalación

```bash
# Ver logs del backend
docker logs solucioning_backend --tail 10

# Ver logs del frontend
docker logs solucioning_frontend --tail 5

# Probar endpoints
curl -s http://69.62.107.86:5173/api/health
curl -s http://69.62.107.86:3000 | head -5
```

## 📋 Verificación Final

### URLs de Acceso
- **Frontend**: http://69.62.107.86:3000
- **Backend API**: http://69.62.107.86:5173

### Credenciales de Acceso
- **Super Admin**: `superadmin@glovo.com` / `superadmin123`
- **Admin**: `admin@glovo.com` / `admin123`
- **User**: `user@glovo.com` / `user123`

### Comandos Útiles

```bash
# Ver logs en tiempo real
docker-compose -f docker-compose.prod.yml logs -f

# Reiniciar servicios
docker-compose -f docker-compose.prod.yml restart

# Detener servicios
docker-compose -f docker-compose.prod.yml down

# Backup de base de datos
docker exec solucioning_db pg_dump -U postgres employee_management > backup.sql

# Ver uso de recursos
docker stats
```

## 🔧 Solución de Problemas

### Error de puerto en uso
```bash
# Verificar qué está usando el puerto
netstat -tlnp | grep :3000
netstat -tlnp | grep :5173

# Matar proceso si es necesario
kill -9 <PID>
```

### Error de permisos
```bash
# Dar permisos completos al directorio
chmod -R 755 /opt/solucioning
```

### Error de memoria insuficiente
```bash
# Limpiar Docker
docker system prune -af

# Verificar memoria disponible
free -h
```

### Error de conexión a base de datos
```bash
# Verificar logs de PostgreSQL
docker logs solucioning_db

# Reiniciar solo la base de datos
docker restart solucioning_db
```

## 🎯 Instalación Exitosa

Si todo está funcionando correctamente, deberías ver:

1. ✅ Contenedores ejecutándose: `docker ps`
2. ✅ Backend respondiendo: `curl http://69.62.107.86:5173/api/health`
3. ✅ Frontend accesible: `curl http://69.62.107.86:3000`
4. ✅ Login funcionando en el navegador

¡El sistema Solucioning está listo para usar! 🚀 