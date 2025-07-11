// Script de prueba corregido para Telegram
const BOT_TOKEN = '7718484147:AAFSeHqwa6W50tGbNGkL6cvQNn8PDpro-7o';
const CHAT_ID = '7321175509'; // Chat ID correcto obtenido
const BASE_URL = `https://api.telegram.org/bot${BOT_TOKEN}`;

// Mensaje de prueba
const testMessage = `
 <b>Reporte de Prueba - Sistema Solucioning</b>

✅ <b>Estado del Sistema:</b>
   • Backend: Funcionando ✅
   • Base de datos: Conectada ✅
   • Bot de Telegram: Activo ✅

 <b>Información del Sistema:</b>
   • Fecha y hora: ${new Date().toLocaleString('es-ES', { timeZone: 'Europe/Madrid' })}
   • Entorno: Local Development
   • Puerto: 5173

🎯 <b>Prueba de Funcionalidad:</b>
   Este es un mensaje de prueba para verificar que el bot funciona correctamente.

🔧 <b>Configuración:</b>
   • Token: ${BOT_TOKEN.substring(0, 10)}...
   • Chat ID: ${CHAT_ID}
   • URL: ${BASE_URL}

📱 <b>Próximos pasos:</b>
   • Configurar reportes automáticos
   • Integrar con el sistema
   • Configurar alertas críticas
`;

async function sendTestMessage() {
    try {
        console.log('🤖 Enviando mensaje de prueba a Telegram...');
        console.log(` Chat ID: ${CHAT_ID}`);
        console.log(` Token: ${BOT_TOKEN.substring(0, 10)}...`);
        
        const response = await fetch(`${BASE_URL}/sendMessage`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                chat_id: CHAT_ID,
                text: testMessage,
                parse_mode: 'HTML'
            })
        });
        
        const data = await response.json();
        
        if (data.ok) {
            console.log('✅ Mensaje enviado correctamente!');
            console.log(` Message ID: ${data.result.message_id}`);
            console.log(`👤 Chat: ${data.result.chat.first_name} ${data.result.chat.last_name || ''}`);
        } else {
            console.log('❌ Error en la respuesta:', data);
        }
        
    } catch (error) {
        console.error('❌ Error de conexión:', error.message);
    }
}

sendTestMessage();