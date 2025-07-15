import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { eq, and, sql, desc, isNotNull, lt, inArray } from 'drizzle-orm';
import {
  systemUsers,
  auditLogs,
  employees,
  companyLeaves,
  itLeaves,
  notifications,
  CIUDADES_DISPONIBLES,
  type SystemUser,
  type AuditLog,
  type InsertSystemUser,
  type UpdateSystemUser,
  type InsertAuditLog,
  type Employee,
  type InsertEmployee,
  type UpdateEmployee,
  type CompanyLeave,
  type InsertCompanyLeave,
  type ItLeave,
  type InsertItLeave,
  type Notification,
  type InsertNotification,
} from '../shared/schema.js';
// import { IStorage } from "./storage.js";

// Database configuration
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export const db = drizzle(pool);

// Helper function to calculate CDP
export const calculateCDP = (horas: number | null | undefined): number => {
  if (!horas || horas <= 0) return 0;
  return Math.round((horas / 38) * 100);
};

// Type for upsert user operation
type UpsertUser = InsertSystemUser & { id: number };

// Función utilitaria para extraer los datos clave del empleado
export function getEmpleadoMetadata(emp: any) {
  return {
    idGlovo: emp.idGlovo,
    emailGlovo: emp.emailGlovo,
    dni: emp.dniNie,
    nombre: emp.nombre,
    apellido: emp.apellido,
    telefono: emp.telefono,
  };
}

export class PostgresStorage {
  // User operations
  async getUser (id: number): Promise<SystemUser | undefined> {
    const [user] = await db.select().from(systemUsers).where(eq(systemUsers.id, id));
    return user;
  }

  async upsertUser (userData: UpsertUser): Promise<SystemUser> {
    try {
      // Try to insert first
      const [user] = await db
        .insert(systemUsers)
        .values(userData)
        .returning();
      return user;
    } catch {
      // If insert fails (user exists), update instead
      const [user] = await db
        .update(systemUsers)
        .set({
          ...userData,
          updatedAt: new Date(),
        })
        .where(eq(systemUsers.id, userData.id))
        .returning();
      return user;
    }
  }

  // Employee operations
  async getAllEmployees (): Promise<Employee[]> {
    return await db.select().from(employees);
  }

  async getEmployee (id: string): Promise<Employee | undefined> {
    const [employee] = await db.select().from(employees).where(eq(employees.idGlovo, id));
    return employee;
  }

  async createEmployee (employeeData: InsertEmployee): Promise<Employee> {
    // Calcular CDP automáticamente basado en las horas
    const cdp = calculateCDP(employeeData.horas);
    const employeeDataWithCDP = { ...employeeData, cdp };

    const [employee] = await db.insert(employees).values(employeeDataWithCDP as InsertEmployee).returning();
    return employee;
  }

  async updateEmployee (id: string, employeeData: UpdateEmployee): Promise<Employee> {
    // Calcular CDP automáticamente si se actualizan las horas
    const cdp = calculateCDP(employeeData.horas);
    const employeeDataWithCDP = { ...employeeData, cdp };

    const [employee] = await db
      .update(employees)
      .set(employeeDataWithCDP as UpdateEmployee)
      .where(eq(employees.idGlovo, id))
      .returning();
    return employee;
  }

  async deleteEmployee (id: string): Promise<void> {
    await db.delete(employees).where(eq(employees.idGlovo, id));
  }

  async getEmployeesByCity (city: string): Promise<Employee[]> {
    return await db.select().from(employees).where(eq(employees.ciudad, city));
  }

  async searchEmployees (query: string): Promise<Employee[]> {
    return await db
      .select()
      .from(employees)
      .where(
        sql`LOWER(${employees.nombre}) LIKE ${`%${query.toLowerCase()}%`} OR 
            LOWER(${employees.apellido}) LIKE ${`%${query.toLowerCase()}%`} OR 
            LOWER(${employees.email}) LIKE ${`%${query.toLowerCase()}%`} OR
            LOWER(${employees.emailGlovo}) LIKE ${`%${query.toLowerCase()}%`}`,
      );
  }

  async getEmployeesByStatus (status: string): Promise<Employee[]> {
    return await db.select().from(employees).where(eq(employees.statusBaja, status));
  }

  // Company leave operations
  async getAllCompanyLeaves (): Promise<CompanyLeave[]> {
    return await db.select().from(companyLeaves).orderBy(companyLeaves.createdAt);
  }

