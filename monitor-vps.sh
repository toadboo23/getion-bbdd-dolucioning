#!/bin/bash

# Script para monitorear el uso de recursos del VPS
# Uso: ./monitor-vps.sh [intervalo_en_segundos]

INTERVAL=${1:-30}

echo "📊 Monitoreando recursos del VPS (intervalo: ${INTERVAL}s)"
echo "Presiona Ctrl+C para detener"
echo ""

while true; do
    clear
    echo "🕐 $(date)"
    echo "=========================================="
    
    # Uso de CPU
    echo "🖥️  CPU:"
    CPU_USAGE=$(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | cut -d'%' -f1)
    echo "   Uso actual: ${CPU_USAGE}%"
    
    # Uso de memoria
    echo "💾 Memoria:"
    MEMORY_INFO=$(free -h | grep "Mem:")
    echo "   $MEMORY_INFO"
    
    # Uso de disco
    echo "💿 Disco:"
    DISK_USAGE=$(df -h / | tail -1 | awk '{print $5}')
    echo "   Uso: $DISK_USAGE"
    
    # Servicios Docker
    echo "🐳 Contenedores Docker:"
    DOCKER_CONTAINERS=$(docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | head -10)
    echo "$DOCKER_CONTAINERS"
    
    # Procesos que más CPU consumen
    echo "🔥 Top 5 procesos por CPU:"
    TOP_CPU=$(ps aux --sort=-%cpu | head -6 | awk '{print $2, $3"%", $11}' | tail -5)
    echo "$TOP_CPU"
    
    # Procesos que más memoria consumen
    echo "💾 Top 5 procesos por memoria:"
    TOP_MEM=$(ps aux --sort=-%mem | head -6 | awk '{print $2, $4"%", $11}' | tail -5)
    echo "$TOP_MEM"
    
    # Servicios del sistema activos
    echo "🔧 Servicios del sistema activos:"
    ACTIVE_SERVICES=$(systemctl list-units --type=service --state=active | grep -E "(nginx|docker|ssh|cron|fail2ban|php)" | wc -l)
    echo "   Servicios activos: $ACTIVE_SERVICES"
    
    echo ""
    echo "⏳ Actualizando en ${INTERVAL} segundos... (Ctrl+C para detener)"
    sleep $INTERVAL
done 