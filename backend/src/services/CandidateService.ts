import postgres from 'postgres';
import { Candidate, CreateCandidateRequest, UpdateCandidateRequest, CandidateFilters, CandidateStats, CandidateComment, CreateCommentRequest } from '../../shared/types/candidates';

export class CandidateService {
  private sql: postgres.Sql;

  constructor(sql: postgres.Sql) {
    this.sql = sql;
  }

  // =====================================================
  // MÉTODOS PRINCIPALES DE CANDIDATOS
  // =====================================================

  async getAllCandidates(filters: CandidateFilters = {}): Promise<Candidate[]> {
    try {
      let query = `
        SELECT 
          c.id,
          c.nombre,
          c.apellido,
          c.dni_nie,
          c.telefono,
          c.email,
          c.estado,
          c.direccion,
          c.ciudad,
          c.experiencia,
          c.observaciones,
          c.fuente,
          c.created_by,
          c.updated_by,
          c.created_at,
          c.updated_at
        FROM candidates c
        WHERE 1=1
      `;
      
      const params: any[] = [];
      let paramIndex = 1;

      // Filtro por estado
      if (filters.estado) {
        query += ` AND c.estado = $${paramIndex}`;
        params.push(filters.estado);
        paramIndex++;
      }

      // Filtro por ciudad
      if (filters.ciudad) {
        query += ` AND c.ciudad ILIKE $${paramIndex}`;
        params.push(`%${filters.ciudad}%`);
        paramIndex++;
      }

      // Búsqueda general
      if (filters.search) {
        query += ` AND (
          c.nombre ILIKE $${paramIndex} OR 
          c.apellido ILIKE $${paramIndex} OR 
          c.email ILIKE $${paramIndex} OR 
          c.dni_nie ILIKE $${paramIndex} OR
          c.telefono ILIKE $${paramIndex}
        )`;
        params.push(`%${filters.search}%`);
        paramIndex++;
      }

      // Ordenamiento y paginación
      query += ` ORDER BY c.created_at DESC`;
      
      if (filters.limit) {
        query += ` LIMIT $${paramIndex}`;
        params.push(filters.limit);
        paramIndex++;
        
        if (filters.page && filters.page > 1) {
          const offset = (filters.page - 1) * filters.limit;
          query += ` OFFSET $${paramIndex}`;
          params.push(offset);
        }
      }

      const result = await this.sql.unsafe(query, params);
      return result.map(this.mapCandidateFromDb);
    } catch (error) {
      console.error('Error getting candidates:', error);
      throw error;
    }
  }

  async getCandidateById(id: number): Promise<Candidate | null> {
    try {
      const query = `
        SELECT 
          c.id,
          c.nombre,
          c.apellido,
          c.dni_nie,
          c.telefono,
          c.email,
          c.estado,
          c.direccion,
          c.ciudad,
          c.experiencia,
          c.observaciones,
          c.fuente,
          c.created_by,
          c.updated_by,
          c.created_at,
          c.updated_at
        FROM candidates c
        WHERE c.id = $1
      `;
      
      const result = await this.sql.unsafe(query, [id]);
      
      if (result.length === 0) {
        return null;
      }

      return this.mapCandidateFromDb(result[0]);
    } catch (error) {
      console.error('Error getting candidate by ID:', error);
      throw error;
    }
  }

  async createCandidate(data: CreateCandidateRequest, createdBy: string): Promise<Candidate> {
    try {
      const query = `
        INSERT INTO candidates (
          nombre, apellido, dni_nie, telefono, email, 
          direccion, ciudad, experiencia, observaciones, fuente, 
          estado, created_by, created_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'nuevo', $11, NOW()
        ) RETURNING *
      `;
      
      const params = [
        data.nombre,
        data.apellido,
        data.dni_nie,
        data.telefono,
        data.email,
        data.direccion || null,
        data.ciudad || null,
        data.experiencia || null,
        data.observaciones || null,
        data.fuente || null,
        createdBy
      ];

      const result = await this.sql.unsafe(query, params);
      return this.mapCandidateFromDb(result[0]);
    } catch (error) {
      console.error('Error creating candidate:', error);
      throw error;
    }
  }

