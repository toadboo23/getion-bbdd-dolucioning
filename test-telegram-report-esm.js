import axios from 'axios';

// Configuración del bot
const BOT_TOKEN = '7718484147:AAFSeHqwa6W50tGbNGkL6cvQNn8PDpro-7o';
const CHAT_ID = '7321175509';
const BASE_URL = `https://api.telegram.org/bot${BOT_TOKEN}`;

// Mensaje de prueba
const testMessage = `
�� <b>Reporte de Prueba - Sistema Solucioning</b>

✅ <b>Estado del Sistema:</b>
   • Backend: Funcionando ✅
   • Base de datos: Conectada ✅
   • Bot de Telegram: Activo ✅

�� <b>Información del Sistema:</b>
   • Fecha y hora: ${new Date().toLocaleString('es-ES', { timeZone: 'Europe/Madrid' })}
   • Entorno: Local Development
   • Puerto: 5173

🎯 <b>Prueba de Funcionalidad:</b>
   Este es un mensaje de prueba para verificar que el bot de Telegram está funcionando correctamente.

🚀 <b>Sistema Listo:</b>
   El sistema Solucioning está operativo y enviando notificaciones automáticas.

📱 <b>Configuración del Bot:</b>
   • Token: ${BOT_TOKEN.substring(0, 20)}...
   • Chat ID: ${CHAT_ID}
   • Estado: Activo

⏰ ${new Date().toLocaleString('es-ES', { timeZone: 'Europe/Madrid' })}
`;

async function sendTestMessage() {
  try {
    console.log('🤖 Enviando mensaje de prueba a Telegram...');
    console.log('�� Chat ID:', CHAT_ID);
    console.log('�� Token:', BOT_TOKEN.substring(0, 20) + '...');
    
    const response = await axios.post(`${BASE_URL}/sendMessage`, {
      chat_id: CHAT_ID,
      text: testMessage,
      parse_mode: 'HTML'
    });

    if (response.data.ok) {
      console.log('✅ Mensaje enviado exitosamente!');
      console.log('📨 ID del mensaje:', response.data.result.message_id);
      console.log('📅 Fecha de envío:', new Date(response.data.result.date * 1000).toLocaleString('es-ES'));
      console.log('👤 Enviado a:', response.data.result.chat.first_name || 'Usuario');
    } else {
      console.error('❌ Error en la respuesta:', response.data);
    }
  } catch (error) {
    console.error('❌ Error enviando mensaje:', error.response?.data || error.message);
  }
}

// Ejecutar la prueba
sendTestMessage(); 