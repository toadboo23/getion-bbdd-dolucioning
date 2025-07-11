// Reemplazar node-fetch por undici para fetch compatible con CommonJS
const { fetch } = require('undici');
const si = require('systeminformation');

const BOT_TOKEN = '7718484147:AAFSeHqwa6W50tGbNGkL6cvQNn8PDpro-7o';
const CHAT_ID = '7321175509';
const BASE_URL = `https://api.telegram.org/bot${BOT_TOKEN}`;

function formatBytes(bytes) {
    if (!bytes || isNaN(bytes)) return 'N/A';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + sizes[i];
}

async function getPublicIP() {
    try {
        const response = await fetch('https://api.ipify.org?format=json');
        const data = await response.json();
        return data.ip;
    } catch (error) {
        return 'N/A';
    }
}

async function getSystemStats() {
    // si.time() es síncrono en algunas versiones
    let time = { uptime: 0 };
    try {
        time = si.time();
    } catch (e) {
        console.error('TIME error', e);
    }

    const [cpu, mem, disk, net, osInfo, temp, processes] = await Promise.all([
        si.currentLoad().catch(e => {console.error('CPU error', e); return {currentLoad:0, cpus:[]};}),
        si.mem().catch(e => {console.error('MEM error', e); return {active:0, total:0, available:0};}),
        si.fsSize().catch(e => {console.error('DISK error', e); return [{used:0, size:0}];}),
        si.networkStats().catch(e => {console.error('NET error', e); return [{rx_bytes:0, tx_bytes:0}];}),
        si.osInfo().catch(e => {console.error('OS error', e); return {distro:'N/A', release:'', arch:''};}),
        si.cpuTemperature().catch(e => {console.error('TEMP error', e); return {main:null};}),
        si.processes().catch(e => {console.error('PROC error', e); return {list:[]};})
    ]);
    
    const publicIp = await getPublicIP();

    // Debug: mostrar valores crudos
    console.log('DEBUG CPU:', cpu);
    console.log('DEBUG MEM:', mem);
    console.log('DEBUG DISK:', disk);
    console.log('DEBUG NET:', net);
    console.log('DEBUG OS:', osInfo);
    console.log('DEBUG TIME:', time);
    console.log('DEBUG TEMP:', temp);
    console.log('DEBUG PROC:', processes);

    // Top 3 procesos por uso de CPU
    const topCpu = (processes.list || [])
        .sort((a, b) => (b.pcpu||0) - (a.pcpu||0))
        .slice(0, 3)
        .map(p => `${p.name} (${(p.pcpu||0).toFixed(1)}%)`)
        .join(', ') || 'N/A';
    // Top 3 procesos por uso de RAM
    const topMem = (processes.list || [])
        .sort((a, b) => (b.pmem||0) - (a.pmem||0))
        .slice(0, 3)
        .map(p => `${p.name} (${(p.pmem||0).toFixed(1)}%)`)
        .join(', ') || 'N/A';

    return {
        cpu: cpu.currentLoad !== undefined ? cpu.currentLoad.toFixed(1) : 'N/A',
        cpuCores: Array.isArray(cpu.cpus) && cpu.cpus.length > 0 ? cpu.cpus.map((c, i) => `Core${i+1}: ${(c.load||0).toFixed(1)}%`).join(' | ') : 'N/A',
        memUsed: formatBytes(mem.active),
        memTotal: formatBytes(mem.total),
        memFree: formatBytes(mem.available),
        diskUsed: disk[0] ? formatBytes(disk[0].used) : 'N/A',
        diskTotal: disk[0] ? formatBytes(disk[0].size) : 'N/A',
        diskFree: disk[0] ? formatBytes(disk[0].size - disk[0].used) : 'N/A',
        netRx: net[0] ? formatBytes(net[0].rx_bytes) : 'N/A',
        netTx: net[0] ? formatBytes(net[0].tx_bytes) : 'N/A',
        os: osInfo.distro ? `${osInfo.distro} ${osInfo.release} (${osInfo.arch})` : 'N/A',
        uptime: time.uptime !== undefined ? (time.uptime / 3600).toFixed(1) : 'N/A',
        temp: temp.main !== null && temp.main !== undefined ? temp.main + '°C' : 'N/A',
        topCpu,
        topMem,
        publicIp
    };
}

function getAlertLevel(stats) {
    if (stats.cpu !== 'N/A' && parseFloat(stats.cpu) > 90) return '🚨 CPU ALTA';
    if (stats.memUsed !== 'N/A' && stats.memTotal !== 'N/A' && parseFloat(stats.memUsed) / parseFloat(stats.memTotal) > 0.9) return '🚨 RAM ALTA';
    if (stats.diskUsed !== 'N/A' && stats.diskTotal !== 'N/A' && parseFloat(stats.diskUsed) / parseFloat(stats.diskTotal) > 0.95) return '🚨 DISCO LLENO';
    return '✅ Todo OK';
}

async function sendAlert(message) {
    try {
        const response = await fetch(`${BASE_URL}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: CHAT_ID,
                text: message,
                parse_mode: 'HTML'
            })
        });
        const data = await response.json();
        if (!data.ok) {
            console.error('❌ Error de Telegram:', data);
        } else {
            console.log('✅ Mensaje enviado correctamente.');
        }
    } catch (error) {
        console.error('❌ Error enviando alerta a Telegram:', error.message);
    }
}

async function main() {
    try {
        const stats = await getSystemStats();
        const alert = getAlertLevel(stats);
        const msg = `
<b>📊 Estado del VPS</b>

${alert}

🖥️ <b>CPU:</b> ${stats.cpu}% (${stats.cpuCores})
🌡️ <b>Temp:</b> ${stats.temp}
💾 <b>RAM:</b> ${stats.memUsed} / ${stats.memTotal} (Libre: ${stats.memFree})
🗄️ <b>Disco:</b> ${stats.diskUsed} / ${stats.diskTotal} (Libre: ${stats.diskFree})
🌐 <b>Red:</b> ↓${stats.netRx} ↑${stats.netTx}
⏱️ <b>Uptime:</b> ${stats.uptime} horas
🖥️ <b>OS:</b> ${stats.os}
🌍 <b>IP Pública:</b> ${stats.publicIp}

<b>Procesos TOP CPU:</b> ${stats.topCpu}
<b>Procesos TOP RAM:</b> ${stats.topMem}

⏰ ${new Date().toLocaleString('es-ES')}
`;
        await sendAlert(msg);
    } catch (error) {
        console.error('❌ Error general en el script:', error.message);
    }
}

main(); 