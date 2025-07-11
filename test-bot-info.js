// Script de prueba corregido para Telegram
const BOT_TOKEN = '7718484147:AAFSeHqwa6W50tGbNGkL6cvQNn8PDpro-7o';

async function testBot() {
    try {
        console.log('🤖 Probando información del bot...');
        
        const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getMe`);
        const data = await response.json();
        
        if (data.ok) {
            console.log('✅ Bot encontrado:');
            console.log(`   Nombre: ${data.result.first_name}`);
            console.log(`   Username: @${data.result.username}`);
            console.log(`   ID: ${data.result.id}`);
            console.log(`   Puede unirse a grupos: ${data.result.can_join_groups}`);
            console.log(`   Puede leer mensajes: ${data.result.can_read_all_group_messages}`);
        } else {
            console.log('❌ Error con el bot:', data);
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

testBot(); 