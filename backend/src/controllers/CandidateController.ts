import { Request, Response } from 'express';
import { CandidateService } from '../services/CandidateService';
import { CreateCandidateRequest, UpdateCandidateRequest, CreateCommentRequest, CandidateFilters, CandidateState } from '../../shared/types/candidates';
import { z } from 'zod';

// Esquemas de validación
const createCandidateSchema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido').max(100),
  apellido: z.string().min(1, 'El apellido es requerido').max(100),
  dni_nie: z.string().min(1, 'El DNI/NIE es requerido').max(20),
  telefono: z.string().min(1, 'El teléfono es requerido').max(20),
  email: z.string().email('Email inválido').max(255),
  direccion: z.string().optional(),
  ciudad: z.string().optional(),
  experiencia: z.string().optional(),
  observaciones: z.string().optional(),
  fuente: z.string().optional()
});

const updateCandidateSchema = z.object({
  nombre: z.string().min(1).max(100).optional(),
  apellido: z.string().min(1).max(100).optional(),
  dni_nie: z.string().min(1).max(20).optional(),
  telefono: z.string().min(1).max(20).optional(),
  email: z.string().email().max(255).optional(),
  estado: z.enum(['nuevo', 'contactado', 'no_contactado', 'en_proceso_seleccion', 'entrevistado', 'aprobado', 'rechazado', 'contratado', 'descartado', 'en_espera']).optional(),
  direccion: z.string().optional(),
  ciudad: z.string().optional(),
  experiencia: z.string().optional(),
  observaciones: z.string().optional(),
  fuente: z.string().optional()
});

const createCommentSchema = z.object({
  tipo: z.enum(['llamada', 'email', 'entrevista', 'whatsapp', 'observacion', 'seguimiento', 'otro']),
  comentario: z.string().min(1, 'El comentario es requerido').max(1000)
});

export class CandidateController {
  private candidateService: CandidateService;

  constructor(candidateService: CandidateService) {
    this.candidateService = candidateService;
  }

  // =====================================================
  // ENDPOINTS DE CANDIDATOS
  // =====================================================

  async getAllCandidates(req: Request, res: Response): Promise<void> {
    try {
      const filters: CandidateFilters = {
        estado: req.query.estado as CandidateState | undefined,
        ciudad: req.query.ciudad as string | undefined,
        search: req.query.search as string | undefined,
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 20
      };

      const candidates = await this.candidateService.getAllCandidates(filters);
      
      res.json({
        success: true,
        data: candidates,
        message: 'Candidatos obtenidos correctamente'
      });
    } catch (error) {
      console.error('Error getting candidates:', error);
      res.status(500).json({
        success: false,
        error: 'Error interno del servidor',
        message: 'No se pudieron obtener los candidatos'
      });
    }
  }

  async getCandidateById(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id || '0');
      
      if (isNaN(id)) {
        res.status(400).json({
          success: false,
          error: 'ID inválido',
          message: 'El ID del candidato debe ser un número'
        });
        return;
      }

      const candidate = await this.candidateService.getCandidateById(id);
      
      if (!candidate) {
        res.status(404).json({
          success: false,
          error: 'Candidato no encontrado',
          message: 'No se encontró el candidato con el ID especificado'
        });
        return;
      }

