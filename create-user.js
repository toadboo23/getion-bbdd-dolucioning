const bcrypt = require('bcrypt');
const { db } = require('./server/db');
const { systemUsers } = require('../shared/schema');

async function createSuperAdmin() {
  try {
    const hashedPassword = bcrypt.hashSync('24578963', 10);
    
    const newUser = {
      email: 'dsanchez@gabinetsallent.com',
      firstName: 'Dori',
      lastName: 'Sanchez',
      password: hashedPassword,
      role: 'super_admin',
      isActive: true,
      createdBy: 'system'
    };

    await db.insert(systemUsers).values(newUser);
    console.log('✅ Usuario super admin creado exitosamente:');
    console.log('   Email: dsanchez@gabinetsallent.com');
    console.log('   Nombre: Dori Sanchez');
    console.log('   Role: super_admin');
    
  } catch (error) {
    console.error('❌ Error al crear usuario:', error.message);
  }
}

createSuperAdmin(); 