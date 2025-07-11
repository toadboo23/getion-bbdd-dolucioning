import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import postgres from 'postgres';
import { createCandidateRoutes } from './routes/candidates';
import { AuthMiddleware } from './middleware/auth';

// Configuración de la base de datos
const sql = postgres({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'employee_management',
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  max: 20,
  idle_timeout: 30,
  connect_timeout: 2,
});

// Crear aplicación Express
const app = express();
const PORT = process.env.PORT || 5173;

// Middleware de autenticación
const authMiddleware = new AuthMiddleware(sql);

// =====================================================
// MIDDLEWARE DE SEGURIDAD Y CONFIGURACIÓN
// =====================================================

// CORS
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

// Helmet para seguridad
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // máximo 100 requests por ventana
  message: {
    success: false,
    error: 'Demasiadas peticiones',
    message: 'Has excedido el límite de peticiones. Intenta de nuevo más tarde.'
  }
});
app.use('/api/', limiter);

// Parsing de JSON
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging de requests
app.use(authMiddleware.logRequest.bind(authMiddleware));

// =====================================================
// RUTAS DE LA API
// =====================================================

// Health check
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'API funcionando correctamente',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Ruta de prueba de base de datos
app.get('/api/db-test', async (req, res) => {
  try {
    const result = await sql`SELECT NOW() as current_time`;
    res.json({
      success: true,
      message: 'Conexión a base de datos exitosa',
      data: {
        currentTime: result[0]?.current_time || new Date().toISOString(),
        connectionPool: 'active'
      }
    });
  } catch (error) {
    console.error('Error testing database connection:', error);
    res.status(500).json({
      success: false,
      error: 'Error de conexión a base de datos',
      message: 'No se pudo conectar a la base de datos'
    });
  }
});

// Rutas de candidatos (con autenticación)
const candidateRoutes = createCandidateRoutes(sql);

// Aplicar middleware de autenticación a todas las rutas de candidatos
app.use('/api/candidates', 
  authMiddleware.authenticate.bind(authMiddleware),
  candidateRoutes
);

// =====================================================
// MANEJO DE ERRORES
// =====================================================

// Middleware para manejar rutas no encontradas
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Ruta no encontrada',
    message: `La ruta ${req.originalUrl} no existe`
  });
});

// Middleware de manejo de errores global
app.use(authMiddleware.errorHandler.bind(authMiddleware));

// =====================================================
// INICIALIZACIÓN DEL SERVIDOR
// =====================================================

async function startServer() {
  try {
    // Probar conexión a la base de datos
    await sql`SELECT 1`;
    console.log('✅ Conexión a base de datos establecida');

    // Iniciar servidor
    app.listen(PORT, () => {
      console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}/health`);
      console.log(`🗄️  DB test: http://localhost:${PORT}/api/db-test`);
      console.log(`👥 API Candidatos: http://localhost:${PORT}/api/candidates`);
    });

  } catch (error) {
    console.error('❌ Error iniciando servidor:', error);
    process.exit(1);
  }
}

// Manejo de señales para cierre graceful
process.on('SIGINT', async () => {
  console.log('\n🛑 Cerrando servidor...');
  await sql.end();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Cerrando servidor...');
  await sql.end();
  process.exit(0);
});

// Iniciar servidor
startServer(); 