import { Router } from 'express';
import { CandidateController } from '../controllers/CandidateController';
import { CandidateService } from '../services/CandidateService';
import postgres from 'postgres';

export function createCandidateRoutes(sql: postgres.Sql): Router {
  const router = Router();
  const candidateService = new CandidateService(sql);
  const candidateController = new CandidateController(candidateService);

  // =====================================================
  // RUTAS DE CANDIDATOS
  // =====================================================

  // GET /api/candidates - Obtener todos los candidatos con filtros
  router.get('/', (req, res) => candidateController.getAllCandidates(req, res));

  // GET /api/candidates/search - Búsqueda de candidatos
  router.get('/search', (req, res) => candidateController.searchCandidates(req, res));

  // GET /api/candidates/stats - Estadísticas de candidatos
  router.get('/stats', (req, res) => candidateController.getCandidateStats(req, res));

  // GET /api/candidates/:id - Obtener candidato por ID
  router.get('/:id', (req, res) => candidateController.getCandidateById(req, res));

  // POST /api/candidates - Crear nuevo candidato
  router.post('/', (req, res) => candidateController.createCandidate(req, res));

  // PUT /api/candidates/:id - Actualizar candidato
  router.put('/:id', (req, res) => candidateController.updateCandidate(req, res));

  // DELETE /api/candidates/:id - Eliminar candidato
  router.delete('/:id', (req, res) => candidateController.deleteCandidate(req, res));

  // =====================================================
  // RUTAS DE COMENTARIOS
  // =====================================================

  // GET /api/candidates/:candidateId/comments - Obtener comentarios de un candidato
  router.get('/:candidateId/comments', (req, res) => candidateController.getCandidateComments(req, res));

  // POST /api/candidates/:candidateId/comments - Crear comentario para un candidato
  router.post('/:candidateId/comments', (req, res) => candidateController.createComment(req, res));

  // DELETE /api/candidates/:candidateId/comments/:commentId - Eliminar comentario
  router.delete('/:candidateId/comments/:commentId', (req, res) => candidateController.deleteComment(req, res));

  return router;
} 