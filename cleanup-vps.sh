#!/bin/bash

# Script para limpiar servicios innecesarios del VPS
# Ejecutar como root en el VPS

echo "🧹 Limpiando servicios innecesarios del VPS..."

# Verificar que estamos como root
if [ "$EUID" -ne 0 ]; then
    echo "❌ Error: Este script debe ejecutarse como root"
    exit 1
fi

echo "🛑 Deteniendo servicios innecesarios..."

# Detener servicios PHP innecesarios
systemctl stop php7.1-fpm
systemctl stop php7.2-fpm
systemctl stop php7.3-fpm
systemctl stop php7.4-fpm
systemctl stop php8.0-fpm
systemctl stop php8.2-fpm
systemctl stop php8.3-fpm
systemctl stop php8.4-fpm

# Detener servicios de base de datos innecesarios
systemctl stop mysql
systemctl stop redis-server
systemctl stop memcached

# Detener servicios web innecesarios
systemctl stop varnish
systemctl stop uwsgi
systemctl stop proftpd

# Detener servicios de correo innecesarios
systemctl stop postfix@-

echo "🚫 Deshabilitando servicios para que no se inicien automáticamente..."

# Deshabilitar servicios PHP
systemctl disable php7.1-fpm
systemctl disable php7.2-fpm
systemctl disable php7.3-fpm
systemctl disable php7.4-fpm
systemctl disable php8.0-fpm
systemctl disable php8.2-fpm
systemctl disable php8.3-fpm
systemctl disable php8.4-fpm

# Deshabilitar servicios de base de datos
systemctl disable mysql
systemctl disable redis-server
systemctl disable memcached

# Deshabilitar servicios web
systemctl disable varnish
systemctl disable uwsgi
systemctl disable proftpd

# Deshabilitar servicios de correo
systemctl disable postfix@-

echo "🔧 Configurando solo los servicios necesarios..."

# Mantener solo PHP 8.1 (si es necesario para algún servicio)
systemctl enable php8.1-fpm
systemctl start php8.1-fpm

# Mantener nginx
systemctl enable nginx
systemctl start nginx

# Mantener Docker
systemctl enable docker
systemctl start docker

# Mantener SSH
systemctl enable ssh
systemctl start ssh

# Mantener servicios del sistema
systemctl enable cron
systemctl enable fail2ban
systemctl enable rsyslog

echo "📊 Verificando uso de recursos..."

# Mostrar servicios activos
echo "🔍 Servicios activos:"
systemctl list-units --type=service --state=active | grep -E "(nginx|docker|ssh|cron|fail2ban|php8.1)"

# Mostrar uso de memoria
echo "💾 Uso de memoria:"
free -h

# Mostrar uso de CPU
echo "🖥️  Uso de CPU:"
top -bn1 | grep "Cpu(s)" | awk '{print $2}' | cut -d'%' -f1

echo "✅ Limpieza completada!"
echo "📋 Servicios innecesarios detenidos y deshabilitados"
echo "🌐 Solo se mantienen los servicios esenciales"
echo ""
echo "📋 Para verificar el estado:"
echo "   systemctl status [servicio]"
echo ""
echo "📋 Para ver todos los servicios:"
echo "   systemctl list-units --type=service --state=active" 