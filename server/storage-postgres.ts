import { eq, like, sql } from "drizzle-orm";
import { db } from "./db.js";
import {
  users,
  employees,
  companyLeaves,
  itLeaves,
  notifications,
  systemUsers,
  auditLogs,
  type User,
  type UpsertUser,
  type Employee,
  type InsertEmployee,
  type UpdateEmployee,
  type CompanyLeave,
  type InsertCompanyLeave,
  type ItLeave,
  type InsertItLeave,
  type Notification,
  type InsertNotification,
  type SystemUser,
  type InsertSystemUser,
  type UpdateSystemUser,
  type AuditLog,
  type InsertAuditLog,
} from "../shared/schema.js";
// import { IStorage } from "./storage.js";

// Función utilitaria para calcular CDP (Cumplimiento de Horas)
// 38 horas = 100%, regla de 3 simple
export const calculateCDP = (horas: number | null | undefined): number => {
  if (!horas || horas <= 0) return 0;
  if (horas >= 38) return 100;
  return Math.round((horas * 100) / 38);
};

export class PostgresStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    try {
      // Try to insert first
      const [user] = await db
        .insert(users)
        .values(userData)
        .returning();
      return user;
    } catch (error) {
      // If insert fails (user exists), update instead
      const [user] = await db
        .update(users)
        .set({
          ...userData,
          updatedAt: new Date(),
        })
        .where(eq(users.id, userData.id))
        .returning();
      return user;
    }
  }

  // Employee operations
  async getAllEmployees(): Promise<Employee[]> {
    return await db.select().from(employees);
  }

  async getEmployee(id: string): Promise<Employee | undefined> {
    const [employee] = await db.select().from(employees).where(eq(employees.idGlovo, id));
    return employee;
  }

  async createEmployee(employeeData: InsertEmployee): Promise<Employee> {
    // Calcular CDP automáticamente basado en las horas
    const cdp = calculateCDP(employeeData.horas);
    const employeeDataWithCDP = { ...employeeData, cdp };
    
    const [employee] = await db.insert(employees).values(employeeDataWithCDP).returning();
    return employee;
  }

  async updateEmployee(id: string, employeeData: UpdateEmployee): Promise<Employee> {
    // Calcular CDP automáticamente si se actualizan las horas
    const cdp = calculateCDP(employeeData.horas);
    const employeeDataWithCDP = { ...employeeData, cdp };
    
    const [employee] = await db
      .update(employees)
      .set(employeeDataWithCDP)
      .where(eq(employees.idGlovo, id))
      .returning();
    return employee;
  }

  async deleteEmployee(id: string): Promise<void> {
    await db.delete(employees).where(eq(employees.idGlovo, id));
  }

  async getEmployeesByCity(city: string): Promise<Employee[]> {
    return await db.select().from(employees).where(eq(employees.ciudad, city));
  }

  async searchEmployees(query: string): Promise<Employee[]> {
    return await db
      .select()
      .from(employees)
      .where(
        sql`LOWER(${employees.nombre}) LIKE ${`%${query.toLowerCase()}%`} OR 
            LOWER(${employees.apellido}) LIKE ${`%${query.toLowerCase()}%`} OR 
            LOWER(${employees.email}) LIKE ${`%${query.toLowerCase()}%`} OR
            LOWER(${employees.emailGlovo}) LIKE ${`%${query.toLowerCase()}%`}`
      );
  }

  async getEmployeesByStatus(status: string): Promise<Employee[]> {
    return await db.select().from(employees).where(eq(employees.statusBaja, status));
  }

  // Company leave operations
  async getAllCompanyLeaves(): Promise<CompanyLeave[]> {
    return await db.select().from(companyLeaves).orderBy(companyLeaves.createdAt);
  }

  async createCompanyLeave(leaveData: InsertCompanyLeave): Promise<CompanyLeave> {
    const [leave] = await db.insert(companyLeaves).values(leaveData).returning();
    return leave;
  }

  // IT leave operations
  async getAllItLeaves(): Promise<ItLeave[]> {
    return await db.select().from(itLeaves).orderBy(itLeaves.createdAt);
  }

  async createItLeave(leaveData: InsertItLeave): Promise<ItLeave> {
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
      const processedData = {
        ...leaveData,
        leaveDate: leaveData.leaveDate || new Date(),
        requestedAt: leaveData.requestedAt || new Date(),
        approvedAt: leaveData.approvedAt || new Date(),
        status: (leaveData.status as "pending" | "approved" | "rejected") || "approved"
      };

      if (process.env.NODE_ENV !== 'production') console.log('📝 [STORAGE] Processed data for insertion:', JSON.stringify(processedData, null, 2));

      const [leave] = await db.insert(itLeaves).values(processedData).returning();
      
      if (process.env.NODE_ENV !== 'production') console.log('✅ [STORAGE] IT leave created successfully:', JSON.stringify(leave, null, 2));
      return leave;
    } catch (error) {
      if (process.env.NODE_ENV !== 'production') console.error('💥 [STORAGE] Error in createItLeave:', error);
      if (process.env.NODE_ENV !== 'production') console.error('💥 [STORAGE] Original data that failed:', JSON.stringify(leaveData, null, 2));
      throw error;
    }
  }

  // Notification operations
  async getAllNotifications(): Promise<Notification[]> {
    return await db.select().from(notifications).orderBy(notifications.createdAt);
  }

  async createNotification(notificationData: InsertNotification): Promise<Notification> {
    const [notification] = await db.insert(notifications).values(notificationData).returning();
    return notification;
  }

  async updateNotificationStatus(id: number, status: "pending" | "pending_laboral" | "approved" | "rejected" | "processed"): Promise<Notification> {
    const [notification] = await db
      .update(notifications)
      .set({ status, updatedAt: new Date() })
      .where(eq(notifications.id, id))
      .returning();
    return notification;
  }

  async deleteNotification(id: number): Promise<void> {
    await db.delete(notifications).where(eq(notifications.id, id));
  }

  // Dashboard metrics - COMPLETAMENTE REDISEÑADO
  async getDashboardMetrics() {
    if (process.env.NODE_ENV !== 'production') console.log("📊 [METRICS] Calculando métricas del dashboard...");
    
    // Obtener todos los datos necesarios
    const [allEmployees, allCompanyLeaves, allNotifications] = await Promise.all([
      this.getAllEmployees(),
      this.getAllCompanyLeaves(), 
      this.getAllNotifications()
    ]);

    if (process.env.NODE_ENV !== 'production') console.log("📊 [METRICS] Datos obtenidos:", {
      empleadosEnTablaEmpleados: allEmployees.length,
      empleadosEnBajaEmpresa: allCompanyLeaves.length,
      notificaciones: allNotifications.length
    });

    // TOTAL DE EMPLEADOS: Todos los que existen (activos + baja IT + baja empresa)
    const totalEmployees = allEmployees.length + allCompanyLeaves.length;

    // TRABAJADORES ACTIVOS: Solo activos + baja IT (excluye baja empresa y pendientes de baja empresa)
    const activeEmployees = allEmployees.filter(emp => 
      emp.status === "active" || emp.status === "it_leave"
    );

    // EMPLEADOS EN BAJA IT: Solo los que están en baja IT
    const itLeaveEmployees = allEmployees.filter(emp => emp.status === "it_leave");

    // EMPLEADOS EN PENDIENTE LABORAL: Solo los que están en pending_laboral
    const pendingLaboralEmployees = allEmployees.filter(emp => emp.status === "pending_laboral");

    // EMPLEADOS PENALIZADOS: Solo los que están en penalizado
    const penalizedEmployees = allEmployees.filter(emp => emp.status === "penalizado");

    // NOTIFICACIONES PENDIENTES: Solo las que necesitan acción del super admin
    const pendingNotifications = allNotifications.filter(notif => notif.status === "pending");

    // EMPLEADOS POR CIUDAD: Incluir TODOS los empleados (activos + baja IT + baja empresa)
    const allEmployeesForCities = [...allEmployees];
    
    // Agregar empleados de baja empresa (extraer de employeeData JSON)
    allCompanyLeaves.forEach(leave => {
      if (leave.employeeData) {
        const empData = leave.employeeData as any;
        allEmployeesForCities.push({
          ...empData,
          status: `company_leave_${leave.status}` // para identificación
        });
      }
    });

    // Agrupar por ciudad
    const cityGroups = allEmployeesForCities.reduce((acc, emp) => {
      const city = emp.ciudad || "Sin ciudad";
      if (!acc[city]) acc[city] = 0;
      acc[city]++;
      return acc;
    }, {} as Record<string, number>);
    
    // Convertir a array y ordenar por cantidad (mayor a menor)
    const employeesByCity = Object.entries(cityGroups)
      .map(([city, count]) => ({ city, count }))
      .sort((a, b) => b.count - a.count);

    const metrics = {
      totalEmployees,                    // TODOS: activos + baja IT + baja empresa
      activeEmployees: activeEmployees.length,  // TRABAJANDO: activos + baja IT
      itLeaves: itLeaveEmployees.length,       // SOLO BAJA IT
      pendingLaboral: pendingLaboralEmployees.length, // EMPLEADOS EN PENDIENTE LABORAL
      penalizedEmployees: penalizedEmployees.length,       // EMPLEADOS PENALIZADOS
      pendingActions: pendingNotifications.length, // NOTIFICACIONES PENDIENTES
      employeesByCity,                         // POR CIUDAD (TODOS)
      // Métricas adicionales para debugging
      debug: {
        employeesInActiveTable: allEmployees.length,
        employeesInCompanyLeave: allCompanyLeaves.length,
        employeesByStatus: {
          active: allEmployees.filter(e => e.status === "active").length,
          it_leave: allEmployees.filter(e => e.status === "it_leave").length,
          company_leave_pending: allEmployees.filter(e => e.status === "company_leave_pending").length,
          company_leave_approved: allEmployees.filter(e => e.status === "company_leave_approved").length,
        }
      }
    };

    if (process.env.NODE_ENV !== 'production') console.log("📊 [METRICS] Métricas calculadas:", {
      totalEmployees: metrics.totalEmployees,
      activeEmployees: metrics.activeEmployees,
      itLeaves: metrics.itLeaves,
      pendingLaboral: metrics.pendingLaboral,
      penalized: metrics.penalizedEmployees,
      pendingActions: metrics.pendingActions,
      topCities: metrics.employeesByCity.slice(0, 5),
      debug: metrics.debug
    });

    return metrics;
  }

  // Bulk operations for replacing entire employee database
  async clearAllEmployees(): Promise<void> {
    if (process.env.NODE_ENV !== 'production') console.log("Clearing all employees from PostgreSQL database");
    await db.delete(employees);
  }

  async bulkCreateEmployees(employeeDataList: InsertEmployee[]): Promise<Employee[]> {
    if (process.env.NODE_ENV !== 'production') console.log("Bulk creating employees in PostgreSQL:", employeeDataList.length);
    
    // Calcular CDP para cada empleado
    const employeesWithCDP = employeeDataList.map(employee => ({
      ...employee,
      cdp: calculateCDP(employee.horas)
    }));
    
    const createdEmployees = await db.insert(employees).values(employeesWithCDP).returning();
    if (process.env.NODE_ENV !== 'production') console.log("Bulk operation completed. Total employees:", createdEmployees.length);
    return createdEmployees;
  }

  // Filter helpers for unique values
  async getUniqueCities(): Promise<string[]> {
    const result = await db
      .selectDistinct({ ciudad: employees.ciudad })
      .from(employees)
      .where(sql`${employees.ciudad} IS NOT NULL AND ${employees.ciudad} != ''`)
      .orderBy(employees.ciudad);
    
    return result.map(row => row.ciudad!).filter(Boolean);
  }

  async getUniqueFleets(): Promise<string[]> {
    const result = await db
      .selectDistinct({ flota: employees.flota })
      .from(employees)
      .where(sql`${employees.flota} IS NOT NULL AND ${employees.flota} != ''`)
      .orderBy(employees.flota);
    return result.map(row => row.flota!).filter(Boolean);
  }

  // ============================================
  // SYSTEM USERS MANAGEMENT (Super Admin Only)
  // ============================================
  
  async getAllSystemUsers(): Promise<SystemUser[]> {
    if (process.env.NODE_ENV !== 'production') console.log("👥 [USERS] Getting all system users");
    return await db.select().from(systemUsers).orderBy(systemUsers.createdAt);
  }

  async getSystemUser(id: number): Promise<SystemUser | undefined> {
    if (process.env.NODE_ENV !== 'production') console.log("👤 [USERS] Getting system user by ID:", id);
    const [user] = await db.select().from(systemUsers).where(eq(systemUsers.id, id));
    return user;
  }

  async getSystemUserByEmail(email: string): Promise<SystemUser | undefined> {
    if (process.env.NODE_ENV !== 'production') console.log("👤 [USERS] Getting system user by email:", email);
    const [user] = await db.select().from(systemUsers).where(eq(systemUsers.email, email));
    return user;
  }

  async createSystemUser(userData: InsertSystemUser): Promise<SystemUser> {
    if (process.env.NODE_ENV !== 'production') console.log("➕ [USERS] Creating new system user:", userData.email, userData.role);
    const [user] = await db.insert(systemUsers).values(userData).returning();
    if (process.env.NODE_ENV !== 'production') console.log("✅ [USERS] System user created successfully:", user.id, user.email);
    return user;
  }

  async updateSystemUser(id: number, userData: UpdateSystemUser): Promise<SystemUser> {
    if (process.env.NODE_ENV !== 'production') console.log("📝 [USERS] Updating system user:", id, userData);
    const [user] = await db
      .update(systemUsers)
      .set({ ...userData, updatedAt: new Date() })
      .where(eq(systemUsers.id, id))
      .returning();
    if (process.env.NODE_ENV !== 'production') console.log("✅ [USERS] System user updated successfully:", user.email);
    return user;
  }

  async deleteSystemUser(id: number): Promise<void> {
    if (process.env.NODE_ENV !== 'production') console.log("🗑️ [USERS] Deleting system user:", id);
    await db.delete(systemUsers).where(eq(systemUsers.id, id));
    if (process.env.NODE_ENV !== 'production') console.log("✅ [USERS] System user deleted successfully");
  }

  async updateSystemUserLastLogin(id: number): Promise<void> {
    if (process.env.NODE_ENV !== 'production') console.log("🔄 [USERS] Updating last login for user:", id);
    await db
      .update(systemUsers)
      .set({ lastLogin: new Date() })
      .where(eq(systemUsers.id, id));
  }

  // ============================================
  // AUDIT LOGS (Comprehensive Action Tracking)
  // ============================================

  async createAuditLog(logData: InsertAuditLog): Promise<AuditLog> {
    if (process.env.NODE_ENV !== 'production') console.log("📝 [AUDIT] Creating audit log:", {
      user: logData.userId,
      action: logData.action,
      entity: logData.entityType,
      entityId: logData.entityId
    });
    
    const [log] = await db.insert(auditLogs).values(logData).returning();
    if (process.env.NODE_ENV !== 'production') console.log("✅ [AUDIT] Audit log created:", log.id);
    return log;
  }

  async getAllAuditLogs(limit: number = 1000): Promise<AuditLog[]> {
    if (process.env.NODE_ENV !== 'production') console.log("📋 [AUDIT] Getting audit logs, limit:", limit);
    return await db
      .select()
      .from(auditLogs)
      .orderBy(sql`${auditLogs.createdAt} DESC`)
      .limit(limit);
  }

  async getAuditLogsByUser(userId: string, limit: number = 100): Promise<AuditLog[]> {
    if (process.env.NODE_ENV !== 'production') console.log("👤 [AUDIT] Getting audit logs for user:", userId, "limit:", limit);
    return await db
      .select()
      .from(auditLogs)
      .where(eq(auditLogs.userId, userId))
      .orderBy(sql`${auditLogs.createdAt} DESC`)
      .limit(limit);
  }

  async getAuditLogsByAction(action: string, limit: number = 100): Promise<AuditLog[]> {
    if (process.env.NODE_ENV !== 'production') console.log("🔍 [AUDIT] Getting audit logs for action:", action, "limit:", limit);
    return await db
      .select()
      .from(auditLogs)
      .where(eq(auditLogs.action, action))
      .orderBy(sql`${auditLogs.createdAt} DESC`)
      .limit(limit);
  }

  async getAuditLogsByEntity(entityType: string, entityId?: string, limit: number = 100): Promise<AuditLog[]> {
    if (process.env.NODE_ENV !== 'production') console.log("🎯 [AUDIT] Getting audit logs for entity:", entityType, entityId, "limit:", limit);
    
    if (entityId) {
      return await db
        .select()
        .from(auditLogs)
        .where(sql`${auditLogs.entityType} = ${entityType} AND ${auditLogs.entityId} = ${entityId}`)
        .orderBy(sql`${auditLogs.createdAt} DESC`)
        .limit(limit);
    } else {
      return await db
        .select()
        .from(auditLogs)
        .where(eq(auditLogs.entityType, entityType))
        .orderBy(sql`${auditLogs.createdAt} DESC`)
        .limit(limit);
    }
  }

  async getAuditLogsStats(): Promise<{
    totalLogs: number;
    logsByAction: Record<string, number>;
    logsByUser: Record<string, number>;
    logsByEntity: Record<string, number>;
    recentActivity: AuditLog[];
  }> {
    if (process.env.NODE_ENV !== 'production') console.log("📊 [AUDIT] Getting audit logs statistics");
    
    const allLogs = await this.getAllAuditLogs(5000); // Obtener últimos 5000 logs
    
    const stats = {
      totalLogs: allLogs.length,
      logsByAction: {} as Record<string, number>,
      logsByUser: {} as Record<string, number>,
      logsByEntity: {} as Record<string, number>,
      recentActivity: allLogs.slice(0, 20) // Últimas 20 actividades
    };

    // Contar por acción
    allLogs.forEach(log => {
      stats.logsByAction[log.action] = (stats.logsByAction[log.action] || 0) + 1;
      stats.logsByUser[log.userId] = (stats.logsByUser[log.userId] || 0) + 1;
      stats.logsByEntity[log.entityType] = (stats.logsByEntity[log.entityType] || 0) + 1;
    });

    if (process.env.NODE_ENV !== 'production') console.log("📊 [AUDIT] Stats calculated:", {
      totalLogs: stats.totalLogs,
      actionsCount: Object.keys(stats.logsByAction).length,
      usersCount: Object.keys(stats.logsByUser).length,
      entitiesCount: Object.keys(stats.logsByEntity).length
    });

    return stats;
  }
}