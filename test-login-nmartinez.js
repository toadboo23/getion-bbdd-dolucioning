const axios = require('axios');

const loginData = {
  email: 'nmartinez@solucioning.net',
  password: 'solucioning'
};

console.log('🔍 Intentando login para nmartinez@solucioning.net ...');

axios.post('http://localhost:5173/api/auth/login', loginData, {
  headers: {
    'Content-Type': 'application/json',
  }
})
.then(response => {
  console.log('✅ Login response:');
  console.log(JSON.stringify(response.data, null, 2));
})
.catch(error => {
  if (error.response) {
    console.error('❌ Error en login:');
    console.error('Status:', error.response.status);
    console.error('Data:', JSON.stringify(error.response.data, null, 2));
  } else {
    console.error('❌ Error de conexión:', error.message);
  }
}); 