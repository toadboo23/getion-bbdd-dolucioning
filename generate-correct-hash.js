const bcrypt = require('bcrypt');

const password = 'solucioning';
const saltRounds = 10;

console.log('🔍 Generando hash para la contraseña:', password);

bcrypt.hash(password, saltRounds, (err, hash) => {
  if (err) {
    console.error('❌ Error generando hash:', err);
    return;
  }
  
  console.log('✅ Hash generado:', hash);
  console.log('\n📝 SQL para actualizar la base de datos:');
  console.log(`UPDATE system_users SET password = '${hash}' WHERE email = 'nmartinez@solucioning.net';`);
  
  // Verificar que el hash funciona
  bcrypt.compare(password, hash, (err, result) => {
    if (err) {
      console.error('❌ Error verificando hash:', err);
      return;
    }
    
    console.log('\n✅ Verificación del hash:', result ? 'CORRECTO' : 'INCORRECTO');
  });
}); 