  async createCompanyLeave (leaveData: InsertCompanyLeave): Promise<CompanyLeave> {
    const [leave] = await db.insert(companyLeaves).values(leaveData).returning();
    return leave;
  }

  async getNotification (id: number): Promise<Notification | undefined> {
    const [notification] = await db.select().from(notifications).where(eq(notifications.id, id));
    return notification;
  }

  async createNotification (notificationData: InsertNotification): Promise<Notification> {
    const [notification] = await db.insert(notifications).values(notificationData).returning();
    return notification;
  }

  async updateCompanyLeaveStatus (id: number, status: string, approvedBy: string, approvedAt: Date): Promise<CompanyLeave> {
    const [companyLeave] = await db
      .update(companyLeaves)
      .set({
        status,
        approvedBy,
        approvedAt,
        updatedAt: new Date(),
      })
      .where(eq(companyLeaves.id, id))
      .returning();
    return companyLeave;
  }

  // IT leave operations
  async getAllItLeaves (): Promise<ItLeave[]> {
    return await db.select().from(itLeaves).orderBy(itLeaves.createdAt);
  }

  async createItLeave (leaveData: InsertItLeave): Promise<ItLeave> {
    if (process.env.NODE_ENV !== 'production') console.log('🚀 [STORAGE] Starting createItLeave with data:', JSON.stringify(leaveData, null, 2));

    try {
      // Validate required fields
      if (!leaveData.employeeId) {
        throw new Error('employeeId is required');
      }
      if (!leaveData.leaveType) {
        throw new Error('leaveType is required');
      }
      if (!leaveData.requestedBy) {
        throw new Error('requestedBy is required');
      }

      // Ensure dates are properly formatted
      const now = new Date();
      const processedData = {
        ...leaveData,
        leaveDate: leaveData.leaveDate || now,
        requestedAt: leaveData.requestedAt || now,
        approvedAt: leaveData.approvedAt || now,
        status: (leaveData.status as 'pending' | 'approved' | 'rejected') || 'approved',
      };

      if (process.env.NODE_ENV !== 'production') console.log('📝 [STORAGE] Processed data for insertion:', JSON.stringify(processedData, null, 2));

      // Insert IT leave
      const [leave] = await db.insert(itLeaves).values(processedData).returning();

      // Update employee status to 'it_leave' and set fechaIncidencia
      await db.update(employees)
        .set({
          status: 'it_leave',
          fechaIncidencia: processedData.leaveDate,
          updatedAt: now,
        } as Record<string, unknown>)
        .where(eq(employees.idGlovo, leaveData.employeeId));

      if (process.env.NODE_ENV !== 'production') console.log('✅ [STORAGE] IT leave created and employee updated:', JSON.stringify(leave, null, 2));
      return leave;
    } catch (_error) {
      console.error('💥 [STORAGE] Error in createItLeave:', _error);
      console.error('💥 [STORAGE] Original data that failed:', JSON.stringify(leaveData, null, 2));
      throw _error;
    }
  }

  // Notification operations
  async getAllNotifications (): Promise<Notification[]> {
    return await db.select().from(notifications).orderBy(desc(notifications.createdAt));
  }

  async updateNotificationStatus (id: number, status: 'pending' | 'pending_laboral' | 'pendiente_laboral' | 'approved' | 'rejected' | 'processed'): Promise<Notification> {
    const [notification] = await db
      .update(notifications)
      .set({ status, updatedAt: new Date() })
      .where(eq(notifications.id, id))
      .returning();
    return notification;
  }

  async updateNotificationStatusWithDate (id: number, status: 'pending' | 'pendiente_laboral' | 'approved' | 'rejected' | 'processed', processingDate: Date): Promise<Notification> {
    const [notification] = await db
      .update(notifications)
      .set({ status, processingDate, updatedAt: new Date() })
      .where(eq(notifications.id, id))
      .returning();
    return notification;
  }

  async deleteNotification (id: number): Promise<void> {
    await db.delete(notifications).where(eq(notifications.id, id));
  }

