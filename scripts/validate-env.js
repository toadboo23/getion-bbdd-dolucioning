#!/usr/bin/env node

// ========================================
// VALIDADOR DE VARIABLES DE ENTORNO
// ========================================

import { config } from 'dotenv';
import { z } from 'zod';

// Cargar variables de entorno
config();

// Esquema de validación para desarrollo
const devSchema = z.object({
  NODE_ENV: z.string().default('development'),
  DATABASE_URL: z.string().url(),
  POSTGRES_DB: z.string(),
  POSTGRES_USER: z.string(),
  POSTGRES_PASSWORD: z.string().min(1),
  POSTGRES_HOST: z.string(),
  POSTGRES_PORT: z.string().transform(Number),
  PORT: z.string().transform(Number).default('5173'),
  SESSION_SECRET: z.string().min(1),
  CORS_ORIGIN: z.string().url(),
  VITE_API_URL: z.string().url(),
  VITE_APP_NAME: z.string(),
  VITE_APP_VERSION: z.string(),
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
  LOG_FORMAT: z.enum(['dev', 'combined']).default('dev'),
  JWT_SECRET: z.string().min(1),
  BCRYPT_ROUNDS: z.string().transform(Number).default('10'),
  HOT_RELOAD: z.string().transform(val => val === 'true').default(true),
  DEBUG: z.string().transform(val => val === 'true').default(true),
  ENABLE_SWAGGER: z.string().transform(val => val === 'true').default(true),
});

// Esquema de validación para producción
const prodSchema = z.object({
  NODE_ENV: z.string().default('production'),
  DATABASE_URL: z.string().url(),
  POSTGRES_DB: z.string(),
  POSTGRES_USER: z.string(),
  POSTGRES_PASSWORD: z.string().min(1),
  POSTGRES_HOST: z.string(),
  POSTGRES_PORT: z.string().transform(Number),
  PORT: z.string().transform(Number).default('5173'),
  SESSION_SECRET: z.string().min(1),
  CORS_ORIGIN: z.string().url(),
  VITE_API_URL: z.string().url(),
  VITE_APP_NAME: z.string(),
  VITE_APP_VERSION: z.string(),
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
  LOG_FORMAT: z.enum(['dev', 'combined']).default('combined'),
  JWT_SECRET: z.string().min(1),
  BCRYPT_ROUNDS: z.string().transform(Number).default('12'),
  HOT_RELOAD: z.string().transform(val => val === 'true').default(false),
  DEBUG: z.string().transform(val => val === 'true').default(false),
  ENABLE_SWAGGER: z.string().transform(val => val === 'true').default(false),
  ENABLE_METRICS: z.string().transform(val => val === 'true').default(true),
  ENABLE_HEALTH_CHECK: z.string().transform(val => val === 'true').default(true),
  BACKUP_ENABLED: z.string().transform(val => val === 'true').default(true),
  BACKUP_RETENTION_DAYS: z.string().transform(Number).default('30'),
});

// Función principal de validación
function validateEnvironment() {
  const env = process.env.NODE_ENV || 'development';
  const schema = env === 'production' ? prodSchema : devSchema;
  
  // Para desarrollo local, usar esquema de desarrollo
  if (!process.env.DATABASE_URL && !process.env.VITE_API_URL) {
    console.log('🔧 Detectado entorno de desarrollo local, usando configuración por defecto...');
    return true;
  }
  
  console.log(`🔍 Validando variables de entorno para ${env}...`);
  
  try {
    const validatedEnv = schema.parse(process.env);
    
    console.log('✅ Variables de entorno válidas');
    console.log('📋 Resumen de configuración:');
    console.log(`   - Entorno: ${validatedEnv.NODE_ENV}`);
    console.log(`   - Puerto: ${validatedEnv.PORT}`);
    console.log(`   - Base de datos: ${validatedEnv.POSTGRES_HOST}:${validatedEnv.POSTGRES_PORT}`);
    console.log(`   - Log level: ${validatedEnv.LOG_LEVEL}`);
    console.log(`   - Hot reload: ${validatedEnv.HOT_RELOAD}`);
    console.log(`   - Debug: ${validatedEnv.DEBUG}`);
    console.log(`   - Swagger: ${validatedEnv.ENABLE_SWAGGER}`);
    
    if (env === 'production') {
      console.log(`   - Métricas: ${validatedEnv.ENABLE_METRICS}`);
      console.log(`   - Health check: ${validatedEnv.ENABLE_HEALTH_CHECK}`);
      console.log(`   - Backup: ${validatedEnv.BACKUP_ENABLED}`);
    }
    
    return true;
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('❌ Errores de validación:');
      error.errors.forEach((err, index) => {
        console.error(`   ${index + 1}. ${err.path.join('.')}: ${err.message}`);
      });
    } else {
      console.error('❌ Error inesperado:', error.message);
    }
    
    console.log('\n💡 Sugerencias:');
    console.log('   - Copia env.local.example a .env.local');
    console.log('   - Copia env.production.example a .env.production');
    console.log('   - Asegúrate de que todas las variables requeridas estén definidas');
    
    return false;
  }
}

// Ejecutar validación si se llama directamente
if (process.argv[1] && process.argv[1].endsWith('validate-env.js')) {
  const isValid = validateEnvironment();
  process.exit(isValid ? 0 : 1);
}

export { validateEnvironment, devSchema, prodSchema }; 