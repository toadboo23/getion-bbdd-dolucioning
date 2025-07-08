import bcrypt from 'bcrypt';

async function generateHash() {
  const password = 'solucioning';
  const saltRounds = 10;
  
  try {
    const hash = await bcrypt.hash(password, saltRounds);
    console.log('Password:', password);
    console.log('Hash:', hash);
    
    // Verificar que el hash funciona
    const isValid = await bcrypt.compare(password, hash);
    console.log('Verification:', isValid);
  } catch (error) {
    console.error('Error:', error);
  }
}

generateHash(); 