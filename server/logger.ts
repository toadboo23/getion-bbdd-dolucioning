// ========================================
// SISTEMA DE LOGS ESTRUCTURADOS
// ========================================

import { createLogger, format, transports, Logger } from 'winston';
import { Request, Response, NextFunction } from 'express';

// Configuración de colores para consola
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white',
};

// Agregar colores a winston
require('winston').addColors(colors);

// Formato personalizado para logs
const logFormat = format.combine(
  format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  format.colorize({ all: true }),
  format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message}`,
  ),
);

// Formato para archivos (sin colores)
const fileFormat = format.combine(
  format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  format.errors({ stack: true }),
  format.json(),
);

// Crear logger principal
const logger: Logger = createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  transports: [
    // Consola para desarrollo
    new transports.Console({
      format: logFormat,
    }),
    // Archivo para errores
    new transports.File({
      filename: 'logs/error.log',
      level: 'error',
      format: fileFormat,
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    // Archivo para todos los logs
    new transports.File({
      filename: 'logs/combined.log',
      format: fileFormat,
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
  ],
  exceptionHandlers: [
    new transports.File({ filename: 'logs/exceptions.log' }),
  ],
  rejectionHandlers: [
    new transports.File({ filename: 'logs/rejections.log' }),
  ],
});

// Middleware para logging de requests HTTP
export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const logData = {
      method: req.method,
      url: req.url,
      status: res.statusCode,
      duration: `${duration}ms`,
      userAgent: req.get('User-Agent'),
      ip: req.ip || req.connection.remoteAddress,
    };

    if (res.statusCode >= 400) {
      logger.warn(`HTTP ${res.statusCode} - ${req.method} ${req.url} (${duration}ms)`);
    } else {
      logger.http(`${req.method} ${req.url} - ${res.statusCode} (${duration}ms)`);
    }
  });

  next();
};

// Función para logging de errores
export const errorLogger = (error: Error, req?: Request) => {
  const errorData = {
    message: error.message,
    stack: error.stack,
    url: req?.url,
    method: req?.method,
    ip: req?.ip || req?.connection.remoteAddress,
    userAgent: req?.get('User-Agent'),
  };

  logger.error('Error occurred:', errorData);
};

// Función para logging de eventos del sistema
export const systemLogger = {
  info: (message: string, meta?: any) => {
    logger.info(message, meta);
  },
  warn: (message: string, meta?: any) => {
    logger.warn(message, meta);
  },
  error: (message: string, meta?: any) => {
    logger.error(message, meta);
  },
  debug: (message: string, meta?: any) => {
    logger.debug(message, meta);
  },
};

// Función para logging de base de datos
export const dbLogger = {
  query: (sql: string, params?: any[], duration?: number) => {
    logger.debug(`DB Query: ${sql}`, { params, duration });
  },
  error: (error: Error, sql?: string) => {
    logger.error('Database Error:', { error: error.message, sql });
  },
  connection: (action: 'connect' | 'disconnect') => {
    logger.info(`Database ${action}ed`);
  },
};

// Función para logging de autenticación
export const authLogger = {
  login: (userId: string, success: boolean, ip?: string) => {
    const level = success ? 'info' : 'warn';
    logger[level](`Login attempt for user ${userId}`, { success, ip });
  },
  logout: (userId: string) => {
    logger.info(`User ${userId} logged out`);
  },
  session: (action: 'create' | 'destroy', userId: string) => {
    logger.debug(`Session ${action}d for user ${userId}`);
  },
};

// Función para logging de operaciones CRUD
export const crudLogger = {
  create: (table: string, id: string | number) => {
    logger.info(`Created record in ${table}`, { id });
  },
  read: (table: string, id: string | number) => {
    logger.debug(`Read record from ${table}`, { id });
  },
  update: (table: string, id: string | number) => {
    logger.info(`Updated record in ${table}`, { id });
  },
  delete: (table: string, id: string | number) => {
    logger.warn(`Deleted record from ${table}`, { id });
  },
};

export default logger; 