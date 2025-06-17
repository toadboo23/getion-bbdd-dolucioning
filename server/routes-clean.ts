import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage-clean.js";
import { setupAuth, isAuthenticated } from "./auth-local.js";
import { insertEmployeeSchema, insertCompanyLeaveSchema, insertItLeaveSchema, insertNotificationSchema } from "../shared/schema.js";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      res.json(user || req.user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Dashboard metrics
  app.get("/api/dashboard/metrics", isAuthenticated, async (req, res) => {
    try {
      const metrics = await storage.getDashboardMetrics();
      res.json(metrics);
    } catch (error) {
      console.error("Error fetching dashboard metrics:", error);
      res.status(500).json({ message: "Failed to fetch dashboard metrics" });
    }
  });

  // Company leaves routes
  app.get("/api/company-leaves", isAuthenticated, async (req, res) => {
    try {
      const leaves = await storage.getAllCompanyLeaves();
      res.json(leaves);
    } catch (error) {
      console.error("Error fetching company leaves:", error);
      res.status(500).json({ message: "Failed to fetch company leaves" });
    }
  });

  // Employee routes
  app.get("/api/employees", isAuthenticated, async (req, res) => {
    try {
      const { city, status, search } = req.query;
      
      let employees;
      if (search) {
        employees = await storage.searchEmployees(search as string);
      } else if (city) {
        employees = await storage.getEmployeesByCity(city as string);
      } else if (status) {
        employees = await storage.getEmployeesByStatus(status as string);
      } else {
        employees = await storage.getAllEmployees();
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
      const user = await storage.getUser(req.user.id);
      if (!user || !['super_admin', 'admin'].includes(user.role || '')) {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      const validatedData = insertEmployeeSchema.parse(req.body);
      const employee = await storage.createEmployee(validatedData);
      res.status(201).json(employee);
    } catch (error) {
      console.error("Error creating employee:", error);
      res.status(400).json({ message: "Invalid data", error: (error as Error).message });
    }
  });

  app.put("/api/employees/:id", isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (!user || !['super_admin', 'admin'].includes(user.role || '')) {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      const id = parseInt(req.params.id);
      const employee = await storage.updateEmployee(id, req.body);
      res.json(employee);
    } catch (error) {
      console.error("Error updating employee:", error);
      res.status(400).json({ message: "Failed to update employee" });
    }
  });

  app.delete("/api/employees/:id", isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (!user || user.role !== "super_admin") {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      const id = parseInt(req.params.id);
      await storage.deleteEmployee(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting employee:", error);
      res.status(500).json({ message: "Failed to delete employee" });
    }
  });

  // Company leave management
  app.post("/api/employees/:id/company-leave", isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (!user || !['super_admin', 'admin'].includes(user.role || '')) {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      const employeeId = parseInt(req.params.id);
      const employee = await storage.getEmployee(employeeId);
      
      if (!employee) {
        return res.status(404).json({ message: "Employee not found" });
      }

      const { leaveType, leaveDate } = req.body;
      
      const notification = await storage.createNotification({
        type: "company_leave_request",
        title: `Solicitud de Baja Empresa - ${employee.firstName} ${employee.lastName}`,
        message: `Solicitud de baja ${leaveType} para el empleado ${employee.firstName} ${employee.lastName}`,
        requestedBy: `${user.firstName} ${user.lastName}`,
        status: "pending",
        metadata: {
          employeeId,
          leaveType,
          leaveDate,
          employeeData: employee
        }
      });

      res.status(201).json(notification);
    } catch (error) {
      console.error("Error creating company leave request:", error);
      res.status(500).json({ message: "Failed to create company leave request" });
    }
  });

  // IT leave management
  app.post("/api/employees/:id/it-leave", isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (!user || !['super_admin', 'admin'].includes(user.role || '')) {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      const employeeId = parseInt(req.params.id);
      const { leaveType, leaveDate } = req.body;
      
      const validatedData = insertItLeaveSchema.parse({
        employeeId,
        leaveType,
        leaveDate,
        requestedBy: `${user.firstName} ${user.lastName}`,
      });

      const itLeave = await storage.createItLeave(validatedData);
      
      // Update employee status
      await storage.updateEmployee(employeeId, { status: "it_leave" });
      
      res.status(201).json(itLeave);
    } catch (error) {
      console.error("Error creating IT leave:", error);
      res.status(400).json({ message: "Invalid data", error: (error as Error).message });
    }
  });

  // Notification routes
  app.get("/api/notifications", isAuthenticated, async (req, res) => {
    try {
      const notifications = await storage.getAllNotifications();
      res.json(notifications);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      res.status(500).json({ message: "Failed to fetch notifications" });
    }
  });

  app.post("/api/notifications/:id/approve", isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (!user || user.role !== "super_admin") {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      const id = parseInt(req.params.id);
      const notification = await storage.getAllNotifications();
      const notif = notification.find(n => n.id === id);
      
      if (!notif) {
        return res.status(404).json({ message: "Notification not found" });
      }

      if (notif.type === "company_leave_request" && notif.metadata?.employeeId) {
        const employeeId = notif.metadata.employeeId;
        const employee = await storage.getEmployee(employeeId);
        
        if (employee) {
          // Create company leave record
          const companyLeave = await storage.createCompanyLeave({
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
            leaveType: notif.metadata.leaveType,
            leaveDate: new Date(notif.metadata.leaveDate),
            leaveRequestedAt: notif.createdAt,
            leaveRequestedBy: notif.requestedBy,
            approvedBy: `${user.firstName} ${user.lastName}`
          });

          // Remove employee from active list
          await storage.deleteEmployee(employeeId);
        }
      }

      const updatedNotification = await storage.updateNotificationStatus(id, "approved");
      res.json(updatedNotification);
    } catch (error) {
      console.error("Error approving notification:", error);
      res.status(500).json({ message: "Failed to approve notification" });
    }
  });

  app.post("/api/notifications/:id/reject", isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.id);
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

  // Bulk upload route
  app.post("/api/employees/bulk-upload", isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (!user || user.role !== "super_admin") {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      const { employees: employeeData } = req.body;
      
      if (!employeeData || !Array.isArray(employeeData)) {
        return res.status(400).json({ message: "Invalid employee data" });
      }

      console.log(`Starting bulk upload: Replacing entire database with ${employeeData.length} employees`);

      // Clear all existing employees
      await storage.clearAllEmployees();
      console.log("All existing employees cleared");

      // Validate and prepare new employee data
      const validatedEmployees = [];
      const errors = [];

      for (let i = 0; i < employeeData.length; i++) {
        try {
          const validatedData = insertEmployeeSchema.parse(employeeData[i]);
          validatedEmployees.push(validatedData);
        } catch (error) {
          errors.push({ 
            row: i + 1, 
            error: (error as Error).message,
            data: employeeData[i]
          });
        }
      }

      // Create all validated employees
      let createdEmployees: any[] = [];
      if (validatedEmployees.length > 0) {
        createdEmployees = await storage.bulkCreateEmployees(validatedEmployees);
      }

      console.log(`Bulk upload completed: ${createdEmployees.length} employees created, ${errors.length} errors`);

      // Create notification
      await storage.createNotification({
        type: "bulk_upload",
        title: "Base de Datos Reemplazada",
        message: `Se reemplazó completamente la base de datos con ${createdEmployees.length} empleados. ${errors.length} errores encontrados`,
        requestedBy: `${user.firstName} ${user.lastName}`,
        status: "processed",
        metadata: { 
          totalProcessed: employeeData.length,
          successful: createdEmployees.length,
          errors: errors.length,
          replaceMode: true
        }
      });

      res.json({ 
        results: createdEmployees.map(emp => ({ success: true, employee: emp })),
        errors,
        summary: {
          total: employeeData.length,
          successful: createdEmployees.length,
          failed: errors.length,
          replaceMode: true
        }
      });
    } catch (error) {
      console.error("Error processing bulk upload:", error);
      res.status(500).json({ message: "Failed to process bulk upload" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}