// Script para obtener el Chat ID correcto
const BOT_TOKEN = '7718484147:AAFSeHqwa6W50tGbNGkL6cvQNn8PDpro-7o';

async function getChatId() {
    try {
        console.log('🤖 Obteniendo información del bot...');
        
        const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getUpdates`);
        const data = await response.json();
        
        console.log('�� Respuesta completa:', JSON.stringify(data, null, 2));
        
        if (data.ok && data.result.length > 0) {
            console.log('\n✅ Chat IDs encontrados:');
            data.result.forEach((update, index) => {
                if (update.message) {
                    console.log(`   ${index + 1}. Chat ID: ${update.message.chat.id}`);
                    console.log(`      Usuario: ${update.message.from.first_name} ${update.message.from.last_name || ''}`);
                    console.log(`      Username: @${update.message.from.username || 'N/A'}`);
                    console.log(`      Mensaje: ${update.message.text}`);
                    console.log('');
                }
            });
        } else {
            console.log('❌ No se encontraron mensajes. Envía un mensaje al bot primero.');
            console.log('�� Instrucciones:');
            console.log('   1. Ve a Telegram');
            console.log('   2. Busca tu bot');
            console.log('   3. Envía cualquier mensaje (ej: "hola")');
            console.log('   4. Ejecuta este script nuevamente');
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

getChatId(); 