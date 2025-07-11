#!/bin/bash

# Configuración del bot de Telegram
BOT_TOKEN="7718484147:AAFSeHqwa6W50tGbNGkL6cvQNn8PDpro-7o"
CHAT_ID="7321175509"
BASE_URL="https://api.telegram.org/bot${BOT_TOKEN}"

# Función para enviar mensaje a Telegram
send_telegram_message() {
    local message="$1"
    curl -s -X POST "${BASE_URL}/sendMessage" \
        -H "Content-Type: application/json" \
        -d "{
            \"chat_id\": \"${CHAT_ID}\",
            \"text\": \"${message}\",
            \"parse_mode\": \"HTML\"
        }"
}

# Función para obtener información detallada del sistema
get_detailed_system_info() {
    # Información básica
    HOSTNAME=$(hostname)
    UPTIME=$(uptime -p | sed 's/up //')
    OS_INFO=$(cat /etc/os-release | grep PRETTY_NAME | cut -d'"' -f2)
    KERNEL=$(uname -r)
    
    # CPU detallado
    CPU_MODEL=$(grep "model name" /proc/cpuinfo | head -1 | cut -d':' -f2 | xargs)
    CPU_CORES=$(nproc)
    CPU_USAGE=$(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | sed 's/%us,//')
    CPU_LOAD=$(uptime | awk -F'load average:' '{print $2}' | sed 's/,//g')
    
    # Memoria detallada
    MEMORY_INFO=$(free -h)
    MEMORY_TOTAL=$(echo "$MEMORY_INFO" | grep Mem | awk '{print $2}')
    MEMORY_USED=$(echo "$MEMORY_INFO" | grep Mem | awk '{print $3}')
    MEMORY_FREE=$(echo "$MEMORY_INFO" | grep Mem | awk '{print $4}')
    MEMORY_USAGE_PERCENT=$(free | grep Mem | awk '{printf("%.1f", $3/$2 * 100.0)}')
    MEMORY_AVAILABLE=$(echo "$MEMORY_INFO" | grep Mem | awk '{print $7}')
    
    # Disco detallado
    DISK_INFO=$(df -h)
    DISK_ROOT=$(echo "$DISK_INFO" | grep '/$' | awk '{print $2, $3, $4, $5}')
    DISK_HOME=$(echo "$DISK_INFO" | grep '/home' | awk '{print $2, $3, $4, $5}' || echo "N/A")
    
    # Procesos más usados
    TOP_PROCESSES=$(ps aux --sort=-%cpu | head -6 | awk '{print $2, $3, $4, $11}' | tail -5)
    
    # Servicios importantes
    NGINX_STATUS=$(systemctl is-active nginx 2>/dev/null || echo "no instalado")
    POSTGRES_STATUS=$(systemctl is-active postgresql 2>/dev/null || echo "no instalado")
    DOCKER_STATUS=$(systemctl is-active docker 2>/dev/null || echo "no instalado")
    
    # Docker containers
    DOCKER_CONTAINERS=$(docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" 2>/dev/null || echo "Docker no disponible")
    DOCKER_COUNT=$(docker ps -q 2>/dev/null | wc -l || echo "0")
    
    # Red
    NETWORK_INTERFACES=$(ip -s link show | grep -A1 "eth0\|ens3\|enp0s3" | grep "RX\|TX" | head -2)
    EXTERNAL_IP=$(curl -s ifconfig.me 2>/dev/null || echo "N/A")
    
    # Logs recientes
    RECENT_ERRORS=$(journalctl --since "1 hour ago" -p err --no-pager | tail -3 | sed 's/"/\\"/g' || echo "N/A")
    
    # Fecha y hora
    CURRENT_TIME=$(date '+%Y-%m-%d %H:%M:%S')
    TIMEZONE=$(timedatectl show --property=Timezone --value 2>/dev/null || echo "UTC")
}

# Función para generar el reporte detallado
generate_detailed_report() {
    get_detailed_system_info
    
    # Determinar el estado general
    STATUS_EMOJI="✅"
    STATUS_TEXT="Normal"
    ALERTS=""
    
    if (( $(echo "$CPU_USAGE > 80" | bc -l) )); then
        STATUS_EMOJI="⚠️"
        STATUS_TEXT="Alto uso de CPU"
        ALERTS="${ALERTS}• CPU: ${CPU_USAGE}% (Alto)\n"
    fi
    
    if (( $(echo "$MEMORY_USAGE_PERCENT > 8