// Script de prueba para verificar autenticación
const fetch = require('node-fetch');

async function testAuth() {
  try {
    console.log('🔐 Probando autenticación para test@sevilla.net...');
    
    // Intentar login
    const loginResponse = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'test@sevilla.net',
        password: 'password123'
      }),
      credentials: 'include'
    });

    const loginData = await loginResponse.json();
    console.log('📝 Respuesta de login:', loginData);

    if (loginData.success) {
      console.log('✅ Login exitoso');
      console.log('👤 Usuario:', loginData.user);
      
      // Intentar obtener información del usuario
      const userResponse = await fetch('http://localhost:3000/api/auth/user', {
        credentials: 'include'
      });
      
      const userData = await userResponse.json();
      console.log('👤 Datos del usuario:', userData);
      
      // Intentar obtener empleados
      const employeesResponse = await fetch('http://localhost:3000/api/employees', {
        credentials: 'include'
      });
      
      const employeesData = await employeesResponse.json();
      console.log('👥 Empleados obtenidos:', employeesData.length);
      
    } else {
      console.log('❌ Login fallido:', loginData.error);
    }
    
  } catch (error) {
    console.error('💥 Error en la prueba:', error.message);
  }
}

testAuth(); 