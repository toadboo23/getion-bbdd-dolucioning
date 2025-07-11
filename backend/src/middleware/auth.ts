import { Request, Response, NextFunction } from 'express';
import postgres from 'postgres';

// Extender la interfaz Request para incluir el usuario
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        firstName: string;
        lastName: string;
        role: string;
      };
    }
  }
}

export class AuthMiddleware {
  private sql: postgres.Sql;

  constructor(sql: postgres.Sql) {
    this.sql = sql;
  }

  // Middleware para verificar si el usuario está autenticado
  async authenticate(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const authHeader = req.headers.authorization;
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({
          success: false,
          error: 'Token no proporcionado',
          message: 'Se requiere token de autenticación'
        });
        return;
      }

      const token = authHeader.substring(7); // Remover 'Bearer '

      // Verificar el token (en un entorno real, usarías JWT)
      // Por ahora, asumimos que el token es el email del usuario
      const user = await this.verifyToken(token);
      
      if (!user) {
        res.status(401).json({
          success: false,
          error: 'Token inválido',
          message: 'El token de autenticación no es válido'
        });
        return;
      }

      req.user = user;
      next();
    } catch (error) {
      console.error('Error en autenticación:', error);
      res.status(500).json({
        success: false,
        error: 'Error de autenticación',
        message: 'Error interno del servidor durante la autenticación'
      });
    }
  }

  // Middleware para verificar roles específicos
  requireRole(roles: string[]) {
    return (req: Request, res: Response, next: NextFunction): void => {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'No autenticado',
          message: 'Se requiere autenticación'
        });
        return;
      }

      if (!roles.includes(req.user.role)) {
        res.status(403).json({
          success: false,
          error: 'Acceso denegado',
          message: 'No tienes permisos para realizar esta acción'
        });
        return;
      }

      next();
    };
  }

  // Middleware para verificar si el usuario es propietario del recurso
  async requireOwnership(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'No autenticado',
          message: 'Se requiere autenticación'
        });
        return;
      }

      // Para candidatos, permitir acceso si el usuario es super_admin o el creador
      const candidateId = parseInt((req.params.id || req.params.candidateId || '0'));
      
      if (isNaN(candidateId)) {
        res.status(400).json({
          success: false,
          error: 'ID inválido',
          message: 'El ID debe ser un número'
        });
        return;
      }

      const query = 'SELECT created_by FROM candidates WHERE id = $1';
      const result = await this.sql.unsafe(query, [candidateId]);
      
      if (result.length === 0) {
        res.status(404).json({
          success: false,
          error: 'Recurso no encontrado',
          message: 'El candidato no existe'
        });
        return;
      }

      const candidate = result[0];
      
      if (!candidate) {
        res.status(404).json({
          success: false,
          error: 'Recurso no encontrado',
          message: 'El candidato no existe'
        });
        return;
      }
      
      // Permitir acceso si es super_admin o el creador del candidato
      if (req.user && (req.user.role === 'super_admin' || req.user.email === candidate.created_by)) {
        next();
      } else {
        res.status(403).json({
          success: false,
          error: 'Acceso denegado',
          message: 'No tienes permisos para modificar este candidato'
        });
      }
    } catch (error) {
      console.error('Error verificando propiedad:', error);
      res.status(500).json({
        success: false,
        error: 'Error interno del servidor',
        message: 'Error al verificar permisos'
      });
    }
  }

  // Función para verificar el token (simplificada)
  private async verifyToken(token: string): Promise<any> {
    try {
      // En un entorno real, verificarías un JWT
      // Por ahora, asumimos que el token es el email del usuario
      const query = `
        SELECT id, email, first_name, last_name, role 
        FROM system_users 
        WHERE email = $1 AND active = true
      `;
      
      const result = await this.sql.unsafe(query, [token]);
      
      if (result.length === 0) {
        return null;
      }

      const user = result[0];
      if (!user) return null;
      
      return {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role
      };
    } catch (error) {
      console.error('Error verificando token:', error);
      return null;
    }
  }

  // Middleware para logging de requests
  logRequest(req: Request, res: Response, next: NextFunction): void {
    const timestamp = new Date().toISOString();
    const method = req.method;
    const url = req.url;
    const userAgent = req.get('User-Agent') || 'Unknown';
    const ip = req.ip || req.connection.remoteAddress || 'Unknown';

    console.log(`[${timestamp}] ${method} ${url} - ${ip} - ${userAgent}`);
    
    // Log del usuario si está autenticado
    if (req.user) {
      console.log(`  User: ${req.user.email} (${req.user.role})`);
    }

    next();
  }

  // Middleware para manejo de errores
  errorHandler(err: any, req: Request, res: Response, next: NextFunction): void {
    console.error('Error no manejado:', err);
    
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
      message: 'Ha ocurrido un error inesperado'
    });
  }

  // Middleware para CORS
  corsHandler(req: Request, res: Response, next: NextFunction): void {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    
    if (req.method === 'OPTIONS') {
      res.sendStatus(200);
    } else {
      next();
    }
  }
} 