  // Dashboard metrics
  async getDashboardMetrics () {
    if (process.env.NODE_ENV !== 'production') console.log('📊 [METRICS] Calculando métricas del dashboard...');

    // Obtener todos los datos necesarios
    const [allEmployees, allCompanyLeaves, allNotifications] = await Promise.all([
      this.getAllEmployees(),
      this.getAllCompanyLeaves(),
      this.getAllNotifications(),
    ]);

    if (process.env.NODE_ENV !== 'production') console.log('📊 [METRICS] Datos obtenidos:', {
      empleadosEnTablaEmpleados: allEmployees.length,
      empleadosEnBajaEmpresa: allCompanyLeaves.length,
      notificaciones: allNotifications.length,
    });

    // TOTAL DE EMPLEADOS: Todos los que existen (activos + baja IT + baja empresa)
    const totalEmployees = allEmployees.length + allCompanyLeaves.length;

    // TRABAJADORES ACTIVOS: Solo activos + baja IT (excluye baja empresa y pendientes de baja empresa)
    const activeEmployees = allEmployees.filter(emp =>
      emp.status === 'active' || emp.status === 'it_leave',
    );

    // EMPLEADOS EN BAJA IT: Solo los que están en baja IT
    const itLeaveEmployees = allEmployees.filter(emp => emp.status === 'it_leave');

    // EMPLEADOS EN PENDIENTE LABORAL: Solo los que están en pending_laboral
    const pendingLaboralEmployees = allEmployees.filter(emp => emp.status === 'pending_laboral');

    // EMPLEADOS PENALIZADOS: Solo los que están en penalizado
    const penalizedEmployees = allEmployees.filter(emp => emp.status === 'penalizado');

    // NOTIFICACIONES PENDIENTES: Solo las que necesitan acción del super admin
    const pendingNotifications = allNotifications.filter(notif => notif.status === 'pending');

    // EMPLEADOS POR CIUDAD: Incluir TODOS los empleados (activos + baja IT + baja empresa)
    const allEmployeesForCities = [...allEmployees];

    // Agregar empleados de baja empresa (extraer de employeeData JSON)
    allCompanyLeaves.forEach(leave => {
      if (leave.employeeData) {
        const empData = leave.employeeData as Record<string, unknown>;
        allEmployeesForCities.push({
          ...empData,
          status: `company_leave_${leave.status}`, // para identificación
        } as any);
      }
    });

    // Agrupar por ciudad
    const cityGroups = allEmployeesForCities.reduce((acc, emp) => {
      const city = emp.ciudad || 'Sin ciudad';
      if (!acc[city]) acc[city] = 0;
      acc[city]++;
      return acc;
    }, {} as Record<string, number>);

    // Convertir a array y ordenar por cantidad (mayor a menor)
    const employeesByCity = Object.entries(cityGroups)
      .map(([city, count]) => ({ city, count }))
      .sort((a, b) => (b.count as number) - (a.count as number));

    const metrics = {
      totalEmployees, // TODOS: activos + baja IT + baja empresa
      activeEmployees: activeEmployees.length, // TRABAJANDO: activos + baja IT
      itLeaves: itLeaveEmployees.length, // SOLO BAJA IT
      pendingLaboral: pendingLaboralEmployees.length, // EMPLEADOS EN PENDIENTE LABORAL
      penalizedEmployees: penalizedEmployees.length, // EMPLEADOS PENALIZADOS
      pendingActions: pendingNotifications.length, // NOTIFICACIONES PENDIENTES
      employeesByCity, // POR CIUDAD (TODOS)
    };

    if (process.env.NODE_ENV !== 'production') console.log('📊 [METRICS] Métricas calculadas:', {
      totalEmployees: metrics.totalEmployees,
      activeEmployees: metrics.activeEmployees,
      itLeaves: metrics.itLeaves,
      pendingLaboral: metrics.pendingLaboral,
      penalized: metrics.penalizedEmployees,
      pendingActions: metrics.pendingActions,
      topCities: metrics.employeesByCity.slice(0, 5),
    });

    return metrics;
  }

  // Bulk operations for replacing entire employee database
  async clearAllEmployees (): Promise<void> {
    if (process.env.NODE_ENV !== 'production') console.log('Clearing all employees from PostgreSQL database');
    await db.delete(employees);
  }

  async bulkCreateEmployees (employeeDataList: InsertEmployee[]): Promise<Employee[]> {
    if (process.env.NODE_ENV !== 'production') console.log('Bulk creating employees in PostgreSQL:', employeeDataList.length);

    try {
      // Calcular CDP para cada empleado
      const employeesWithCDP = employeeDataList.map(employee => ({
        ...employee,
        cdp: calculateCDP(employee.horas),
      }));

      if (process.env.NODE_ENV !== 'production') console.log('Processed employees with CDP:', employeesWithCDP.length);

      const createdEmployees = await db.insert(employees).values(employeesWithCDP as InsertEmployee[]).returning();
      if (process.env.NODE_ENV !== 'production') console.log('Bulk operation completed. Total employees:', createdEmployees.length);
      return createdEmployees;
    } catch (error) {
      if (process.env.NODE_ENV !== 'production') console.error('❌ Error in bulkCreateEmployees:', error);
      throw error;
    }
  }