  async updateCandidate(id: number, data: UpdateCandidateRequest, updatedBy: string): Promise<Candidate | null> {
    try {
      const updateFields: string[] = [];
      const params: any[] = [];
      let paramIndex = 1;

      // Construir dinámicamente los campos a actualizar
      if (data.nombre !== undefined) {
        updateFields.push(`nombre = $${paramIndex}`);
        params.push(data.nombre);
        paramIndex++;
      }
      if (data.apellido !== undefined) {
        updateFields.push(`apellido = $${paramIndex}`);
        params.push(data.apellido);
        paramIndex++;
      }
      if (data.dni_nie !== undefined) {
        updateFields.push(`dni_nie = $${paramIndex}`);
        params.push(data.dni_nie);
        paramIndex++;
      }
      if (data.telefono !== undefined) {
        updateFields.push(`telefono = $${paramIndex}`);
        params.push(data.telefono);
        paramIndex++;
      }
      if (data.email !== undefined) {
        updateFields.push(`email = $${paramIndex}`);
        params.push(data.email);
        paramIndex++;
      }
      if (data.estado !== undefined) {
        updateFields.push(`estado = $${paramIndex}`);
        params.push(data.estado);
        paramIndex++;
      }
      if (data.direccion !== undefined) {
        updateFields.push(`direccion = $${paramIndex}`);
        params.push(data.direccion);
        paramIndex++;
      }
      if (data.ciudad !== undefined) {
        updateFields.push(`ciudad = $${paramIndex}`);
        params.push(data.ciudad);
        paramIndex++;
      }
      if (data.experiencia !== undefined) {
        updateFields.push(`experiencia = $${paramIndex}`);
        params.push(data.experiencia);
        paramIndex++;
      }
      if (data.observaciones !== undefined) {
        updateFields.push(`observaciones = $${paramIndex}`);
        params.push(data.observaciones);
        paramIndex++;
      }
      if (data.fuente !== undefined) {
        updateFields.push(`fuente = $${paramIndex}`);
        params.push(data.fuente);
        paramIndex++;
      }

      if (updateFields.length === 0) {
        // No hay campos para actualizar
        return this.getCandidateById(id);
      }

      // Agregar campos de auditoría
      updateFields.push(`updated_by = $${paramIndex}`);
      params.push(updatedBy);
      paramIndex++;
      updateFields.push(`updated_at = NOW()`);

      // Agregar ID al final
      params.push(id);

      const query = `
        UPDATE candidates 
        SET ${updateFields.join(', ')}
        WHERE id = $${paramIndex}
        RETURNING *
      `;

      const result = await this.sql.unsafe(query, params);
      
      if (result.length === 0) {
        return null;
      }

      return this.mapCandidateFromDb(result[0]);
    } catch (error) {
      console.error('Error updating candidate:', error);
      throw error;
    }
  }

  async deleteCandidate(id: number): Promise<boolean> {
    try {
      const query = 'DELETE FROM candidates WHERE id = $1 RETURNING id';
      const result = await this.sql.unsafe(query, [id]);
      
      return result.length > 0;
    } catch (error) {
      console.error('Error deleting candidate:', error);
      throw error;
    }
  }

  // =====================================================
  // MÉTODOS DE COMENTARIOS
  // =====================================================

  async getCandidateComments(candidateId: number): Promise<CandidateComment[]> {
    try {
      const query = `
        SELECT 
          id,
          candidate_id,
          tipo,
          comentario,
          created_by,
          created_at
        FROM candidate_comments
        WHERE candidate_id = $1
        ORDER BY created_at DESC
      `;
      
      const result = await this.sql.unsafe(query, [candidateId]);
      return result.map(this.mapCommentFromDb);
    } catch (error) {
      console.error('Error getting candidate comments:', error);
      throw error;
    }
  }

  async createComment(candidateId: number, data: CreateCommentRequest, createdBy: string): Promise<CandidateComment> {
    try {
      const query = `
        INSERT INTO candidate_comments (
          candidate_id, tipo, comentario, created_by, created_at
        ) VALUES (
          $1, $2, $3, $4, NOW()
        ) RETURNING *
      `;
      
      const params = [
        candidateId,
        data.tipo,
        data.comentario,
        createdBy
      ];

      const result = await this.sql.unsafe(query, params);
      return this.mapCommentFromDb(result[0]);
    } catch (error) {
      console.error('Error creating comment:', error);
      throw error;
    }
  }

  async deleteComment(commentId: number): Promise<boolean> {
    try {
      const query = 'DELETE FROM candidate_comments WHERE id = $1 RETURNING id';
      const result = await this.sql.unsafe(query, [commentId]);
      
      return result.length > 0;
    } catch (error) {
      console.error('Error deleting comment:', error);
      throw error;
    }
  }

