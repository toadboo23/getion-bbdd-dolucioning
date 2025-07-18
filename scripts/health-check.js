#!/usr/bin/env node

// ========================================
// VERIFICADOR DE SALUD DEL SISTEMA
// ========================================

import { config } from 'dotenv';
import fetch from 'node-fetch';

// Cargar variables de entorno
config();

const HEALTH_ENDPOINTS = {
  frontend: process.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:3000',
  backend: process.env.VITE_API_URL || 'http://localhost:5173',
  database: process.env.DATABASE_URL || 'postgresql://postgres:SolucioningSecurePass2024!@localhost:5432/employee_management'
};

const TIMEOUT = 5000; // 5 segundos

// Función para verificar endpoint HTTP
async function checkHttpEndpoint(name, url, path = '') {
  const fullUrl = `${url}${path}`;
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT);
    
    const response = await fetch(fullUrl, {
      method: 'GET',
      signal: controller.signal,
      headers: {
        'User-Agent': 'Health-Check/1.0'
      }
    });
    
    clearTimeout(timeoutId);
    
    if (response.ok) {
      return { status: 'healthy', statusCode: response.status, responseTime: Date.now() };
    } else {
      return { status: 'unhealthy', statusCode: response.status, error: `HTTP ${response.status}` };
    }
  } catch (error) {
    if (error.name === 'AbortError') {
      return { status: 'timeout', error: 'Request timeout' };
    }
    return { status: 'error', error: error.message };
  }
}

// Función para verificar base de datos
async function checkDatabase() {
  try {
    const { Client } = await import('pg');
    const client = new Client({
      connectionString: HEALTH_ENDPOINTS.database,
      connectionTimeoutMillis: TIMEOUT,
      query_timeout: TIMEOUT
    });
    
    await client.connect();
    const result = await client.query('SELECT 1 as health_check');
    await client.end();
    
    if (result.rows[0]?.health_check === 1) {
      return { status: 'healthy', message: 'Database connection successful' };
    } else {
      return { status: 'unhealthy', error: 'Database query failed' };
    }
  } catch (error) {
    return { status: 'error', error: error.message };
  }
}

// Función para verificar recursos del sistema
function checkSystemResources() {
  const os = require('os');
  
  const totalMemory = os.totalmem();
  const freeMemory = os.freemem();
  const usedMemory = totalMemory - freeMemory;
  const memoryUsage = (usedMemory / totalMemory) * 100;
  
  const loadAverage = os.loadavg();
  const cpuCount = os.cpus().length;
  const cpuUsage = (loadAverage[0] / cpuCount) * 100;
  
  return {
    memory: {
      total: Math.round(totalMemory / 1024 / 1024 / 1024 * 100) / 100, // GB
      used: Math.round(usedMemory / 1024 / 1024 / 1024 * 100) / 100, // GB
      free: Math.round(freeMemory / 1024 / 1024 / 1024 * 100) / 100, // GB
      usage: Math.round(memoryUsage * 100) / 100 // %
    },
    cpu: {
      loadAverage: loadAverage.map(load => Math.round(load * 100) / 100),
      usage: Math.round(cpuUsage * 100) / 100, // %
      cores: cpuCount
    },
    uptime: Math.round(os.uptime() / 3600 * 100) / 100 // horas
  };
}

// Función principal de verificación de salud
async function healthCheck() {
  console.log('🏥 Iniciando verificación de salud del sistema...\n');
  
  const results = {
    timestamp: new Date().toISOString(),
    services: {},
    system: {},
    overall: 'healthy'
  };
  
  // Verificar servicios
  console.log('🔍 Verificando servicios...');
  
  // Frontend
  console.log('   - Frontend...');
  results.services.frontend = await checkHttpEndpoint('Frontend', HEALTH_ENDPOINTS.frontend);
  
  // Backend
  console.log('   - Backend...');
  results.services.backend = await checkHttpEndpoint('Backend', HEALTH_ENDPOINTS.backend, '/api/health');
  
  // Base de datos
  console.log('   - Base de datos...');
  results.services.database = await checkDatabase();
  
  // Verificar recursos del sistema
  console.log('   - Recursos del sistema...');
  results.system = checkSystemResources();
  
  // Determinar estado general
  const unhealthyServices = Object.values(results.services).filter(service => service.status !== 'healthy');
  if (unhealthyServices.length > 0) {
    results.overall = 'unhealthy';
  }
  
  // Mostrar resultados
  console.log('\n📊 Resultados de la verificación:');
  console.log('=====================================');
  
  Object.entries(results.services).forEach(([name, service]) => {
    const status = service.status === 'healthy' ? '✅' : '❌';
    console.log(`${status} ${name}: ${service.status}`);
    if (service.error) {
      console.log(`   Error: ${service.error}`);
    }
    if (service.statusCode) {
      console.log(`   Status: ${service.statusCode}`);
    }
  });
  
  console.log('\n💻 Recursos del sistema:');
  console.log(`   Memoria: ${results.system.memory.usage}% (${results.system.memory.used}GB / ${results.system.memory.total}GB)`);
  console.log(`   CPU: ${results.system.cpu.usage}% (${results.system.cpu.cores} cores)`);
  console.log(`   Uptime: ${results.system.uptime} horas`);
  
  console.log(`\n🎯 Estado general: ${results.overall === 'healthy' ? '✅ Saludable' : '❌ Problemas detectados'}`);
  
  // Retornar código de salida apropiado
  return results.overall === 'healthy' ? 0 : 1;
}

// Ejecutar verificación si se llama directamente
if (import.meta.url === `file://${process.argv[1]}`) {
  healthCheck().then(exitCode => {
    process.exit(exitCode);
  }).catch(error => {
    console.error('❌ Error durante la verificación:', error.message);
    process.exit(1);
  });
}

export { healthCheck }; 