  // Utility methods for data validation and parsing
  private parseDate (dateValue: string | Date | null | undefined): Date | null {
    if (!dateValue) return null;
    if (dateValue instanceof Date) return dateValue;
    if (typeof dateValue === 'string') {
      const parsed = new Date(dateValue);
      return isNaN(parsed.getTime()) ? null : parsed;
    }
    return null;
  }

  private parseBoolean (value: string | boolean | null | undefined): boolean {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'string') {
      const lowerValue = value.toLowerCase();
      return lowerValue === 'true' || lowerValue === '1' || lowerValue === 'yes';
    }
    return false;
  }

  private validateStatus (status: string | null | undefined): string {
    if (!status) return 'active';
    const validStatuses = ['it_leave', 'active', 'company_leave_pending', 'company_leave_approved', 'pending_laboral', 'pendiente_laboral', 'penalizado'];
    return validStatuses.includes(status) ? status : 'active';
  }

  // City and fleet operations
  async getUniqueCities (): Promise<string[]> {
    return [...CIUDADES_DISPONIBLES];
  }

  // System user operations
  async getAllSystemUsers (): Promise<SystemUser[]> {
    return await db.select().from(systemUsers).orderBy(systemUsers.createdAt);
  }

  async getSystemUser (id: number): Promise<SystemUser | undefined> {
    const [user] = await db.select().from(systemUsers).where(eq(systemUsers.id, id));
    return user;
  }

  async getSystemUserByEmail (email: string): Promise<SystemUser | undefined> {
    const [user] = await db.select().from(systemUsers).where(eq(systemUsers.email, email));
    return user;
  }

  async createSystemUser (userData: InsertSystemUser): Promise<SystemUser> {
    const [user] = await db.insert(systemUsers).values(userData).returning();
    return user;
  }

  async updateSystemUser (id: number, userData: UpdateSystemUser): Promise<SystemUser> {
    const [user] = await db
      .update(systemUsers)
      .set({ ...userData, updatedAt: new Date() })
      .where(eq(systemUsers.id, id))
      .returning();
    return user;
  }

  async deleteSystemUser (id: number): Promise<void> {
    await db.delete(systemUsers).where(eq(systemUsers.id, id));
  }

  async updateSystemUserLastLogin (id: number): Promise<void> {
    await db
      .update(systemUsers)
      .set({ lastLogin: new Date() })
      .where(eq(systemUsers.id, id));
  }

  async updateSystemUserPassword (id: number, hashedPassword: string): Promise<SystemUser> {
    const [user] = await db
      .update(systemUsers)
      .set({ password: hashedPassword, updatedAt: new Date() })
      .where(eq(systemUsers.id, id))
      .returning();
    return user;
  }

  // Audit log operations
  async createAuditLog (logData: InsertAuditLog): Promise<AuditLog> {
    const [log] = await db.insert(auditLogs).values(logData).returning();
    return log;
  }

  async getAllAuditLogs (limit: number = 1000): Promise<AuditLog[]> {
    return await db
      .select()
      .from(auditLogs)
      .orderBy(desc(auditLogs.createdAt))
      .limit(limit);
  }

  async getAuditLogsByUser (userId: string, limit: number = 100): Promise<AuditLog[]> {
    return await db
      .select()
      .from(auditLogs)
      .where(eq(auditLogs.userId, userId))
      .orderBy(auditLogs.createdAt)
      .limit(limit);
  }

  async getAuditLogsByAction (action: string, limit: number = 100): Promise<AuditLog[]> {
    return await db
      .select()
      .from(auditLogs)
      .where(eq(auditLogs.action, action))
      .orderBy(auditLogs.createdAt)
      .limit(limit);
  }

  async getAuditLogsByEntity (entityType: string, entityId?: string, limit: number = 100): Promise<AuditLog[]> {
    if (entityId) {
      return await db
        .select()
        .from(auditLogs)
        .where(and(eq(auditLogs.entityType, entityType), eq(auditLogs.entityId, entityId)))
        .orderBy(auditLogs.createdAt)
        .limit(limit);
    }

    return await db
      .select()
      .from(auditLogs)
      .where(eq(auditLogs.entityType, entityType))
      .orderBy(auditLogs.createdAt)
      .limit(limit);
  }

  async getAuditLogsStats (): Promise<{
    totalLogs: number;
    logsByAction: Record<string, number>;
    logsByUser: Record<string, number>;
    logsByEntity: Record<string, number>;
    recentActivity: AuditLog[];
  }> {
    const allLogs = await this.getAllAuditLogs(1000);

    const logsByAction: Record<string, number> = {};
    const logsByUser: Record<string, number> = {};
    const logsByEntity: Record<string, number> = {};

    allLogs.forEach(log => {
      logsByAction[log.action] = (logsByAction[log.action] || 0) + 1;
      logsByUser[log.userId] = (logsByUser[log.userId] || 0) + 1;
      logsByEntity[log.entityType] = (logsByEntity[log.entityType] || 0) + 1;
    });

    return {
      totalLogs: allLogs.length,
      logsByAction,
      logsByUser,
      logsByEntity,
      recentActivity: allLogs.slice(0, 10),
    };
  }

  // Penalization operations
  async penalizeEmployee (employeeId: string, startDate: string, endDate: string, observations: string): Promise<Employee> {
    try {
      // Get current employee data
      const employee = await this.getEmployee(employeeId);
      if (!employee) {
        throw new Error('Employee not found');
      }

      // Store original hours if not already stored
      const originalHours = employee.originalHours || employee.horas || 0;

      // Update employee with penalization data
      const [updatedEmployee] = await db
        .update(employees)
        .set({
          status: 'penalizado',
          penalizationStartDate: startDate,
          penalizationEndDate: endDate,
          originalHours: originalHours,
          horas: 0, // Set hours to 0 during penalization
          updatedAt: new Date(),
        } as Record<string, unknown>)
        .where(eq(employees.idGlovo, employeeId))
        .returning();

      // Create notification for the penalization
      await this.createNotification({
        type: 'employee_update',
        title: 'Empleado Penalizado',
        message: `El empleado ${employee.nombre} ${employee.apellido || ''} (${employeeId}) ha sido penalizado desde ${startDate} hasta ${endDate}. Observaciones: ${observations}`,
        requestedBy: 'SYSTEM',
        status: 'processed',
        metadata: {
          ...getEmpleadoMetadata(employee),
          employeeId,
          startDate,
          endDate,
          observations,
          originalHours,
        },
      });

      return updatedEmployee;
    } catch (error) {
      console.error('Error penalizing employee:', error);
      throw error;
    }
  }

  async removePenalization (employeeId: string): Promise<Employee> {
    try {
      // Get current employee data to access originalHours
      const employee = await this.getEmployee(employeeId);
      if (!employee) {
        throw new Error('Employee not found');
      }

      // Restore original hours or keep current hours if no originalHours stored
      const hoursToRestore = employee.originalHours || employee.horas || 0;

      const [updatedEmployee] = await db
        .update(employees)
        .set({
          penalizationStartDate: null,
          penalizationEndDate: null,
          status: 'active',
          horas: hoursToRestore, // Restore original hours
          originalHours: null, // Clear original hours after restoration
          updatedAt: new Date(),
        })
        .where(eq(employees.idGlovo, employeeId))
        .returning();

      // Create notification for the penalization removal
      await this.createNotification({
        type: 'employee_update',
        title: 'Penalización Removida',
        message: `La penalización del empleado ${employee.nombre} ${employee.apellido || ''} (${employeeId}) ha sido removida. Horas restauradas: ${hoursToRestore}`,
        requestedBy: 'SYSTEM',
        status: 'processed',
        metadata: {
          ...getEmpleadoMetadata(employee),
          employeeId,
          restoredHours: hoursToRestore,
        },
      });

      return updatedEmployee;
    } catch (error) {
      console.error('Error removing employee penalization:', error);
      throw error;
    }
  }

  async reactivateEmployee (employeeId: string): Promise<Employee> {
    const [employee] = await db
      .update(employees)
      .set({
        status: 'active',
        updatedAt: new Date(),
      })
      .where(eq(employees.idGlovo, employeeId))
      .returning();
    return employee;
  }

  // Check and auto-restore expired penalizations
  async checkAndRestoreExpiredPenalizations (): Promise<{
    checked: number;
    restored: number;
    restoredEmployees: Employee[];
    pendingPenalizations: Employee[];
  }> {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Set to start of day for date comparison

      // Get all penalized employees with expired end dates
      const expiredPenalizations = await db
        .select()
        .from(employees)
        .where(
          and(
            eq(employees.status, 'penalizado'),
            isNotNull(employees.penalizationEndDate),
            lt(employees.penalizationEndDate, today)
          )
        );

      // Get all penalized employees with future end dates (for information)
      const pendingPenalizations = await db
        .select()
        .from(employees)
        .where(
          and(
            eq(employees.status, 'penalizado'),
            isNotNull(employees.penalizationEndDate),
            sql`${employees.penalizationEndDate} >= ${today}`
          )
        );

      if (process.env.NODE_ENV !== 'production') {
        console.log(`🔍 [PENALIZATION] Checking ${expiredPenalizations.length} expired penalizations`);
        console.log(`⏳ [PENALIZATION] Found ${pendingPenalizations.length} pending penalizations`);
      }

      const restoredEmployees: Employee[] = [];

      // Restore each expired penalization
      for (const employee of expiredPenalizations) {
        try {
          const restoredEmployee = await this.removePenalization(employee.idGlovo);
          restoredEmployees.push(restoredEmployee);

          if (process.env.NODE_ENV !== 'production') {
            console.log(`✅ [PENALIZATION] Auto-restored penalization for ${employee.nombre} ${employee.apellido || ''} (${employee.idGlovo})`);
          }
        } catch (error) {
          console.error(`❌ [PENALIZATION] Error auto-restoring penalization for ${employee.idGlovo}:`, error);
        }
      }

      return {
        checked: expiredPenalizations.length,
        restored: restoredEmployees.length,
        restoredEmployees,
        pendingPenalizations,
      };
    } catch (error) {
      console.error('❌ [PENALIZATION] Error checking expired penalizations:', error);
      throw error;
    }
  }

  async setEmployeeItLeave (employeeId: string, fechaIncidencia: string | Date): Promise<Employee> {
    const now = new Date();
    const [updatedEmployee] = await db
      .update(employees)
      .set({
        status: 'it_leave',
        fechaIncidencia: fechaIncidencia || now,
        updatedAt: now,
      } as Record<string, unknown>)
      .where(eq(employees.idGlovo, employeeId))
      .returning();
    return updatedEmployee;
  }

  // Get penalizations expiring soon (within next 7 days)
  async getPenalizationsExpiringSoon (days: number = 7): Promise<Employee[]> {
    try {
      const today = new Date();
      const futureDate = new Date();
      futureDate.setDate(today.getDate() + days);
      today.setHours(0, 0, 0, 0);
      futureDate.setHours(23, 59, 59, 999);

      const expiringPenalizations = await db
        .select()
        .from(employees)
        .where(
          and(
            eq(employees.status, 'penalizado'),
            isNotNull(employees.penalizationEndDate),
            sql`${employees.penalizationEndDate} >= ${today}`,
            sql`${employees.penalizationEndDate} <= ${futureDate}`
          )
        );

      return expiringPenalizations;
    } catch (error) {
      console.error('❌ [PENALIZATION] Error getting expiring penalizations:', error);
      throw error;
    }
  }

  /**
   * Elimina empleados con status 'company_leave_approved' que ya existen en company_leaves.
   * Retorna un resumen de los empleados eliminados.
   */
  async cleanCompanyLeaveApprovedEmployees(): Promise<{ deleted: string[]; total: number }> {
    // Obtener todos los empleados con status 'company_leave_approved'
    const empleados = await db.select().from(employees).where(eq(employees.status, 'company_leave_approved'));
    if (!empleados.length) return { deleted: [], total: 0 };

    // Obtener todos los employee_id de company_leaves
    const leaves = await db.select({ employeeId: companyLeaves.employeeId }).from(companyLeaves);
    const leavesIds = new Set(leaves.map(l => l.employeeId));

    // Filtrar empleados que existen en company_leaves
    const empleadosAEliminar = empleados.filter(emp => leavesIds.has(emp.idGlovo));
    if (!empleadosAEliminar.length) return { deleted: [], total: 0 };

    // Eliminar empleados
    await db.delete(employees).where(
      and(
        eq(employees.status, 'company_leave_approved'),
        inArray(employees.idGlovo, empleadosAEliminar.map(e => e.idGlovo))
      )
    );

    return { deleted: empleadosAEliminar.map(e => e.idGlovo), total: empleadosAEliminar.length };
  }
}
