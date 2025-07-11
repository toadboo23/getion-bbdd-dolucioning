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

# Función para obtener información del sistema
get_system_info() {
    # Información básica del sistema
    HOSTNAME=$(hostname)
    UPTIME=$(uptime -p | sed 's/up //')
    LOAD_AVERAGE=$(uptime | awk -F'load average:' '{print $2}' | sed 's/,//g')
    
    # Uso de CPU
    CPU_USAGE=$(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | sed 's/%us,//')
    
    # Uso de memoria
    MEMORY_INFO=$(free -h | grep Mem)
    MEMORY_TOTAL=$(echo $MEMORY_INFO | awk '{print $2}')
    MEMORY_USED=$(echo $MEMORY_INFO | awk '{print $3}')
    MEMORY_FREE=$(echo $MEMORY_INFO | awk '{print $4}')
    MEMORY_USAGE_PERCENT=$(free | grep Mem | awk '{printf("%.1f", $3/$2 * 100.0)}')
    
    # Uso de disco
    DISK_INFO=$(df -h / | tail -1)
    DISK_TOTAL=$(echo $DISK_INFO | awk '{print $2}')
    DISK_USED=$(echo $DISK_INFO | awk '{print $3}')
    DISK_FREE=$(echo $DISK_INFO | awk '{print $4}')
    DISK_USAGE_PERCENT=$(echo $DISK_INFO | awk '{print $5}' | sed 's/%//')
    
    # Procesos
    TOTAL_PROCESSES=$(ps aux | wc -l)
    RUNNING_PROCESSES=$(ps aux | grep -v grep | grep -c "R")
    
    # Servicios Docker
    DOCKER_CONTAINERS=$(docker ps --format "table {{.Names}}\t{{.Status}}" 2>/dev/null || echo "Docker no disponible")
    DOCKER_COUNT=$(docker ps -q 2>/dev/null | wc -l || echo "0")
    
    # Temperatura (si está disponible)
    TEMPERATURE=$(sensors 2>/dev/null | grep "Core" | head -1 | awk '{print $3}' || echo "N/A")
    
    # Red
    NETWORK_INTERFACES=$(ip -s link show | grep -A1 "eth0\|ens3\|enp0s3" | grep "RX\|TX" | head -2)
    
    # Fecha y hora
    CURRENT_TIME=$(date '+%Y-%m-%d %H:%M:%S')
    TIMEZONE=$(timedatectl show --property=Timezone --value 2>/dev/null || echo "UTC")
}

# Función para generar el reporte
generate_report() {
    get_system_info
    
    # Determinar el estado general del sistema
    STATUS_EMOJI="✅"
    STATUS_TEXT="Normal"
    
    if (( $(echo "$CPU_USAGE > 80" | bc -l) )); then
        STATUS_EMOJI="⚠️"
        STATUS_TEXT="Alto uso de CPU"
    fi
    
    if (( $(echo "$MEMORY_USAGE_PERCENT > 85" | bc -l) )); then
        STATUS_EMOJI="⚠️"
        STATUS_TEXT="Alto uso de memoria"
    fi
    
    if (( $(echo "$DISK_USAGE_PERCENT > 90" | bc -l) )); then
        STATUS_EMOJI="🚨"
        STATUS_TEXT="Disco casi lleno"
    fi
    
    # Crear el mensaje
    MESSAGE="
🖥️ <b>Reporte del VPS - Solucioning</b>

${STATUS_EMOJI} <b>Estado General:</b> ${STATUS_TEXT}

�� <b>Información del Sistema:</b>
   • Servidor: ${HOSTNAME}
   • Tiempo activo: ${UPTIME}
   • Fecha/Hora: ${CURRENT_TIME}
   • Zona horaria: ${TIMEZONE}

⚡ <b>Recursos del Sistema:</b>
   • CPU: ${CPU_USAGE}% (Promedio: ${LOAD_AVERAGE})
   • Memoria: ${MEMORY_USED}/${MEMORY_TOTAL} (${MEMORY_USAGE_PERCENT}%)
   • Disco: ${DISK_USED}/${DISK_TOTAL} (${DISK_USAGE_PERCENT}%)
   • Temperatura: ${TEMPERATURE}

🔄 <b>Procesos:</b>
   • Total: ${TOTAL_PROCESSES}
   • En ejecución: ${RUNNING_PROCESSES}

🐳 <b>Docker:</b>
   • Contenedores activos: ${DOCKER_COUNT}

�� <b>Load Average:</b>
   • 1 min: $(echo $LOAD_AVERAGE | awk '{print $1}')
   • 5 min: $(echo $LOAD_AVERAGE | awk '{print $2}')
   • 15 min: $(echo $LOAD_AVERAGE | awk '{print $3}')
"

    # Agregar información de contenedores si Docker está disponible
    if [ "$DOCKER_COUNT" != "0" ] && [ "$DOCKER_COUNT" != "Docker no disponible" ]; then
        MESSAGE="${MESSAGE}

🐳 <b>Contenedores Docker:</b>
$(docker ps --format "   • {{.Names}}: {{.Status}}" 2>/dev/null | head -5)"
    fi
    
    # Agregar alertas si es necesario
    if [ "$STATUS_EMOJI" != "✅" ]; then
        MESSAGE="${MESSAGE}

⚠️ <b>Alertas:</b>
   • ${STATUS_TEXT}"
    fi
    
    echo "$MESSAGE"
}

# Función principal
main() {
    echo "🤖 Generando reporte del VPS..."
    
    # Generar y enviar el reporte
    REPORT=$(generate_report)
    send_telegram_message "$REPORT"
    
    if [ $? -eq 0 ]; then
        echo "✅ Reporte enviado correctamente"
    else
        echo "❌ Error enviando el reporte"
    fi
}

# Ejecutar si se llama directamente
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main
fi 