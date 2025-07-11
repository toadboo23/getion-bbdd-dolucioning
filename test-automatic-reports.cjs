const BOT_TOKEN = '7718484147:AAFSeHqwa6W50tGbNGkL6cvQNn8PDpro-7o';
const CHAT_ID = '7321175509';
const BASE_URL = `https://api.telegram.org/bot${BOT_TOKEN}`;

async function sendAutomaticReport() {
    const currentTime = new Date();
    const hour = currentTime.getHours();
    
    let reportType = 'General';
    let emoji = '📊';
    
    if (hour >= 9 && hour <= 18) {
        reportType = 'Horario Laboral';
        emoji = '💼';
    } else if (hour >= 19 || hour <= 8) {
        reportType = 'Horario Nocturno';
        emoji = '🌙';
    }
    
    const message = `
${emoji} <b>Reporte Automático - ${reportType}</b>

🕐 <b>Información Temporal:</b>
   • Hora: ${currentTime.toLocaleTimeString('es-ES')}
   • Tipo: ${reportType}
   • Frecuencia: Automática

📈 <b>Estado del Sistema:</b>
   • Backend: ✅ Activo
   • Base de datos: ✅ Conectada
   • Frontend: ✅ Disponible
   • Docker: ✅ Funcionando

🔧 <b>Configuración:</b>
   • Reportes cada hora: ✅ Configurado
   • Alertas automáticas: ✅ Activas
   • Monitoreo VPS: ✅ Listo

�� <b>Test de Automatización:</b>
   • Este reporte se generaría automáticamente
   • Simulando el comportamiento en VPS
   • Sistema de monitoreo funcionando correctamente
    `;

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
        console.error('❌ Error enviando reporte automático:', error.message);
        return false;
    }
}

async function testAutomaticReports() {
    console.log('🤖 Iniciando test de reportes automáticos...');
    
    // Simular reportes cada 30 segundos (para test)
    for (let i = 1; i <= 3; i++) {
        console.log(`📊 Enviando reporte automático ${i}/3...`);
        const success = await sendAutomaticReport();
        
        if (success) {
            console.log(`✅ Reporte ${i} enviado correctamente`);
        } else {
            console.log(`❌ Error en reporte ${i}`);
        }
        
        // Esperar 30 segundos entre reportes
        if (i < 3) {
            console.log('⏳ Esperando 30 segundos para el siguiente reporte...');
            await new Promise(resolve => setTimeout(resolve, 30000));
        }
    }
    
    console.log('✅ Test de reportes automáticos completado');
}

testAutomaticReports();