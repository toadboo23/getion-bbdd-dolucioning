const BOT_TOKEN = '7718484147:AAFSeHqwa6W50tGbNGkL6cvQNn8PDpro-7o';
const CHAT_ID = '7321175509';
const BASE_URL = `https://api.telegram.org/bot${BOT_TOKEN}`;

async function sendAlert(message, level = 'info') {
    const emoji = {
        info: 'ℹ️',
        warning: '⚠️',
        error: '🚨'
    };

    const alertMessage = `
${emoji[level]} <b>Test de Alertas - Sistema Solucioning</b>

${message}

⏰ ${new Date().toLocaleString('es-ES')}
🔧 <i>Este es un test del sistema de alertas</i>
    `;

    try {
        console.log(`📤 Enviando alerta ${level}...`);
        
        const response = await fetch(`${BASE_URL}/sendMessage`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                chat_id: CHAT_ID,
                text: alertMessage,
                parse_mode: 'HTML'
            })
        });
        
        const data = await response.json();
        
        if (data.ok) {
            console.log(`✅ Alerta ${level} enviada correctamente!`);
            console.log(` Message ID: ${data.result.message_id}`);
            return true;
        } else {
            console.log(`❌ Error en la respuesta:`, data);
            return false;
        }
    } catch (error) {
        console.error('❌ Error enviando alerta:', error.message);
        return false;
    }
}

async function testAlerts() {
    try {
        console.log('🚨 Iniciando test de alertas...');
        console.log(`📱 Chat ID: ${CHAT_ID}`);
        console.log(`🔑 Token: ${BOT_TOKEN.substring(0, 10)}...`);
        
        // Test de alerta informativa
        console.log('\n📤 Enviando alerta informativa...');
        const infoResult = await sendAlert('Sistema funcionando correctamente. Todos los servicios están activos.', 'info');
        console.log(`Resultado info: ${infoResult}`);
        
        // Esperar 2 segundos
        console.log('⏳ Esperando 2 segundos...');
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Test de alerta de advertencia
        console.log('\n⚠️ Enviando alerta de advertencia...');
        const warningResult = await sendAlert('Atención: Uso de CPU elevado detectado. Monitorear sistema.', 'warning');
        console.log(`Resultado warning: ${warningResult}`);
        
        // Esperar 2 segundos
        console.log('⏳ Esperando 2 segundos...');
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Test de alerta de error
        console.log('\n🚨 Enviando alerta de error...');
        const errorResult = await sendAlert('ERROR: Conexión a base de datos perdida. Requiere intervención inmediata.', 'error');
        console.log(`Resultado error: ${errorResult}`);
        
        console.log('\n✅ Test de alertas completado!');
        console.log(`📊 Resumen: Info=${infoResult}, Warning=${warningResult}, Error=${errorResult}`);
        
    } catch (error) {
        console.error('❌ Error en el test de alertas:', error);
    }
}

// Ejecutar el test
console.log('🚀 Iniciando script de test de alertas...');
testAlerts().then(() => {
    console.log('🎉 Script completado exitosamente!');
}).catch(error => {
    console.error('💥 Error fatal en el script:', error);
}); 