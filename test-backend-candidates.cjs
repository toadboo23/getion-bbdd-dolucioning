const axios = require('axios');

const BASE_URL = 'http://localhost:5173';
const API_URL = `${BASE_URL}/api/candidates`;

// Datos de prueba
const testCandidate = {
  nombre: 'Juan Carlos',
  apellido: 'García López',
  dni_nie: '12345678A',
  telefono: '612345678',
  email: 'juan.garcia@test.com',
  direccion: 'Calle Mayor 123',
  ciudad: 'Madrid',
  experiencia: '5 años en desarrollo web',
  observaciones: 'Candidato muy prometedor',
  fuente: 'LinkedIn'
};

const testComment = {
  tipo: 'llamada',
  comentario: 'Llamada inicial realizada. El candidato está interesado en la posición.'
};

// Función para hacer requests con autenticación
async function makeRequest(method, url, data = null, token = null) {
  const config = {
    method,
    url,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    },
    ...(data && { data })
  };
  
  try {
    const response = await axios(config);
    return { success: true, data: response.data, status: response.status };
  } catch (error) {
    return { 
      success: false, 
      error: error.response?.data || error.message, 
      status: error.response?.status || 500 
    };
  }
}

// Función para esperar
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Función principal de pruebas
async function runTests() {
  console.log('🧪 INICIANDO PRUEBAS DEL BACKEND DE CANDIDATOS');
  console.log('=' .repeat(60));
  
  // Token de autenticación (email del usuario)
  const token = 'nmartinez@solucioning.net';
  
  // Test 1: Health check
  console.log('\n1️⃣ Probando health check...');
  const healthResult = await makeRequest('GET', `${BASE_URL}/health`);
  if (healthResult.success) {
    console.log('✅ Health check exitoso');
    console.log('   Mensaje:', healthResult.data.message);
  } else {
    console.log('❌ Health check falló:', healthResult.error);
  }
  
  // Test 2: Prueba de base de datos
  console.log('\n2️⃣ Probando conexión a base de datos...');
  const dbResult = await makeRequest('GET', `${BASE_URL}/api/db-test`);
  if (dbResult.success) {
    console.log('✅ Conexión a base de datos exitosa');
    console.log('   Tiempo actual:', dbResult.data.data.currentTime);
  } else {
    console.log('❌ Conexión a base de datos falló:', dbResult.error);
  }
  
  // Test 3: Obtener candidatos (sin autenticación)
  console.log('\n3️⃣ Probando obtener candidatos sin autenticación...');
  const candidatesNoAuth = await makeRequest('GET', API_URL);
  if (!candidatesNoAuth.success && candidatesNoAuth.status === 401) {
    console.log('✅ Autenticación requerida correctamente');
  } else {
    console.log('❌ Error en autenticación:', candidatesNoAuth.error);
  }
  
  // Test 4: Obtener candidatos (con autenticación)
  console.log('\n4️⃣ Probando obtener candidatos con autenticación...');
  const candidatesAuth = await makeRequest('GET', API_URL, null, token);
  if (candidatesAuth.success) {
    console.log('✅ Candidatos obtenidos correctamente');
    console.log('   Total candidatos:', candidatesAuth.data.data.length);
  } else {
    console.log('❌ Error obteniendo candidatos:', candidatesAuth.error);
  }
  
  // Test 5: Crear candidato
  console.log('\n5️⃣ Probando crear candidato...');
  const createResult = await makeRequest('POST', API_URL, testCandidate, token);
  if (createResult.success) {
    console.log('✅ Candidato creado correctamente');
    console.log('   ID:', createResult.data.data.id);
    console.log('   Nombre:', createResult.data.data.nombre);
    
    const candidateId = createResult.data.data.id;
    
    // Test 6: Obtener candidato por ID
    console.log('\n6️⃣ Probando obtener candidato por ID...');
    const getByIdResult = await makeRequest('GET', `${API_URL}/${candidateId}`, null, token);
    if (getByIdResult.success) {
      console.log('✅ Candidato obtenido por ID correctamente');
      console.log('   Email:', getByIdResult.data.data.email);
    } else {
      console.log('❌ Error obteniendo candidato por ID:', getByIdResult.error);
    }
    
    // Test 7: Crear comentario
    console.log('\n7️⃣ Probando crear comentario...');
    const commentResult = await makeRequest('POST', `${API_URL}/${candidateId}/comments`, testComment, token);
    if (commentResult.success) {
      console.log('✅ Comentario creado correctamente');
      console.log('   Tipo:', commentResult.data.data.tipo);
      console.log('   Comentario:', commentResult.data.data.comentario);
      
      const commentId = commentResult.data.data.id;
      
      // Test 8: Obtener comentarios
      console.log('\n8️⃣ Probando obtener comentarios...');
      const commentsResult = await makeRequest('GET', `${API_URL}/${candidateId}/comments`, null, token);
      if (commentsResult.success) {
        console.log('✅ Comentarios obtenidos correctamente');
        console.log('   Total comentarios:', commentsResult.data.data.length);
      } else {
        console.log('❌ Error obteniendo comentarios:', commentsResult.error);
      }
      
      // Test 9: Eliminar comentario
      console.log('\n9️⃣ Probando eliminar comentario...');
      const deleteCommentResult = await makeRequest('DELETE', `${API_URL}/${candidateId}/comments/${commentId}`, null, token);
      if (deleteCommentResult.success) {
        console.log('✅ Comentario eliminado correctamente');
      } else {
        console.log('❌ Error eliminando comentario:', deleteCommentResult.error);
      }
    } else {
      console.log('❌ Error creando comentario:', commentResult.error);
    }
    
    // Test 10: Actualizar candidato
    console.log('\n🔟 Probando actualizar candidato...');
    const updateData = {
      estado: 'contactado',
      observaciones: 'Candidato actualizado en pruebas'
    };
    const updateResult = await makeRequest('PUT', `${API_URL}/${candidateId}`, updateData, token);
    if (updateResult.success) {
      console.log('✅ Candidato actualizado correctamente');
      console.log('   Estado:', updateResult.data.data.estado);
    } else {
      console.log('❌ Error actualizando candidato:', updateResult.error);
    }
    
    // Test 11: Búsqueda de candidatos
    console.log('\n1️⃣1️⃣ Probando búsqueda de candidatos...');
    const searchResult = await makeRequest('GET', `${API_URL}/search?q=Juan`, null, token);
    if (searchResult.success) {
      console.log('✅ Búsqueda realizada correctamente');
      console.log('   Resultados encontrados:', searchResult.data.data.length);
    } else {
      console.log('❌ Error en búsqueda:', searchResult.error);
    }
    
    // Test 12: Estadísticas
    console.log('\n1️⃣2️⃣ Probando estadísticas...');
    const statsResult = await makeRequest('GET', `${API_URL}/stats`, null, token);
    if (statsResult.success) {
      console.log('✅ Estadísticas obtenidas correctamente');
      console.log('   Total candidatos:', statsResult.data.data.total);
      console.log('   Por estado:', Object.keys(statsResult.data.data.byState).length);
    } else {
      console.log('❌ Error obteniendo estadísticas:', statsResult.error);
    }
    
    // Test 13: Eliminar candidato
    console.log('\n1️⃣3️⃣ Probando eliminar candidato...');
    const deleteResult = await makeRequest('DELETE', `${API_URL}/${candidateId}`, null, token);
    if (deleteResult.success) {
      console.log('✅ Candidato eliminado correctamente');
    } else {
      console.log('❌ Error eliminando candidato:', deleteResult.error);
    }
    
  } else {
    console.log('❌ Error creando candidato:', createResult.error);
  }
  
  // Test 14: Filtros
  console.log('\n1️⃣4️⃣ Probando filtros...');
  const filtersResult = await makeRequest('GET', `${API_URL}?estado=nuevo&limit=5`, null, token);
  if (filtersResult.success) {
    console.log('✅ Filtros aplicados correctamente');
    console.log('   Candidatos con estado "nuevo":', filtersResult.data.data.length);
  } else {
    console.log('❌ Error aplicando filtros:', filtersResult.error);
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('🎉 PRUEBAS COMPLETADAS');
  console.log('='.repeat(60));
}

// Ejecutar pruebas
runTests().catch(console.error); 