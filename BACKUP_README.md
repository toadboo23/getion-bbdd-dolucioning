# 🔄 Sistema de Backup Automatizado

## 📋 Descripción

Sistema completo de backup automatizado para el proyecto Solucioning, que incluye:
- Backup de base de datos PostgreSQL
- Backup de archivos de configuración
- Backup de logs y imágenes Docker
- Limpieza automática de backups antiguos
- Subida a almacenamiento externo (opcional)

## 🚀 Instalación

### 1. Subir scripts al VPS
```bash
# Copiar los scripts al VPS
scp backup-automated.sh setup-backup-cron.sh root@69.62.107.86:/root/solucioning-deploy/
```

### 2. Configurar el sistema
```bash
# Conectarse al VPS
ssh root@69.62.107.86

# Navegar al directorio del proyecto
cd /root/solucioning-deploy

# Configurar backup automatizado
chmod +x setup-backup-cron.sh
./setup-backup-cron.sh
```

## 📅 Programación de Backups

### Backup Diario (2:00 AM)
- **Tipo**: Solo base de datos
- **Frecuencia**: Todos los días
- **Retención**: 30 días
- **Log**: `/var/log/backup/daily.log`

### Backup Semanal (Domingo 3:00 AM)
- **Tipo**: Completo (BD + archivos + logs + imágenes)
- **Frecuencia**: Todos los domingos
- **Retención**: 30 días
- **Log**: `/var/log/backup/weekly.log`

### Backup Mensual (Día 1, 4:00 AM)
- **Tipo**: Completo + upload a almacenamiento externo
- **Frecuencia**: Primer día de cada mes
- **Retención**: 30 días
- **Log**: `/var/log/backup/monthly.log`

## 🔧 Comandos Disponibles

### Backup Manual
```bash
# Backup básico (solo base de datos)
./backup-automated.sh

# Backup completo
./backup-automated.sh --full

# Backup completo con upload
./backup-automated.sh --full --upload
```

### Gestión de Backups
```bash
# Listar backups disponibles
./backup-automated.sh list

# Ver estadísticas
./backup-automated.sh stats

# Restaurar backup específico
./backup-automated.sh restore 20241201_143022
```

### Monitoreo y Mantenimiento
```bash
# Ver estado de backups
./monitor-backups.sh

# Ejecutar prueba de backup
./test-backup.sh

# Limpiar logs antiguos
./cleanup-logs.sh
```

## 📁 Estructura de Archivos

```
/root/
├── solucioning-deploy/
│   ├── backup-automated.sh      # Script principal de backup
│   ├── setup-backup-cron.sh     # Configuración de cron
│   ├── monitor-backups.sh       # Monitoreo de backups
│   ├── test-backup.sh           # Prueba de backup
│   └── cleanup-logs.sh          # Limpieza de logs
├── backups/                     # Directorio de backups
│   ├── backup_20241201_143022_database.sql.gz
│   ├── backup_20241201_143022_config.tar.gz
│   ├── backup_20241201_143022_logs.tar.gz
│   └── backup_20241201_143022_images.tar
└── /var/log/backup/            # Logs de cron
    ├── daily.log
    ├── weekly.log
    └── monthly.log
```

## 🔐 Configuración de Almacenamiento Externo

### AWS S3 (Recomendado)
```bash
# Instalar AWS CLI
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
./aws/install

# Configurar credenciales
aws configure
```

### Variables de Entorno
```bash
# Agregar al archivo .env o configurar en el sistema
export AWS_ACCESS_KEY_ID="tu_access_key"
export AWS_SECRET_ACCESS_KEY="tu_secret_key"
export AWS_DEFAULT_REGION="us-east-1"
```

## 🛠️ Personalización

### Modificar Configuración
Editar las variables en `backup-automated.sh`:
```bash
BACKUP_DIR="/root/backups"        # Directorio de backups
DB_NAME="db_local"                # Nombre de la BD
DB_USER="postgres"                # Usuario de BD
CONTAINER_NAME="db_local-db-1"    # Nombre del contenedor
RETENTION_DAYS=30                 # Días de retención
```

### Cambiar Horarios
Editar `setup-backup-cron.sh`:
```bash
# Backup diario a las 2:00 AM
DAILY_CRON="0 2 * * * ..."

# Backup semanal domingo a las 3:00 AM
WEEKLY_CRON="0 3 * * 0 ..."

# Backup mensual día 1 a las 4:00 AM
MONTHLY_CRON="0 4 1 * * ..."
```

## 🔍 Monitoreo y Alertas

### Verificar Estado
```bash
# Verificar cron jobs
crontab -l

# Verificar logs recientes
tail -f /var/log/backup/daily.log

# Verificar espacio en disco
df -h /root/backups
```

### Alertas Recomendadas
- **Espacio en disco**: Monitorear que haya al menos 10GB libres
- **Backups fallidos**: Revisar logs diariamente
- **Tamaño de backups**: Verificar que no crezcan excesivamente

## 🚨 Solución de Problemas

### Backup Falla
```bash
# Verificar estado de Docker
docker-compose ps

# Verificar conectividad a BD
docker-compose exec db psql -U postgres -d db_local -c "SELECT 1;"

# Verificar permisos
ls -la /root/backups/
```

### Restaurar Backup
```bash
# Listar backups disponibles
./backup-automated.sh list

# Restaurar backup específico
./backup-automated.sh restore 20241201_143022

# Verificar restauración
docker-compose exec db psql -U postgres -d db_local -c "SELECT COUNT(*) FROM users;"
```

### Limpiar Manualmente
```bash
# Eliminar backups antiguos manualmente
find /root/backups -name "backup_*" -type f -mtime +30 -delete

# Limpiar logs antiguos
find /var/log/backup -name "*.log" -type f -mtime +30 -delete
```

## 📊 Estadísticas y Métricas

### Información de Backup
- **Tamaño promedio**: ~50-100MB por backup
- **Tiempo de ejecución**: 2-5 minutos
- **Frecuencia**: Diario, semanal, mensual
- **Retención**: 30 días automático

### Monitoreo de Recursos
- **Espacio en disco**: Monitorear `/root/backups/`
- **CPU**: Pico durante compresión
- **Memoria**: ~100MB durante backup
- **Red**: Solo para upload externo

## 🔒 Seguridad

### Recomendaciones
- ✅ Mantener backups en ubicación segura
- ✅ Encriptar backups sensibles
- ✅ Rotar credenciales de acceso
- ✅ Monitorear logs de acceso
- ✅ Verificar integridad regularmente

### Verificación de Integridad
```bash
# Verificar checksum de backup
sha256sum /root/backups/backup_*.gz

# Verificar integridad de archivo comprimido
gzip -t /root/backups/backup_*.gz
```

## 📞 Soporte

### Comandos de Diagnóstico
```bash
# Estado general del sistema
./monitor-backups.sh

# Prueba completa
./test-backup.sh

# Logs detallados
tail -50 /var/log/backup/daily.log
```

### Información de Contacto
- **Mantenedor**: Equipo de Desarrollo
- **Documentación**: Este archivo
- **Logs**: `/var/log/backup/`

---

**Última actualización**: Diciembre 2024
**Versión**: 1.0.0 