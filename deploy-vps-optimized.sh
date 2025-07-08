#!/bin/bash

# Script optimizado para desplegar en el VPS
# Incluye limpieza de servicios innecesarios

echo "🚀 Desplegando aplicación optimizada en el VPS..."

# Verificar que estamos como root
if [ "$EUID" -ne 0 ]; then
    echo "❌ Error: Este script debe ejecutarse como root"
    exit 1
fi

# Verificar que estamos en el directorio correcto
if [ ! -f "docker-compose.yml" ]; then
    echo "❌ Error: No se encontró docker-compose.yml"
    echo "Asegúrate de estar en el directorio correcto: /root/db_local"
    exit 1
fi

echo "🧹 Paso 1: Limpiando servicios innecesarios..."

# Detener servicios innecesarios
systemctl stop php7.1-fpm php7.2-fpm php7.3-fpm php7.4-fpm php8.0-fpm php8.2-fpm php8.3-fpm php8.4-fpm 2>/dev/null || true
systemctl stop mysql redis-server memcached varnish uwsgi proftpd postfix@- 2>/dev/null || true

# Deshabilitar servicios innecesarios
systemctl disable php7.1-fpm php7.2-fpm php7.3-fpm php7.4-fpm php8.0-fpm php8.2-fpm php8.3-fpm php8.4-fpm 2>/dev/null || true
systemctl disable mysql redis-server memcached varnish uwsgi proftpd postfix@- 2>/dev/null || true

echo "📥 Paso 2: Actualizando desde rama Production..."
git fetch origin
git reset --hard origin/Production

echo "🔧 Paso 3: Deteniendo servicios Docker actuales..."
docker-compose down

echo "🐳 Paso 4: Limpiando contenedores y imágenes no utilizadas..."
docker system prune -f
docker volume prune -f

echo "🏗️ Paso 5: Construyendo y levantando servicios optimizados..."
# Usar el archivo de producción optimizado si existe
if [ -f "docker-compose.prod.yml" ]; then
    echo "📋 Usando configuración de producción optimizada..."
    docker-compose -f docker-compose.prod.yml up --build -d
else
    echo "📋 Usando configuración estándar..."
    docker-compose up --build -d
fi

echo "⏳ Paso 6: Esperando que los servicios estén listos..."
sleep 30

echo "🔍 Paso 7: Verificando estado de los servicios..."
docker-compose ps

echo "📊 Paso 8: Verificando uso de recursos..."

# Mostrar uso de memoria
echo "💾 Uso de memoria del sistema:"
free -h

# Mostrar uso de CPU
echo "🖥️  Uso de CPU:"
top -bn1 | grep "Cpu(s)" | awk '{print $2}' | cut -d'%' -f1

# Mostrar contenedores Docker y su uso de recursos
echo "🐳 Contenedores Docker y uso de recursos:"
docker stats --no-stream

echo "✅ Despliegue optimizado completado!"
echo "🌐 La aplicación está disponible en: http://69.62.107.86:3000"
echo ""
echo "📋 Comandos útiles:"
echo "   - Ver logs: docker-compose logs -f [servicio]"
echo "   - Reiniciar: docker-compose restart [servicio]"
echo "   - Ver recursos: docker stats"
echo "   - Ver servicios del sistema: systemctl list-units --type=service --state=active" 