      res.json({
        success: true,
        data: candidate,
        message: 'Candidato obtenido correctamente'
      });
    } catch (error) {
      console.error('Error getting candidate:', error);
      res.status(500).json({
        success: false,
        error: 'Error interno del servidor',
        message: 'No se pudo obtener el candidato'
      });
    }
  }

  async createCandidate(req: Request, res: Response): Promise<void> {
    try {
      // Validar datos de entrada
      const validationResult = createCandidateSchema.safeParse(req.body);
      
      if (!validationResult.success) {
        res.status(400).json({
          success: false,
          error: 'Datos inválidos',
          message: 'Los datos proporcionados no son válidos',
          details: validationResult.error.errors
        });
        return;
      }

      const data: CreateCandidateRequest = validationResult.data;
      const createdBy = req.user?.email || 'system';

      const candidate = await this.candidateService.createCandidate(data, createdBy);
      
      res.status(201).json({
        success: true,
        data: candidate,
        message: 'Candidato creado correctamente'
      });
    } catch (error: any) {
      console.error('Error creating candidate:', error);
      
      if (error.code === '23505') { // Unique constraint violation
        res.status(409).json({
          success: false,
          error: 'Candidato duplicado',
          message: 'Ya existe un candidato con ese DNI/NIE'
        });
        return;
      }

      res.status(500).json({
        success: false,
        error: 'Error interno del servidor',
        message: 'No se pudo crear el candidato'
      });
    }
  }

  async updateCandidate(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id || '0');
      
      if (isNaN(id)) {
        res.status(400).json({
          success: false,
          error: 'ID inválido',
          message: 'El ID del candidato debe ser un número'
        });
        return;
      }

      // Validar datos de entrada
      const validationResult = updateCandidateSchema.safeParse(req.body);
      
      if (!validationResult.success) {
        res.status(400).json({
          success: false,
          error: 'Datos inválidos',
          message: 'Los datos proporcionados no son válidos',
          details: validationResult.error.errors
        });
        return;
      }

      const data: UpdateCandidateRequest = validationResult.data;
      const updatedBy = req.user?.email || 'system';

      const candidate = await this.candidateService.updateCandidate(id, data, updatedBy);
      
      if (!candidate) {
        res.status(404).json({
          success: false,
          error: 'Candidato no encontrado',
          message: 'No se encontró el candidato con el ID especificado'
        });
        return;
      }

      res.json({
        success: true,
        data: candidate,
        message: 'Candidato actualizado correctamente'
      });
    } catch (error: any) {
      console.error('Error updating candidate:', error);
      
      if (error.code === '23505') { // Unique constraint violation
        res.status(409).json({
          success: false,
          error: 'Candidato duplicado',
          message: 'Ya existe un candidato con ese DNI/NIE'
        });
        return;
      }

      res.status(500).json({
        success: false,
        error: 'Error interno del servidor',
        message: 'No se pudo actualizar el candidato'
      });
    }
  }

  async deleteCandidate(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id || '0');
      
      if (isNaN(id)) {
        res.status(400).json({
          success: false,
          error: 'ID inválido',
          message: 'El ID del candidato debe ser un número'
        });
        return;
      }

      const deleted = await this.candidateService.deleteCandidate(id);
      
      if (!deleted) {
        res.status(404).json({
          success: false,
          error: 'Candidato no encontrado',
          message: 'No se encontró el candidato con el ID especificado'
        });
        return;
      }

      res.json({
        success: true,
        message: 'Candidato eliminado correctamente'
      });
    } catch (error) {
      console.error('Error deleting candidate:', error);
      res.status(500).json({
        success: false,
        error: 'Error interno del servidor',
        message: 'No se pudo eliminar el candidato'
      });
    }
  }

  // =====================================================
  // ENDPOINTS DE COMENTARIOS
  // =====================================================

  async getCandidateComments(req: Request, res: Response): Promise<void> {
    try {
      const candidateId = parseInt(req.params.candidateId || '0');
      
      if (isNaN(candidateId)) {
        res.status(400).json({
          success: false,
          error: 'ID inválido',
          message: 'El ID del candidato debe ser un número'
        });
        return;
      }

      const comments = await this.candidateService.getCandidateComments(candidateId);
      
      res.json({
        success: true,
        data: comments,
        message: 'Comentarios obtenidos correctamente'
      });
    } catch (error) {
      console.error('Error getting comments:', error);
      res.status(500).json({
        success: false,
        error: 'Error interno del servidor',
        message: 'No se pudieron obtener los comentarios'
      });
    }
  }

  async createComment(req: Request, res: Response): Promise<void> {
    try {
      const candidateId = parseInt(req.params.candidateId || '0');
      
      if (isNaN(candidateId)) {
        res.status(400).json({
          success: false,
          error: 'ID inválido',
          message: 'El ID del candidato debe ser un número'
        });
        return;
      }

      // Validar datos de entrada
      const validationResult = createCommentSchema.safeParse(req.body);
      
      if (!validationResult.success) {
        res.status(400).json({
          success: false,
          error: 'Datos inválidos',
          message: 'Los datos proporcionados no son válidos',
          details: validationResult.error.errors
        });
        return;
      }

      const data: CreateCommentRequest = validationResult.data;
      const createdBy = req.user?.email || 'system';

      const comment = await this.candidateService.createComment(candidateId, data, createdBy);
      
      res.status(201).json({
        success: true,
        data: comment,
        message: 'Comentario creado correctamente'
      });
    } catch (error) {
      console.error('Error creating comment:', error);
      res.status(500).json({
        success: false,
        error: 'Error interno del servidor',
        message: 'No se pudo crear el comentario'
      });
    }
  }

  async deleteComment(req: Request, res: Response): Promise<void> {
    try {
      const commentId = parseInt(req.params.commentId || '0');
      
      if (isNaN(commentId)) {
        res.status(400).json({
          success: false,
          error: 'ID inválido',
          message: 'El ID del comentario debe ser un número'
        });
        return;
      }

      const deleted = await this.candidateService.deleteComment(commentId);
      
      if (!deleted) {
        res.status(404).json({
          success: false,
          error: 'Comentario no encontrado',
          message: 'No se encontró el comentario con el ID especificado'
        });
        return;
      }

      res.json({
        success: true,
        message: 'Comentario eliminado correctamente'
      });
    } catch (error) {
      console.error('Error deleting comment:', error);
      res.status(500).json({
        success: false,
        error: 'Error interno del servidor',
        message: 'No se pudo eliminar el comentario'
      });
    }
  }

  // =====================================================
  // ENDPOINTS DE ESTADÍSTICAS Y BÚSQUEDA
  // =====================================================

  async getCandidateStats(req: Request, res: Response): Promise<void> {
    try {
      const stats = await this.candidateService.getCandidateStats();
      
      res.json({
        success: true,
        data: stats,
        message: 'Estadísticas obtenidas correctamente'
      });
    } catch (error) {
      console.error('Error getting stats:', error);
      res.status(500).json({
        success: false,
        error: 'Error interno del servidor',
        message: 'No se pudieron obtener las estadísticas'
      });
    }
  }

  async searchCandidates(req: Request, res: Response): Promise<void> {
    try {
      const searchTerm = req.query.q as string;
      
      if (!searchTerm || searchTerm.trim().length === 0) {
        res.status(400).json({
          success: false,
          error: 'Término de búsqueda requerido',
          message: 'Debe proporcionar un término de búsqueda'
        });
        return;
      }

      const candidates = await this.candidateService.searchCandidates(searchTerm.trim());
      
      res.json({
        success: true,
        data: candidates,
        message: 'Búsqueda completada correctamente'
      });
    } catch (error) {
      console.error('Error searching candidates:', error);
      res.status(500).json({
        success: false,
        error: 'Error interno del servidor',
        message: 'No se pudo realizar la búsqueda'
      });
    }
  }
} 