  // =====================================================
  // MÉTODOS DE ESTADÍSTICAS Y BÚSQUEDA
  // =====================================================

  async getCandidateStats(): Promise<CandidateStats> {
    try {
      // Estadísticas por estado
      const stateStatsQuery = `
        SELECT estado, COUNT(*) as count
        FROM candidates
        GROUP BY estado
        ORDER BY count DESC
      `;
      const stateStats = await this.sql.unsafe(stateStatsQuery);

      // Estadísticas por ciudad
      const cityStatsQuery = `
        SELECT ciudad, COUNT(*) as count
        FROM candidates
        WHERE ciudad IS NOT NULL AND ciudad != ''
        GROUP BY ciudad
        ORDER BY count DESC
        LIMIT 10
      `;
      const cityStats = await this.sql.unsafe(cityStatsQuery);

      // Actividad reciente
      const recentActivityQuery = `
        SELECT 
          c.id,
          c.nombre,
          c.apellido,
          c.dni_nie,
          c.telefono,
          c.email,
          c.estado,
          c.direccion,
          c.ciudad,
          c.experiencia,
          c.observaciones,
          c.fuente,
          c.created_by,
          c.updated_by,
          c.created_at,
          c.updated_at
        FROM candidates c
        ORDER BY c.created_at DESC
        LIMIT 10
      `;
      const recentActivity = await this.sql.unsafe(recentActivityQuery);

      // Total de candidatos
      const totalQuery = 'SELECT COUNT(*) as total FROM candidates';
      const totalResult = await this.sql.unsafe(totalQuery);

      return {
        total: parseInt(totalResult[0]?.total || '0'),
        byState: stateStats.reduce((acc, row) => {
          acc[row.estado] = parseInt(row.count);
          return acc;
        }, {} as Record<string, number>),
        byCity: cityStats.reduce((acc, row) => {
          acc[row.ciudad] = parseInt(row.count);
          return acc;
        }, {} as Record<string, number>),
        recentActivity: recentActivity.map(this.mapCandidateFromDb)
      };
    } catch (error) {
      console.error('Error getting candidate stats:', error);
      throw error;
    }
  }

  async searchCandidates(searchTerm: string): Promise<Candidate[]> {
    try {
      const query = `
        SELECT 
          c.id,
          c.nombre,
          c.apellido,
          c.dni_nie,
          c.telefono,
          c.email,
          c.estado,
          c.direccion,
          c.ciudad,
          c.experiencia,
          c.observaciones,
          c.fuente,
          c.created_by,
          c.updated_by,
          c.created_at,
          c.updated_at
        FROM candidates c
        WHERE 
          c.nombre ILIKE $1 OR 
          c.apellido ILIKE $1 OR 
          c.email ILIKE $1 OR 
          c.dni_nie ILIKE $1 OR
          c.telefono ILIKE $1 OR
          c.ciudad ILIKE $1
        ORDER BY 
          CASE 
            WHEN c.nombre ILIKE $1 THEN 1
            WHEN c.apellido ILIKE $1 THEN 2
            WHEN c.email ILIKE $1 THEN 3
            ELSE 4
          END,
          c.created_at DESC
        LIMIT 50
      `;
      
      const result = await this.sql.unsafe(query, [`%${searchTerm}%`]);
      return result.map(this.mapCandidateFromDb);
    } catch (error) {
      console.error('Error searching candidates:', error);
      throw error;
    }
  }

  // =====================================================
  // MÉTODOS AUXILIARES
  // =====================================================

  private mapCandidateFromDb(row: any): Candidate {
    return {
      id: row.id,
      nombre: row.nombre,
      apellido: row.apellido,
      dni_nie: row.dni_nie,
      telefono: row.telefono,
      email: row.email,
      estado: row.estado,
      direccion: row.direccion,
      ciudad: row.ciudad,
      experiencia: row.experiencia,
      observaciones: row.observaciones,
      fuente: row.fuente,
      created_by: row.created_by,
      updated_by: row.updated_by,
      created_at: new Date(row.created_at),
      updated_at: row.updated_at ? new Date(row.updated_at) : undefined
    };
  }

  private mapCommentFromDb(row: any): CandidateComment {
    return {
      id: row.id,
      candidate_id: row.candidate_id,
      tipo: row.tipo,
      comentario: row.comentario,
      created_by: row.created_by,
      created_at: new Date(row.created_at)
    };
  }
} 