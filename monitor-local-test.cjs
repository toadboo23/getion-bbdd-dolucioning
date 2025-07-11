const os = require('os');
const { exec } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);

// Configuración del bot de Telegram
const BOT_TOKEN = '7718484147:AAFSeHqwa6W50tGbNGkL6cvQNn8PDpro-7o';
const CHAT_ID = '7321175509';
const BASE_URL = `https://api.telegram.org/bot${BOT_TOKEN}`;

// Función para enviar mensaje a Telegram
async function sendTelegramMessage(message) {
    try {
        const response = await fetch(`${BASE_URL}/sendMessage`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                chat_id: CHAT_ID,
                text: message,
                parse_mode: 'HTML'
            })
        });
        
        const data = await response.json();
        return data.ok;
    } catch (error) {
        console.error('❌ Error enviando mensaje:', error.message);
        return false;
    }
}

// Función para obtener información del sistema
async function getSystemInfo() {
    const hostname = os.hostname();
    const platform = os.platform();
    const arch = os.arch();
    const uptime = Math.floor(os.uptime() / 3600); // horas
    
    // CPU
    const cpuUsage = os.loadavg();
    const cpuCount = os.cpus().length;
    const cpuModel = os.cpus()[0].model;
    
    // Memoria
    const totalMemory = Math.round(os.totalmem() / (1024 * 1024 * 1024)); // GB
    const freeMemory = Math.round(os.freemem() / (1024 * 1024 * 1024)); // GB
    const usedMemory = totalMemory - freeMemory;
    const memoryUsagePercent = Math.round((usedMemory / totalMemory) * 100);
    
    // Docker (si está disponible)
    let dockerCount = 0;
    let dockerContainers = 'N/A';
    
    try {
        const { stdout } = await execAsync('docker ps -q');
        dockerCount = stdout.trim().split('\n').filter(line => line.length > 0).length;
        
        if (dockerCount > 0) {
            const { stdout: containers } = await execAsync('docker ps --format "table {{.Names}}\t{{.Status}}"');
            dockerContainers = containers.trim();
        }
    } catch (error) {
        dockerContainers = 'Docker no disponible';
    }
    
    // Fecha y hora
    const currentTime = new Date().toLocaleString('es-ES');
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    
    return {
        hostname,
        platform,
        arch,
        uptime,
        cpuUsage,
        cpuCount,
        cpuModel,
        totalMemory,
        usedMemory,
        freeMemory,
        memoryUsagePercent,
        dockerCount,
        dockerContainers,
        currentTime,
        timezone
    };
}

// Función para generar el reporte
async function generateReport() {
    const sysInfo = await getSystemInfo();
    
    // Determinar el estado general
    let statusEmoji = '✅';
    let statusText = 'Normal';
    let alerts = '';
    
    if (sysInfo.cpuUsage[0] > 2.0) { // Load average > 2
        statusEmoji = '⚠️';
        statusText = 'Alto uso de CPU';
        alerts += `• CPU Load: ${sysInfo.cpuUsage[0].toFixed(2)} (Alto)\n`;
    }
    
    if (sysInfo.memoryUsagePercent > 85) {
        statusEmoji = '⚠️';
        statusText = 'Alto uso de memoria';
        alerts += `• Memoria: ${sysInfo.memoryUsagePercent}% (Alto)\n`;
    }
    
    const message = `
🖥️ <b>Reporte Local - Sistema Solucioning</b>

${statusEmoji} <b>Estado General:</b> ${statusText}

🖥️ <b>Información del Sistema:</b>
   • Computadora: ${sysInfo.hostname}
   • Plataforma: ${sysInfo.platform} (${sysInfo.arch})
   • Tiempo activo: ${sysInfo.uptime} horas
   • Fecha/Hora: ${sysInfo.currentTime}
   • Zona horaria: ${sysInfo.timezone}

⚡ <b>CPU:</b>
   • Modelo: ${sysInfo.cpuModel}
   • Cores: ${sysInfo.cpuCount}
   • Load Average: ${sysInfo.cpuUsage[0].toFixed(2)}, ${sysInfo.cpuUsage[1].toFixed(2)}, ${sysInfo.cpuUsage[2].toFixed(2)}

 <b>Memoria:</b>
   • Total: ${sysInfo.totalMemory} GB
   • Usado: ${sysInfo.usedMemory} GB
   • Libre: ${sysInfo.freeMemory} GB
   • Uso: ${sysInfo.memoryUsagePercent}%

🐳 <b>Docker:</b>
   • Contenedores activos: ${sysInfo.dockerCount}

🧪 <b>Test de Monitoreo:</b>
   • Este es un reporte de prueba del sistema de monitoreo
   • Funcionando correctamente en entorno local
   • Listo para implementar en VPS
`;

    // Agregar alertas si existen
    if (alerts) {
        return message + `\n⚠️ <b>Alertas:</b>\n${alerts}`;
    }
    
    return message;
}

// Función principal
async function main() {
    try {
        console.log('🤖 Iniciando test completo del sistema de monitoreo...');
        console.log('📊 Generando reporte del sistema local...');
        
        const report = await generateReport();
        console.log('�� Enviando reporte a Telegram...');
        
        const success = await sendTelegramMessage(report);
        
        if (success) {
            console.log('✅ Test completado exitosamente!');
            console.log('📱 Reporte enviado a Telegram correctamente');
            console.log('�� Sistema listo para implementar en VPS');
        } else {
            console.log('❌ Error en el test: No se pudo enviar el reporte');
        }
    } catch (error) {
        console.error('❌ Error en el test:', error.message);
    }
}

// Ejecutar si se llama directamente
if (require.main === module) {
    main();
} 