import { PostgresStorage } from "./storage-postgres.js";
import type { InsertAuditLog } from "../shared/schema.js";

const storage = new PostgresStorage();

export class AuditService {
  /**
   * Registra una acción en el log de auditoría
   */
  static async logAction({
    userId,
    userRole,
    action,
    entityType,
    entityId,
    entityName,
    description,
    oldData,
    newData,
    req
  }: {
    userId: string;
    userRole: "super_admin" | "admin";
    action: string;
    entityType: string;
    entityId?: string;
    entityName?: string;
    description: string;
    oldData?: any;
    newData?: any;
    req?: any; // Express request object
  }): Promise<void> {
    try {
      const logData: InsertAuditLog = {
        userId,
        userRole,
        action,
        entityType,
        entityId,
        entityName,
        description,
        oldData: oldData ? JSON.parse(JSON.stringify(oldData)) : null,
        newData: newData ? JSON.parse(JSON.stringify(newData)) : null,
        ipAddress: req?.ip || req?.connection?.remoteAddress || 'unknown',
        userAgent: req?.headers?.['user-agent'] || 'unknown'
      };

      await storage.createAuditLog(logData);
      
      console.log("✅ [AUDIT] Action logged:", {
        user: userId,
        action,
        entity: entityType,
        entityId,
        description
      });
    } catch (error) {
      console.error("❌ [AUDIT] Failed to log action:", error);
      // No lanzamos el error para que no interrumpa la operación principal
    }
  }

  // ========================================
  // MÉTODOS ESPECÍFICOS PARA CADA ACCIÓN
  // ========================================

  static async logEmployeeCreation(userId: string, userRole: "super_admin" | "admin", employeeData: any, req?: any) {
    await this.logAction({
      userId,
      userRole,
      action: "create_employee",
      entityType: "employee",
      entityId: employeeData.idGlovo,
      entityName: `${employeeData.nombre} ${employeeData.apellido || ''}`.trim(),
      description: `Empleado creado: ${employeeData.nombre} ${employeeData.apellido || ''} (${employeeData.idGlovo})`,
      newData: employeeData,
      req
    });
  }

  static async logEmployeeUpdate(userId: string, userRole: "super_admin" | "admin", employeeId: string, oldData: any, newData: any, req?: any) {
    await this.logAction({
      userId,
      userRole,
      action: "update_employee",
      entityType: "employee",
      entityId: employeeId,
      entityName: `${newData.nombre || oldData.nombre} ${newData.apellido || oldData.apellido || ''}`.trim(),
      description: `Empleado actualizado: ${newData.nombre || oldData.nombre} ${newData.apellido || oldData.apellido || ''} (${employeeId})`,
      oldData,
      newData,
      req
    });
  }

  static async logEmployeeDelete(userId: string, userRole: "super_admin" | "admin", employeeData: any, req?: any) {
    await this.logAction({
      userId,
      userRole,
      action: "delete_employee",
      entityType: "employee",
      entityId: employeeData.idGlovo,
      entityName: `${employeeData.nombre} ${employeeData.apellido || ''}`.trim(),
      description: `Empleado eliminado: ${employeeData.nombre} ${employeeData.apellido || ''} (${employeeData.idGlovo})`,
      oldData: employeeData,
      req
    });
  }

  static async logBulkImport(userId: string, userRole: "super_admin" | "admin", employeeCount: number, req?: any) {
    await this.logAction({
      userId,
      userRole,
      action: "bulk_import_employees",
      entityType: "employee",
      entityName: `${employeeCount} empleados`,
      description: `Importación masiva realizada: ${employeeCount} empleados importados`,
      newData: { employeeCount, timestamp: new Date().toISOString() },
      req
    });
  }

  static async logCompanyLeaveRequest(userId: string, userRole: "super_admin" | "admin", employeeData: any, leaveType: string, leaveDate: string, req?: any) {
    await this.logAction({
      userId,
      userRole,
      action: "request_company_leave",
      entityType: "company_leave",
      entityId: employeeData.idGlovo,
      entityName: `${employeeData.nombre} ${employeeData.apellido || ''}`.trim(),
      description: `Solicitud de baja empresa: ${employeeData.nombre} ${employeeData.apellido || ''} - Tipo: ${leaveType} - Fecha: ${leaveDate}`,
      newData: { employeeId: employeeData.idGlovo, leaveType, leaveDate },
      req
    });
  }

  static async logCompanyLeaveApproval(userId: string, userRole: "super_admin", employeeData: any, leaveType: string, action: "approve" | "reject", processingDate: string, req?: any) {
    await this.logAction({
      userId,
      userRole,
      action: action === "approve" ? "approve_company_leave" : "reject_company_leave",
      entityType: "company_leave",
      entityId: employeeData.idGlovo,
      entityName: `${employeeData.nombre} ${employeeData.apellido || ''}`.trim(),
      description: `Baja empresa ${action === "approve" ? "aprobada" : "rechazada"}: ${employeeData.nombre} ${employeeData.apellido || ''} - Tipo: ${leaveType} - Fecha: ${processingDate}`,
      newData: { action, employeeId: employeeData.idGlovo, leaveType, processingDate },
      req
    });
  }

