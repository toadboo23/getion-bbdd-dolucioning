import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { 
  insertEmployeeSchema, 
  updateEmployeeSchema, 
  insertItLeaveSchema,
  insertNotificationSchema
} from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Dashboard routes
  app.get("/api/dashboard/metrics", isAuthenticated, async (req, res) => {
    try {
      const metrics = await storage.getDashboardMetrics();
      res.json(metrics);
    } catch (error) {
      console.error("Error fetching dashboard metrics:", error);
      res.status(500).json({ message: "Failed to fetch dashboard metrics" });
    }
  });

  // Employee routes
  app.get("/api/employees", isAuthenticated, async (req, res) => {
    try {
      const { city, status, search } = req.query;
      
      let employees = await storage.getAllEmployees();
      
      if (city) {
        employees = await storage.getEmployeesByCity(city as string);
      }
      
      if (status) {
        employees = employees.filter(emp => emp.status === status);
      }
      
      if (search) {
        employees = await storage.searchEmployees(search as string);
      }
      
      res.json(employees);
    } catch (error) {
      console.error("Error fetching employees:", error);
      res.status(500).json({ message: "Failed to fetch employees" });
    }
  });

  app.get("/api/employees/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const employee = await storage.getEmployee(id);
      
      if (!employee) {
        return res.status(404).json({ message: "Employee not found" });
      }
      
      res.json(employee);
    } catch (error) {
      console.error("Error fetching employee:", error);
      res.status(500).json({ message: "Failed to fetch employee" });
    }
  });

  app.post("/api/employees", isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!user || (user.role !== "admin" && user.role !== "super_admin")) {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      const validatedData = insertEmployeeSchema.parse(req.body);
      const employee = await storage.createEmployee(validatedData);
      
      // Create notification for employee creation
      await storage.createNotification({
        type: "employee_update",
        title: "Nuevo empleado agregado",
        message: `${employee.firstName} ${employee.lastName} ha sido agregado al sistema`,
        employeeId: employee.id,
        employeeName: `${employee.firstName} ${employee.lastName}`,
        requestedBy: `${user.firstName} ${user.lastName}`,
        status: "processed"
      });
      
      res.status(201).json(employee);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error creating employee:", error);
      res.status(500).json({ message: "Failed to create employee" });
    }
  });

  app.put("/api/employees/:id", isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!user || (user.role !== "admin" && user.role !== "super_admin")) {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      const id = parseInt(req.params.id);
      const validatedData = updateEmployeeSchema.parse(req.body);
      const employee = await storage.updateEmployee(id, validatedData);
      
      // Create notification for employee update
      await storage.createNotification({
        type: "employee_update",
        title: "Empleado actualizado",
        message: `${employee.firstName} ${employee.lastName} - Datos actualizados`,
        employeeId: employee.id,
        employeeName: `${employee.firstName} ${employee.lastName}`,
        requestedBy: `${user.firstName} ${user.lastName}`,
        status: "processed"
      });
      
      res.json(employee);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error updating employee:", error);
      res.status(500).json({ message: "Failed to update employee" });
    }
  });

  // Leave management routes
  app.post("/api/employees/:id/it-leave", isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!user || (user.role !== "admin" && user.role !== "super_admin")) {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      const employeeId = parseInt(req.params.id);
      const employee = await storage.getEmployee(employeeId);
      
      if (!employee) {
        return res.status(404).json({ message: "Employee not found" });
      }

      const leaveData = insertItLeaveSchema.parse({
        ...req.body,
        employeeId,
        createdBy: `${user.firstName} ${user.lastName}`
      });
      
      const leave = await storage.createItLeave(leaveData);
      
      // Create notification for IT leave
      await storage.createNotification({
        type: "employee_update",
        title: "Baja IT procesada",
        message: `${employee.firstName} ${employee.lastName} - ${leaveData.leaveType}`,
        employeeId: employee.id,
        employeeName: `${employee.firstName} ${employee.lastName}`,
        requestedBy: `${user.firstName} ${user.lastName}`,
        status: "processed",
        metadata: { leaveType: leaveData.leaveType, leaveDate: leaveData.leaveDate }
      });
      
      res.status(201).json(leave);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error creating IT leave:", error);
      res.status(500).json({ message: "Failed to create IT leave" });
    }
  });

  app.post("/api/employees/:id/company-leave", isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!user || (user.role !== "admin" && user.role !== "super_admin")) {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      const employeeId = parseInt(req.params.id);
      const employee = await storage.getEmployee(employeeId);
      
      if (!employee) {
        return res.status(404).json({ message: "Employee not found" });
      }

      // Create notification for company leave request (requires Super Admin approval)
      const notification = await storage.createNotification({
        type: "company_leave_request",
        title: "Solicitud de Baja Empresa",
        message: `${employee.firstName} ${employee.lastName} - ${req.body.leaveType}`,
        employeeId: employee.id,
        employeeName: `${employee.firstName} ${employee.lastName}`,
        requestedBy: `${user.firstName} ${user.lastName}`,
        status: "pending",
        metadata: { 
          leaveType: req.body.leaveType, 
          leaveDate: req.body.leaveDate,
          employeeData: employee 
        }
      });
      
      res.status(201).json(notification);
    } catch (error) {
      console.error("Error creating company leave request:", error);
      res.status(500).json({ message: "Failed to create company leave request" });
    }
  });

  // Notification routes (Super Admin only)
  app.get("/api/notifications", isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!user || user.role !== "super_admin") {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      const notifications = await storage.getAllNotifications();
      res.json(notifications);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      res.status(500).json({ message: "Failed to fetch notifications" });
    }
  });

  app.post("/api/notifications/:id/approve", isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!user || user.role !== "super_admin") {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      const id = parseInt(req.params.id);
      const notification = await storage.updateNotificationStatus(id, "approved");
      
      // If it's a company leave request, process the leave
      if (notification.type === "company_leave_request" && notification.metadata) {
        const metadata = notification.metadata as any;
        const employee = await storage.getEmployee(notification.employeeId!);
        
        if (employee) {
          await storage.createCompanyLeave({
            employeeId: employee.id,
            firstName: employee.firstName,
            lastName: employee.lastName,
            email: employee.email,
            phone: employee.phone,
            city: employee.city,
            dniNie: employee.dniNie,
            birthDate: employee.birthDate,
            nationality: employee.nationality,
            naf: employee.naf,
            address: employee.address,
            iban: employee.iban,
            vehicle: employee.vehicle,
            contractHours: employee.contractHours,
            contractType: employee.contractType,
            ssStatus: employee.ssStatus,
            startDate: employee.startDate,
            age: employee.age,
            leaveType: metadata.leaveType,
            leaveDate: new Date(metadata.leaveDate),
            leaveRequestedAt: notification.createdAt!,
            leaveRequestedBy: notification.requestedBy,
            approvedBy: `${user.firstName} ${user.lastName}`
          });
        }
      }
      
      res.json(notification);
    } catch (error) {
      console.error("Error approving notification:", error);
      res.status(500).json({ message: "Failed to approve notification" });
    }
  });

  app.post("/api/notifications/:id/reject", isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!user || user.role !== "super_admin") {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      const id = parseInt(req.params.id);
      const notification = await storage.updateNotificationStatus(id, "rejected");
      
      res.json(notification);
    } catch (error) {
      console.error("Error rejecting notification:", error);
      res.status(500).json({ message: "Failed to reject notification" });
    }
  });

  // Bulk upload route (Super Admin only)
  app.post("/api/employees/bulk-upload", isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!user || user.role !== "super_admin") {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      // In a real implementation, this would parse Excel file
      // For now, we'll simulate the process
      const { employees: employeeData } = req.body;
      
      if (!employeeData || !Array.isArray(employeeData)) {
        return res.status(400).json({ message: "Invalid employee data" });
      }

      const results = [];
      for (const empData of employeeData) {
        try {
          const validatedData = insertEmployeeSchema.parse(empData);
          const employee = await storage.createEmployee(validatedData);
          results.push({ success: true, employee });
        } catch (error) {
          results.push({ success: false, error: error.message, data: empData });
        }
      }

      // Create notification for bulk upload
      await storage.createNotification({
        type: "bulk_upload",
        title: "Carga masiva completada",
        message: `${results.filter(r => r.success).length} empleados procesados correctamente`,
        requestedBy: `${user.firstName} ${user.lastName}`,
        status: "processed",
        metadata: { totalProcessed: results.length, successful: results.filter(r => r.success).length }
      });

      res.json({ results, summary: { total: results.length, successful: results.filter(r => r.success).length } });
    } catch (error) {
      console.error("Error processing bulk upload:", error);
      res.status(500).json({ message: "Failed to process bulk upload" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