  static async logItLeaveRequest(userId: string, userRole: "super_admin" | "admin", employeeData: any, leaveType: string, leaveDate: string, req?: any) {
    await this.logAction({
      userId,
      userRole,
      action: "request_it_leave",
      entityType: "it_leave",
      entityId: employeeData.idGlovo,
      entityName: `${employeeData.nombre} ${employeeData.apellido || ''}`.trim(),
      description: `Baja IT procesada: ${employeeData.nombre} ${employeeData.apellido || ''} - Tipo: ${leaveType} - Fecha: ${leaveDate}`,
      newData: { employeeId: employeeData.idGlovo, leaveType, leaveDate },
      req
    });
  }

  static async logEmployeeReactivation(userId: string, userRole: "super_admin", employeeData: any, req?: any) {
    await this.logAction({
      userId,
      userRole,
      action: "reactivate_employee",
      entityType: "employee",
      entityId: employeeData.idGlovo,
      entityName: `${employeeData.nombre} ${employeeData.apellido || ''}`.trim(),
      description: `Empleado reactivado desde baja IT: ${employeeData.nombre} ${employeeData.apellido || ''} (${employeeData.idGlovo}) - Cambiado de 'it_leave' a 'active'`,
      oldData: { status: "it_leave" },
      newData: { status: "active", reactivatedAt: new Date().toISOString() },
      req
    });
  }

  static async logUserCreation(userId: string, userRole: "super_admin", newUserData: any, req?: any) {
    await this.logAction({
      userId,
      userRole,
      action: "create_user",
      entityType: "user",
      entityId: newUserData.email,
      entityName: `${newUserData.firstName} ${newUserData.lastName}`,
      description: `Usuario creado: ${newUserData.firstName} ${newUserData.lastName} (${newUserData.email}) - Rol: ${newUserData.role}`,
      newData: { 
        email: newUserData.email, 
        firstName: newUserData.firstName, 
        lastName: newUserData.lastName, 
        role: newUserData.role 
      },
      req
    });
  }

  static async logUserUpdate(userId: string, userRole: "super_admin", targetUserEmail: string, oldData: any, newData: any, req?: any) {
    await this.logAction({
      userId,
      userRole,
      action: "update_user",
      entityType: "user",
      entityId: targetUserEmail,
      entityName: `${newData.firstName || oldData.firstName} ${newData.lastName || oldData.lastName}`,
      description: `Usuario actualizado: ${newData.firstName || oldData.firstName} ${newData.lastName || oldData.lastName} (${targetUserEmail})`,
      oldData: { 
        firstName: oldData.firstName, 
        lastName: oldData.lastName, 
        role: oldData.role, 
        isActive: oldData.isActive 
      },
      newData: { 
        firstName: newData.firstName, 
        lastName: newData.lastName, 
        role: newData.role, 
        isActive: newData.isActive 
      },
      req
    });
  }

  static async logUserDelete(userId: string, userRole: "super_admin", deletedUserData: any, req?: any) {
    await this.logAction({
      userId,
      userRole,
      action: "delete_user",
      entityType: "user",
      entityId: deletedUserData.email,
      entityName: `${deletedUserData.firstName} ${deletedUserData.lastName}`,
      description: `Usuario eliminado: ${deletedUserData.firstName} ${deletedUserData.lastName} (${deletedUserData.email}) - Rol: ${deletedUserData.role}`,
      oldData: { 
        email: deletedUserData.email, 
        firstName: deletedUserData.firstName, 
        lastName: deletedUserData.lastName, 
        role: deletedUserData.role 
      },
      req
    });
  }

  static async logLogin(userId: string, userRole: "super_admin" | "admin" | "normal", req?: any) {
    await this.logAction({
      userId,
      userRole: userRole as "super_admin" | "admin", // Solo admin y super_admin se loggean
      action: "user_login",
      entityType: "session",
      entityId: userId,
      entityName: userId,
      description: `Usuario inició sesión: ${userId} - Rol: ${userRole}`,
      newData: { loginTime: new Date().toISOString(), userRole },
      req
    });
  }

  static async logLogout(userId: string, userRole: "super_admin" | "admin" | "normal", req?: any) {
    await this.logAction({
      userId,
      userRole: userRole as "super_admin" | "admin", // Solo admin y super_admin se loggean
      action: "user_logout",
      entityType: "session",
      entityId: userId,
      entityName: userId,
      description: `Usuario cerró sesión: ${userId} - Rol: ${userRole}`,
      newData: { logoutTime: new Date().toISOString(), userRole },
      req
    });
  }
}

export default AuditService; 