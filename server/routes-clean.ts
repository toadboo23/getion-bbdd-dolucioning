import type { Express } from "express";
import { createServer, type Server } from "http";
import { PostgresStorage } from "./storage-postgres.js";
import { setupAuth, isAuthenticated } from "./auth-local.js";
import { AuditService } from "./audit-service.js";

const storage = new PostgresStorage();

export async function registerRoutes(app: Express): Promise<Server> {
  console.log("🚀 Setting up routes...");

  // Setup authentication first
  await setupAuth(app);

  // Health check
  app.get("/api/health", (req, res) => {
    console.log("❤️ Health check");
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Create test employees (development only)
  app.post("/api/create-test-employees", isAuthenticated, async (req: any, res) => {
    console.log("🧪 Creating test employees");
    try {
      const user = req.user;
      if (!user || user.role !== 'super_admin') {
        return res.status(403).json({ message: "Only super admin can create test employees" });
      }

      // Create test employees
      const testEmployees = [
        {
          idGlovo: "TEST001",
          nombre: "Juan Pérez",
          telefono: "+34 666 777 888",
          emailGlovo: "juan@glovo.com",
          apellido: "Pérez",
          ciudad: "madrid"
        },
        {
          idGlovo: "TEST002", 
          nombre: "María García",
          telefono: "+34 666 777 889",
          emailGlovo: "maria@glovo.com",
          apellido: "García",
          ciudad: "barcelona"
        }
      ];

      const createdEmployees = [];
      for (const emp of testEmployees) {
        try {
          const created = await storage.createEmployee(emp);
          createdEmployees.push(created);
        } catch (error) {
          console.log(`Employee ${emp.idGlovo} already exists or error:`, error);
        }
      }

      console.log("✅ Test employees processed");
      res.json({ message: "Test employees created", employees: createdEmployees });
    } catch (error) {
      console.error("❌ Error creating test employees:", error);
      res.status(500).json({ message: "Failed to create test employees" });
    }
  });

  // Dashboard metrics (protected)
  app.get("/api/dashboard/metrics", isAuthenticated, async (req: any, res) => {
    console.log("📊 Dashboard metrics request");
    try {
      const user = req.user;
      const metrics = await storage.getDashboardMetrics();
      
      // Solo el super admin puede ver las notificaciones pendientes
      if (user?.role !== 'super_admin') {
        metrics.pendingActions = 0; // Ocultar notificaciones pendientes para otros roles
      }
      
      res.json(metrics);
    } catch (error) {
      console.error("❌ Error fetching dashboard metrics:", error);
      res.status(500).json({ message: "Failed to fetch dashboard metrics" });
    }
  });

  // Get unique cities for filters (protected)
  app.get("/api/cities", isAuthenticated, async (req, res) => {
    console.log("🏙️ Unique cities request");
    try {
      const cities = await storage.getUniqueCities();
      res.json(cities);
    } catch (error) {
      console.error("❌ Error fetching cities:", error);
      res.status(500).json({ message: "Failed to fetch cities" });
    }
  });

  // Get unique traffic managers for filters (protected)
  app.get("/api/traffic-managers", isAuthenticated, async (req, res) => {
    console.log("👔 Unique traffic managers request");
    try {
      const trafficManagers = await storage.getUniqueTrafficManagers();
      res.json(trafficManagers);
    } catch (error) {
      console.error("❌ Error fetching traffic managers:", error);
      res.status(500).json({ message: "Failed to fetch traffic managers" });
    }
  });

  // Employees list (protected)
  app.get("/api/employees", isAuthenticated, async (req, res) => {
    console.log("👥 Employees list request with filters:", req.query);
    try {
      const { city, status, search, trafficManager } = req.query;
      
      // Get all employees first
      let employees = await storage.getAllEmployees();
      
      // Apply search filter
      if (search && typeof search === 'string' && search.trim() !== '') {
        const searchTerm = search.toLowerCase().trim();
        employees = employees.filter(emp => 
          emp.nombre?.toLowerCase().includes(searchTerm) ||
          emp.apellido?.toLowerCase().includes(searchTerm) ||
          emp.email?.toLowerCase().includes(searchTerm) ||
          emp.emailGlovo?.toLowerCase().includes(searchTerm) ||
          emp.telefono?.toLowerCase().includes(searchTerm) ||
          emp.idGlovo?.toLowerCase().includes(searchTerm)
        );
      }
      
      // Apply city filter
      if (city && typeof city === 'string' && city.trim() !== '') {
        employees = employees.filter(emp => 
          emp.ciudad?.toLowerCase() === city.toLowerCase()
        );
      }
      
      // Apply status filter
      if (status && typeof status === 'string' && status.trim() !== '') {
        employees = employees.filter(emp => emp.status === status);
      }
      
      // Apply traffic manager filter
      if (trafficManager && typeof trafficManager === 'string' && trafficManager.trim() !== '') {
        employees = employees.filter(emp => 
          emp.jefeTrafico?.toLowerCase() === trafficManager.toLowerCase()
        );
      }
      
      console.log(`✅ Filtered employees: ${employees.length} results`);
      res.json(employees);
    } catch (error) {
      console.error("❌ Error fetching employees:", error);
      res.status(500).json({ message: "Failed to fetch employees" });
    }
  });

  // Individual employee (protected)
  app.get("/api/employees/:id", isAuthenticated, async (req, res) => {
    console.log("👤 Employee detail request for ID:", req.params.id);
    try {
      const id = req.params.id;
      const employee = await storage.getEmployee(id);
      
      if (!employee) {
        return res.status(404).json({ message: "Employee not found" });
      }
      
      res.json(employee);
    } catch (error) {
      console.error("❌ Error fetching employee:", error);
      res.status(500).json({ message: "Failed to fetch employee" });
    }
  });

  // Create new employee (protected)
  app.post("/api/employees", isAuthenticated, async (req: any, res) => {
    console.log("➕ Create employee request", req.body);
    console.log("🔍 Raw request body:", JSON.stringify(req.body, null, 2));
    
    try {
      // Check permissions
      const user = req.user;
      if (!user || !['super_admin', 'admin'].includes(user.role)) {
        console.log("❌ Permission denied for user:", user?.email, user?.role);
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      const employeeData = req.body;
      
      // Validate required fields
      if (!employeeData.idGlovo || !employeeData.nombre || !employeeData.telefono) {
        console.log("❌ Missing required fields:", {
          idGlovo: employeeData.idGlovo,
          nombre: employeeData.nombre,
          telefono: employeeData.telefono
        });
        return res.status(400).json({ 
          message: "Campos requeridos: ID Glovo, Nombre y Teléfono" 
        });
      }

      console.log("🔧 Processing employee data for creation...");
      
      // Create employee
      const employee = await storage.createEmployee(employeeData);
      console.log("✅ Employee created successfully:", employee.idGlovo);
      
      // Log audit trail
      await AuditService.logEmployeeCreation(user.email, user.role, employee, req);
      
      res.status(201).json(employee);
    } catch (error) {
      console.error("❌ Error creating employee:", error);
      console.error("❌ Error details:", error instanceof Error ? error.message : String(error));
      res.status(500).json({ message: "Failed to create employee" });
    }
  });

  // Bulk import employees (protected - super_admin only)
  app.post("/api/employees/bulk-import", isAuthenticated, async (req: any, res) => {
    console.log("📦 Bulk import employees request from user:", req.user?.email, req.user?.role);
    try {
      const user = req.user;
      if (!user || user.role !== 'super_admin') {
        console.log("❌ Permission denied for bulk import. User role:", user?.role);
        return res.status(403).json({ message: "Only super admin can import employees" });
      }

      const { employees } = req.body;
      
      if (!employees || !Array.isArray(employees) || employees.length === 0) {
        return res.status(400).json({ message: "Se requiere un array de empleados" });
      }

      console.log(`🔧 Processing ${employees.length} employees for bulk import...`);
      
      // Helper function to process strings
      const processString = (stringValue: any): string | undefined => {
        if (!stringValue || stringValue === "" || stringValue === "null" || stringValue === "undefined") {
          return undefined;
        }
        return String(stringValue).trim();
      };

      // Helper function to process numbers
      const processNumber = (numberValue: any): number | undefined => {
        if (!numberValue || numberValue === "" || numberValue === "null" || numberValue === "undefined") {
          return undefined;
        }
        
        const parsed = Number(numberValue);
        return !isNaN(parsed) ? parsed : undefined;
      };

      // Helper function to process dates
      const processDate = (dateValue: any): string | undefined => {
        if (!dateValue || dateValue === "" || dateValue === "null" || dateValue === "undefined") {
          return undefined;
        }
        
        try {
          // If it's already a valid date string, return it
          if (typeof dateValue === 'string') {
            const trimmed = dateValue.trim();
            if (trimmed === "") return undefined;
            
            // Try to parse the date
            const parsed = Date.parse(trimmed);
            if (!isNaN(parsed)) {
              return new Date(parsed).toISOString().split('T')[0]; // Return YYYY-MM-DD format
            }
            
            // Try manual parsing for different formats
            if (trimmed.match(/^\d{4}-\d{2}-\d{2}$/)) {
              return trimmed; // Already in YYYY-MM-DD format
            }
            
            if (trimmed.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
              // DD/MM/YYYY format
              const parts = trimmed.split('/');
              const date = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
              if (!isNaN(date.getTime())) {
                return date.toISOString().split('T')[0];
              }
            }
          }
          
          // If it's a number (Excel date serial)
          if (typeof dateValue === 'number') {
            // Excel dates are days since 1900-01-01 (with leap year bug)
            const excelEpoch = new Date(1900, 0, 1);
            const days = dateValue - 2; // Account for Excel's leap year bug
            const date = new Date(excelEpoch.getTime() + days * 24 * 60 * 60 * 1000);
            if (!isNaN(date.getTime())) {
              return date.toISOString().split('T')[0];
            }
          }
        } catch (error) {
          console.warn(`Error parsing date "${dateValue}":`, error);
        }
        
        return undefined;
      };

      // Helper function to process boolean
      const processBoolean = (boolValue: any): boolean => {
        if (typeof boolValue === 'boolean') return boolValue;
        if (typeof boolValue === 'string') {
          const lower = boolValue.toLowerCase();
          return lower === 'true' || lower === '1' || lower === 'yes' || lower === 'sí';
        }
        return false;
      };

      // Validate and process each employee
      const validEmployees = [];
      const errors = [];

      for (let i = 0; i < employees.length; i++) {
        const emp = employees[i];
        
        // Check required fields
        if (!emp.idGlovo || !emp.nombre || !emp.telefono) {
          errors.push(`Empleado ${i + 1}: Faltan campos requeridos (ID Glovo, Nombre, Teléfono)`);
          continue;
        }
        
        // Process all fields with proper type conversion
        const processedEmployee = {
          idGlovo: String(emp.idGlovo).trim(),
          nombre: String(emp.nombre).trim(),
          telefono: String(emp.telefono).trim(),
          emailGlovo: processString(emp.emailGlovo),
          turno: processString(emp.turno),
          apellido: processString(emp.apellido),
          email: processString(emp.email),
          horas: processNumber(emp.horas),
          complementaries: processString(emp.complementaries),
          ciudad: processString(emp.ciudad),
          cityCode: processString(emp.cityCode),
          dniNie: processString(emp.dniNie),
          iban: processString(emp.iban),
          direccion: processString(emp.direccion),
          vehiculo: processString(emp.vehiculo),
          naf: processString(emp.naf),
          fechaAltaSegSoc: processDate(emp.fechaAltaSegSoc),
          statusBaja: processString(emp.statusBaja),
          estadoSs: processString(emp.estadoSs),
          informadoHorario: processBoolean(emp.informadoHorario),
          cuentaDivilo: processString(emp.cuentaDivilo),
          proximaAsignacionSlots: processDate(emp.proximaAsignacionSlots),
          jefeTrafico: processString(emp.jefeTrafico),
          comentsJefeDeTrafico: processString(emp.comentsJefeDeTrafico),
          incidencias: processString(emp.incidencias),
          fechaIncidencia: processDate(emp.fechaIncidencia),
          faltasNoCheckInEnDias: processNumber(emp.faltasNoCheckInEnDias),
          cruce: processString(emp.cruce),
          status: emp.status || "active"
        } as any;

        console.log(`📝 Processed employee ${i + 1}:`, {
          idGlovo: processedEmployee.idGlovo,
          nombre: processedEmployee.nombre,
          fechas: {
            fechaAltaSegSoc: processedEmployee.fechaAltaSegSoc,
            proximaAsignacionSlots: processedEmployee.proximaAsignacionSlots,
            fechaIncidencia: processedEmployee.fechaIncidencia
          }
        });

        validEmployees.push(processedEmployee);
      }

      if (validEmployees.length === 0) {
        return res.status(400).json({ 
          message: "No hay empleados válidos para importar",
          errors 
        });
      }

      console.log(`✅ Ready to import ${validEmployees.length} valid employees`);

      // Clear existing employees and bulk create new ones
      await storage.clearAllEmployees();
      const createdEmployees = await storage.bulkCreateEmployees(validEmployees);
      
      console.log(`✅ Bulk import completed: ${createdEmployees.length} employees created`);
      
      // Log audit trail
      await AuditService.logBulkImport(user.email, user.role, createdEmployees.length, req);
      
      res.status(201).json({ 
        message: `${createdEmployees.length} empleados importados correctamente`,
        imported: createdEmployees.length,
        errors: errors.length > 0 ? errors : undefined
      });
    } catch (error) {
      console.error("❌ Error in bulk import:", error);
      console.error("❌ Full error details:", error instanceof Error ? error.stack : String(error));
      res.status(500).json({ message: "Failed to import employees", error: error instanceof Error ? error.message : String(error) });
    }
  });

  // Update employee (protected)
  app.put("/api/employees/:id", isAuthenticated, async (req: any, res) => {
    console.log("📝 Update employee request for ID:", req.params.id, req.body);
    try {
      // Check permissions
      const user = req.user;
      if (!user || !['super_admin', 'admin'].includes(user.role)) {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      const idGlovo = req.params.id;
      const employeeData = req.body;

      // Get old data for audit log
      const oldEmployee = await storage.getEmployee(idGlovo);
      
      // Update employee
      const employee = await storage.updateEmployee(idGlovo, employeeData);
      console.log("✅ Employee updated successfully:", idGlovo);
      
      // Log audit trail
      if (oldEmployee) {
        await AuditService.logEmployeeUpdate(user.email, user.role, idGlovo, oldEmployee, employee, req);
      }
      
      res.json(employee);
    } catch (error) {
      console.error("❌ Error updating employee:", error);
      res.status(500).json({ message: "Failed to update employee" });
    }
  });

  // Request company leave (protected)
  app.post("/api/employees/:id/company-leave", isAuthenticated, async (req: any, res) => {
    console.log("🏢 Company leave request for employee:", req.params.id, req.body);
    try {
      const user = req.user;
      if (!user || !['super_admin', 'admin'].includes(user.role)) {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      const employeeId = req.params.id;
      const { leaveType, leaveDate } = req.body;

      if (!leaveType || !leaveDate) {
        return res.status(400).json({ message: "Tipo de baja y fecha son requeridos" });
      }

      // Get employee to ensure it exists
      const employee = await storage.getEmployee(employeeId);
      if (!employee) {
        return res.status(404).json({ message: "Employee not found" });
      }

      // Update employee status to company_leave_pending
      await storage.updateEmployee(employeeId, { 
        status: "company_leave_pending"
      });
      
      // Create notification for super admin approval
      const notification = await storage.createNotification({
        type: "company_leave_request",
        title: `Solicitud de Baja Empresa - ${employee.nombre} ${employee.apellido || ""}`,
        message: `${user.firstName} ${user.lastName} solicita baja empresa para ${employee.nombre} ${employee.apellido || ""} (${employeeId}) por motivo: ${leaveType}. Fecha: ${leaveDate}`,
        requestedBy: user.email,
        status: "pending",
        metadata: {
          employeeId,
          leaveType,
          leaveDate,
          requestedByUserId: user.id,
          requestedByName: `${user.firstName} ${user.lastName}`,
          employeeName: `${employee.nombre} ${employee.apellido || ""}`,
        }
      });

      console.log("✅ Company leave notification created:", notification.id);
      
      // Log audit trail
      await AuditService.logCompanyLeaveRequest(user.email, user.role, employee, leaveType, leaveDate, req);
      
      res.status(201).json({ message: "Solicitud de baja empresa enviada para aprobación", notificationId: notification.id });
    } catch (error) {
      console.error("❌ Error creating company leave request:", error);
      res.status(500).json({ message: "Failed to create company leave request" });
    }
  });

  // Request IT leave (protected)
  app.post("/api/employees/:id/it-leave", isAuthenticated, async (req: any, res) => {
    console.log("🏥 [IT-LEAVE] Request for employee:", req.params.id, req.body);
    try {
      const user = req.user;
      if (!user || !['super_admin', 'admin'].includes(user.role)) {
        console.log("❌ [IT-LEAVE] Insufficient permissions for user:", user?.email, user?.role);
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      const employeeId = req.params.id;
      const { leaveType, leaveDate } = req.body;
      
      console.log("📋 [IT-LEAVE] Processing data:", { employeeId, leaveType, leaveDate });
      
      if (!leaveType || !leaveDate) {
        console.log("❌ [IT-LEAVE] Missing required fields:", { leaveType: !!leaveType, leaveDate: !!leaveDate });
        return res.status(400).json({ message: "Tipo de baja y fecha son requeridos" });
      }

      // Get employee to ensure it exists
      console.log("🔍 [IT-LEAVE] Getting employee:", employeeId);
      const employee = await storage.getEmployee(employeeId);
      if (!employee) {
        console.log("❌ [IT-LEAVE] Employee not found:", employeeId);
        return res.status(404).json({ message: "Employee not found" });
      }
      
      console.log("👤 [IT-LEAVE] Employee found:", { 
        id: employee.idGlovo, 
        name: `${employee.nombre} ${employee.apellido}`,
        currentStatus: employee.status 
      });

      // Update employee status to it_leave
      console.log("🔄 [IT-LEAVE] Updating employee status to 'it_leave'...");
      const updatedEmployee = await storage.updateEmployee(employeeId, { 
        status: "it_leave"
      });
      
      console.log("✅ [IT-LEAVE] Employee status updated:", {
        id: updatedEmployee.idGlovo,
        oldStatus: employee.status,
        newStatus: updatedEmployee.status
      });

      // Create IT leave record
      console.log("📝 [IT-LEAVE] Creating IT leave record...");
      const itLeaveData = {
        employeeId,
        leaveType,
        leaveDate: new Date(leaveDate),
        requestedAt: new Date(),
        requestedBy: user.email,
        approvedBy: user.email, // Auto-approved for IT leaves
        approvedAt: new Date(),
        status: "approved" as const
      };
      
      console.log("📊 [IT-LEAVE] IT leave data:", itLeaveData);
      const itLeave = await storage.createItLeave(itLeaveData);

      console.log("🎉 [IT-LEAVE] ✅ SUCCESS! IT leave processed completely:", {
        itLeaveId: itLeave.id,
        employeeId: updatedEmployee.idGlovo,
        employeeName: `${updatedEmployee.nombre} ${updatedEmployee.apellido}`,
        newStatus: updatedEmployee.status,
        leaveType: itLeave.leaveType,
        processedBy: user.email
      });
      
      // Log audit trail
      await AuditService.logItLeaveRequest(user.email, user.role, updatedEmployee, leaveType, leaveDate, req);
      
      res.status(201).json({ 
        message: "Baja IT procesada correctamente",
        success: true,
        data: {
          itLeaveId: itLeave.id,
          employeeId: updatedEmployee.idGlovo,
          newStatus: updatedEmployee.status,
          leaveType: itLeave.leaveType
        }
      });
    } catch (error) {
      console.error("💥 [IT-LEAVE] CRITICAL ERROR:", error);
      console.error("💥 [IT-LEAVE] Error details:", {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        employeeId: req.params.id,
        requestBody: req.body,
        user: req.user?.email
      });
      res.status(500).json({ 
        message: "Failed to create IT leave",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // ============================================
  // SYSTEM USERS MANAGEMENT (Super Admin Only)
  // ============================================

  // Get all system users (super_admin only)
  app.get("/api/system-users", isAuthenticated, async (req: any, res) => {
    console.log("👥 Get all system users request");
    try {
      const user = req.user;
      if (!user || user.role !== 'super_admin') {
        return res.status(403).json({ message: "Only super admin can manage system users" });
      }

      const users = await storage.getAllSystemUsers();
      res.json(users);
    } catch (error) {
      console.error("❌ Error fetching system users:", error);
      res.status(500).json({ message: "Failed to fetch system users" });
    }
  });

  // Create new system user (super_admin only)
  app.post("/api/system-users", isAuthenticated, async (req: any, res) => {
    console.log("➕ Create system user request");
    try {
      const user = req.user;
      if (!user || user.role !== 'super_admin') {
        return res.status(403).json({ message: "Only super admin can create system users" });
      }

      const { email, firstName, lastName, password, role } = req.body;

      // Validations
      if (!email || !firstName || !lastName || !password || !role) {
        return res.status(400).json({ message: "All fields are required" });
      }

      if (!['admin', 'normal'].includes(role)) {
        return res.status(400).json({ message: "Invalid role. Must be 'admin' or 'normal'" });
      }

      // Check if user already exists
      const existingUser = await storage.getSystemUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: "User with this email already exists" });
      }

      // Hash password (in a real app, use bcrypt)
      const hashedPassword = password; // Simplified for demo

      const newUser = await storage.createSystemUser({
        email,
        firstName,
        lastName,
        password: hashedPassword,
        role,
        isActive: true,
        createdBy: user.email
      });

      // Log audit trail
      await AuditService.logUserCreation(user.email, user.role, newUser, req);

      // Don't return password
      const { password: _, ...userResponse } = newUser;
      res.status(201).json(userResponse);
    } catch (error) {
      console.error("❌ Error creating system user:", error);
      res.status(500).json({ message: "Failed to create system user" });
    }
  });

  // Update system user (super_admin only)
  app.put("/api/system-users/:id", isAuthenticated, async (req: any, res) => {
    console.log("📝 Update system user request");
    try {
      const user = req.user;
      if (!user || user.role !== 'super_admin') {
        return res.status(403).json({ message: "Only super admin can update system users" });
      }

      const userId = parseInt(req.params.id);
      const { firstName, lastName, role, isActive } = req.body;

      // Validations
      if (!firstName || !lastName || !role || isActive === undefined) {
        return res.status(400).json({ message: "All fields are required" });
      }

      if (!['admin', 'normal'].includes(role)) {
        return res.status(400).json({ message: "Invalid role. Must be 'admin' or 'normal'" });
      }

      const existingUser = await storage.getSystemUser(userId);
      if (!existingUser) {
        return res.status(404).json({ message: "User not found" });
      }

      const updatedUser = await storage.updateSystemUser(userId, {
        firstName,
        lastName,
        role,
        isActive
      });

      // Log audit trail
      await AuditService.logUserUpdate(user.email, user.role, existingUser.email, existingUser, updatedUser, req);

      // Don't return password
      const { password: _, ...userResponse } = updatedUser;
      res.json(userResponse);
    } catch (error) {
      console.error("❌ Error updating system user:", error);
      res.status(500).json({ message: "Failed to update system user" });
    }
  });

  // Delete system user (super_admin only)
  app.delete("/api/system-users/:id", isAuthenticated, async (req: any, res) => {
    console.log("🗑️ Delete system user request");
    try {
      const user = req.user;
      if (!user || user.role !== 'super_admin') {
        return res.status(403).json({ message: "Only super admin can delete system users" });
      }

      const userId = parseInt(req.params.id);

      const existingUser = await storage.getSystemUser(userId);
      if (!existingUser) {
        return res.status(404).json({ message: "User not found" });
      }

      // Prevent deleting super admin
      if (existingUser.email === 'admin@dvv5.com') {
        return res.status(400).json({ message: "Cannot delete super admin user" });
      }

      await storage.deleteSystemUser(userId);

      // Log audit trail
      await AuditService.logUserDelete(user.email, user.role, existingUser, req);

      res.json({ message: "User deleted successfully" });
    } catch (error) {
      console.error("❌ Error deleting system user:", error);
      res.status(500).json({ message: "Failed to delete system user" });
    }
  });

  // Reactivate employee from IT leave (super admin only)
  app.post("/api/employees/:id/reactivate", isAuthenticated, async (req: any, res) => {
    console.log("🔄 [REACTIVATE] Reactivate employee request:", req.params.id);
    try {
      const user = req.user;
      if (!user || user.role !== 'super_admin') {
        console.log("❌ [REACTIVATE] Insufficient permissions for user:", user?.email, user?.role);
        return res.status(403).json({ message: "Only super admin can reactivate employees" });
      }

      const employeeId = req.params.id;
      
      // Get employee to ensure it exists and is in IT leave
      console.log("🔍 [REACTIVATE] Getting employee:", employeeId);
      const employee = await storage.getEmployee(employeeId);
      if (!employee) {
        console.log("❌ [REACTIVATE] Employee not found:", employeeId);
        return res.status(404).json({ message: "Employee not found" });
      }
      
      if (employee.status !== 'it_leave') {
        console.log("❌ [REACTIVATE] Employee is not in IT leave:", { 
          id: employee.idGlovo, 
          currentStatus: employee.status 
        });
        return res.status(400).json({ 
          message: `Employee is not in IT leave. Current status: ${employee.status}` 
        });
      }
      
      console.log("👤 [REACTIVATE] Employee in IT leave found:", { 
        id: employee.idGlovo, 
        name: `${employee.nombre} ${employee.apellido}`,
        currentStatus: employee.status 
      });

      // Update employee status to active
      console.log("🔄 [REACTIVATE] Updating employee status to 'active'...");
      const updatedEmployee = await storage.updateEmployee(employeeId, { 
        status: "active"
      });
      
      console.log("✅ [REACTIVATE] Employee status updated:", {
        id: updatedEmployee.idGlovo,
        oldStatus: employee.status,
        newStatus: updatedEmployee.status
      });

      // Log audit trail for reactivation
      await AuditService.logEmployeeReactivation(
        user.email, 
        user.role, 
        updatedEmployee, 
        req
      );

      console.log("🎉 [REACTIVATE] ✅ SUCCESS! Employee reactivated:", {
        employeeId: updatedEmployee.idGlovo,
        employeeName: `${updatedEmployee.nombre} ${updatedEmployee.apellido}`,
        oldStatus: employee.status,
        newStatus: updatedEmployee.status,
        reactivatedBy: user.email
      });
      
      res.status(200).json({ 
        message: "Empleado reactivado exitosamente",
        success: true,
        data: {
          employeeId: updatedEmployee.idGlovo,
          employeeName: `${updatedEmployee.nombre} ${updatedEmployee.apellido}`,
          oldStatus: employee.status,
          newStatus: updatedEmployee.status,
          reactivatedBy: user.email,
          reactivatedAt: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error("💥 [REACTIVATE] CRITICAL ERROR:", error);
      console.error("💥 [REACTIVATE] Error details:", {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        employeeId: req.params.id,
        user: req.user?.email
      });
      res.status(500).json({ 
        message: "Failed to reactivate employee",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Approve/reject company leave notification (super admin only)
  app.post("/api/notifications/:id/process", isAuthenticated, async (req: any, res) => {
    console.log("📋 Process notification:", req.params.id, req.body);
    try {
      const user = req.user;
      if (!user || user.role !== 'super_admin') {
        return res.status(403).json({ message: "Only super admin can process notifications" });
      }

      const notificationId = parseInt(req.params.id);
      const { action, processingDate } = req.body; // "approve" or "reject" + processingDate

      if (!action || !["approve", "reject"].includes(action)) {
        return res.status(400).json({ message: "Action must be 'approve' or 'reject'" });
      }

      // Validar fecha de procesamiento
      const processDate = processingDate ? new Date(processingDate) : new Date();
      if (isNaN(processDate.getTime())) {
        return res.status(400).json({ message: "Invalid processing date" });
      }

      console.log(`📋 Processing notification ${notificationId} with action "${action}" and date "${processDate.toISOString()}"`);

      // Get all notifications and find the one we need
      const allNotifications = await storage.getAllNotifications();
      const notification = allNotifications.find(n => n.id === notificationId);
      
      if (!notification) {
        return res.status(404).json({ message: "Notification not found" });
      }

      if (notification.status !== "pending") {
        return res.status(400).json({ message: "Notification already processed" });
      }

      if (action === "approve" && notification.type === "company_leave_request") {
        const metadata = notification.metadata as any;
        
        // Get complete employee data before creating the leave record
        const employee = await storage.getEmployee(metadata.employeeId);
        if (!employee) {
          return res.status(404).json({ message: "Employee not found" });
        }
        
        // Create company leave record with complete employee data
          const companyLeave = await storage.createCompanyLeave({
          employeeId: metadata.employeeId,
          employeeData: employee, // Store complete employee data as JSON
          leaveType: metadata.leaveType,
          leaveDate: metadata.leaveDate, // Already a string date from metadata
          leaveRequestedAt: notification.createdAt || new Date(),
          leaveRequestedBy: notification.requestedBy,
          approvedBy: user.email,
          approvedAt: processDate, // Usar fecha personalizada
          status: "approved",
        });

        // Remove employee from active employees table
        await storage.deleteEmployee(metadata.employeeId);

        console.log(`✅ Company leave approved with date ${processDate.toISOString()}, employee moved to company_leaves table`);
      } else if (action === "reject" && notification.type === "company_leave_request") {
        const metadata = notification.metadata as any;
        
        // Get complete employee data before creating the leave record
        const employee = await storage.getEmployee(metadata.employeeId);
        if (!employee) {
          return res.status(404).json({ message: "Employee not found" });
        }
        
        // Create company leave record with complete employee data (but as rejected)
        const companyLeave = await storage.createCompanyLeave({
          employeeId: metadata.employeeId,
          employeeData: employee, // Store complete employee data as JSON
          leaveType: metadata.leaveType,
          leaveDate: metadata.leaveDate,
          leaveRequestedAt: notification.createdAt || new Date(),
          leaveRequestedBy: notification.requestedBy,
          approvedBy: user.email,
          approvedAt: processDate, // Usar fecha personalizada
          status: "rejected",
        });

        // Remove employee from active employees table
        await storage.deleteEmployee(metadata.employeeId);

        console.log(`✅ Company leave rejected with date ${processDate.toISOString()}, employee moved to company_leaves table`);
      }

      // Update notification status
      await storage.updateNotificationStatus(notificationId, action === "approve" ? "approved" : "rejected");

      // Log audit trail
      if (notification.type === "company_leave_request") {
        const metadata = notification.metadata as any;
        const employee = await storage.getEmployee(metadata.employeeId);
        if (employee) {
          await AuditService.logCompanyLeaveApproval(user.email, user.role, employee, metadata.leaveType, action, processDate.toISOString(), req);
        }
      }

      console.log(`✅ Notification ${action}d:`, notificationId);
      res.json({ message: `Notification ${action}d successfully` });
    } catch (error) {
      console.error("❌ Error processing notification:", error);
      res.status(500).json({ message: "Failed to process notification" });
    }
  });

  // Company leaves (protected)
  app.get("/api/company-leaves", isAuthenticated, async (req, res) => {
    console.log("🏢 Company leaves request");
    try {
      const leaves = await storage.getAllCompanyLeaves();
      res.json(leaves);
    } catch (error) {
      console.error("❌ Error fetching company leaves:", error);
      res.status(500).json({ message: "Failed to fetch company leaves" });
    }
  });



  // Notifications (protected - admin and super_admin can view)
  app.get("/api/notifications", isAuthenticated, async (req: any, res) => {
    console.log("🔔 Notifications request from user:", req.user?.email, req.user?.role);
    try {
      const user = req.user;
      if (!user || !['admin', 'super_admin'].includes(user.role)) {
        console.log("❌ Permission denied for notifications view. User role:", user?.role);
        return res.status(403).json({ message: "Insufficient permissions to view notifications" });
      }

      const notifications = await storage.getAllNotifications();
      console.log(`✅ Returning ${notifications.length} notifications to ${user.role} user: ${user.email}`);
      res.json(notifications);
    } catch (error) {
      console.error("❌ Error fetching notifications:", error);
      res.status(500).json({ message: "Failed to fetch notifications" });
    }
  });

  // ============================================
  // SYSTEM USERS MANAGEMENT (Super Admin Only)
  // ============================================

  // Get all system users
  app.get("/api/system-users", isAuthenticated, async (req: any, res) => {
    console.log("👥 System users request from:", req.user?.email, req.user?.role);
    try {
      const user = req.user;
      if (!user || user.role !== 'super_admin') {
        console.log("❌ Permission denied for system users. User role:", user?.role);
        return res.status(403).json({ message: "Only super admin can manage system users" });
      }

      const users = await storage.getAllSystemUsers();
      // Remove password from response
      const safeUsers = users.map(u => ({ ...u, password: undefined }));
      console.log(`✅ Returning ${users.length} system users`);
      res.json(safeUsers);
    } catch (error) {
      console.error("❌ Error fetching system users:", error);
      res.status(500).json({ message: "Failed to fetch system users" });
    }
  });

  // Create new system user
  app.post("/api/system-users", isAuthenticated, async (req: any, res) => {
    console.log("➕ Create system user request:", req.body.email, req.body.role);
    try {
      const user = req.user;
      if (!user || user.role !== 'super_admin') {
        return res.status(403).json({ message: "Only super admin can create system users" });
      }

      const { email, firstName, lastName, password, role } = req.body;

      if (!email || !firstName || !lastName || !password || !role) {
        return res.status(400).json({ message: "All fields are required" });
      }

      if (!['super_admin', 'admin', 'normal'].includes(role)) {
        return res.status(400).json({ message: "Invalid role" });
      }

      // Check if user already exists
      const existingUser = await storage.getSystemUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: "User already exists" });
      }

      // Hash password (in production, use bcrypt or similar)
      const hashedPassword = password; // TODO: Implement proper password hashing

      const newUser = await storage.createSystemUser({
        email,
        firstName,
        lastName,
        password: hashedPassword,
        role,
        createdBy: user.email
      });

      // Log audit trail
      await AuditService.logUserCreation(user.email, user.role, newUser, req);

      // Remove password from response
      const safeUser = { ...newUser, password: undefined };
      res.status(201).json(safeUser);
    } catch (error) {
      console.error("❌ Error creating system user:", error);
      res.status(500).json({ message: "Failed to create system user" });
    }
  });

  // Update system user
  app.put("/api/system-users/:id", isAuthenticated, async (req: any, res) => {
    console.log("📝 Update system user request:", req.params.id);
    try {
      const user = req.user;
      if (!user || user.role !== 'super_admin') {
        return res.status(403).json({ message: "Only super admin can update system users" });
      }

      const userId = parseInt(req.params.id);
      const updateData = req.body;

      // Get old data for audit log
      const oldUser = await storage.getSystemUser(userId);
      if (!oldUser) {
        return res.status(404).json({ message: "User not found" });
      }

      // Hash password if provided
      if (updateData.password) {
        updateData.password = updateData.password; // TODO: Implement proper password hashing
      }

      const updatedUser = await storage.updateSystemUser(userId, updateData);

      // Log audit trail
      await AuditService.logUserUpdate(user.email, user.role, oldUser.email, oldUser, updatedUser, req);

      // Remove password from response
      const safeUser = { ...updatedUser, password: undefined };
      res.json(safeUser);
    } catch (error) {
      console.error("❌ Error updating system user:", error);
      res.status(500).json({ message: "Failed to update system user" });
    }
  });

  // Delete system user
  app.delete("/api/system-users/:id", isAuthenticated, async (req: any, res) => {
    console.log("🗑️ Delete system user request:", req.params.id);
    try {
      const user = req.user;
      if (!user || user.role !== 'super_admin') {
        return res.status(403).json({ message: "Only super admin can delete system users" });
      }

      const userId = parseInt(req.params.id);

      // Get user data for audit log
      const userToDelete = await storage.getSystemUser(userId);
      if (!userToDelete) {
        return res.status(404).json({ message: "User not found" });
      }

      // Prevent deleting yourself
      if (userToDelete.email === user.email) {
        return res.status(400).json({ message: "Cannot delete your own account" });
      }

      await storage.deleteSystemUser(userId);

      // Log audit trail
      await AuditService.logUserDelete(user.email, user.role, userToDelete, req);

      res.json({ message: "User deleted successfully" });
    } catch (error) {
      console.error("❌ Error deleting system user:", error);
      res.status(500).json({ message: "Failed to delete system user" });
    }
  });

  // ============================================
  // AUDIT LOGS (Super Admin Only)
  // ============================================

  // Get audit logs
  app.get("/api/audit-logs", isAuthenticated, async (req: any, res) => {
    console.log("📋 Audit logs request from:", req.user?.email, req.user?.role);
    try {
      const user = req.user;
      if (!user || user.role !== 'super_admin') {
        console.log("❌ Permission denied for audit logs. User role:", user?.role);
        return res.status(403).json({ message: "Only super admin can view audit logs" });
      }

      const { limit = 100, userId, action, entityType } = req.query;

      let logs;
      if (userId) {
        logs = await storage.getAuditLogsByUser(userId as string, parseInt(limit as string));
      } else if (action) {
        logs = await storage.getAuditLogsByAction(action as string, parseInt(limit as string));
      } else if (entityType) {
        logs = await storage.getAuditLogsByEntity(entityType as string, undefined, parseInt(limit as string));
      } else {
        logs = await storage.getAllAuditLogs(parseInt(limit as string));
      }

      console.log(`✅ Returning ${logs.length} audit logs`);
      res.json(logs);
    } catch (error) {
      console.error("❌ Error fetching audit logs:", error);
      res.status(500).json({ message: "Failed to fetch audit logs" });
    }
  });

  // Get audit logs statistics
  app.get("/api/audit-logs/stats", isAuthenticated, async (req: any, res) => {
    console.log("📊 Audit logs stats request from:", req.user?.email, req.user?.role);
    try {
      const user = req.user;
      if (!user || user.role !== 'super_admin') {
        return res.status(403).json({ message: "Only super admin can view audit stats" });
      }

      const stats = await storage.getAuditLogsStats();
      console.log("✅ Returning audit logs statistics");
      res.json(stats);
    } catch (error) {
      console.error("❌ Error fetching audit logs stats:", error);
      res.status(500).json({ message: "Failed to fetch audit logs stats" });
    }
  });

  // Catch-all for undefined API routes
  app.all('/api/*', (req, res) => {
    console.log("❓ Unknown API route:", req.method, req.path);
    res.status(404).json({ 
      error: `Route ${req.method} ${req.path} not found`,
      availableRoutes: [
        'GET /api/health',
        'POST /api/auth/login', 
        'GET /api/auth/user',
        'POST /api/auth/logout',
        'GET /api/dashboard/metrics',
        'GET /api/employees',
        'GET /api/employees/:id',
        'POST /api/employees',
        'PUT /api/employees/:id',
        'POST /api/employees/:id/company-leave',
        'POST /api/employees/:id/it-leave',
        'GET /api/company-leaves',
        'GET /api/notifications',
        'POST /api/notifications/:id/process',
        'GET /api/system-users',
        'POST /api/system-users',
        'PUT /api/system-users/:id',
        'DELETE /api/system-users/:id',
        'GET /api/audit-logs',
        'GET /api/audit-logs/stats'
      ]
    });
  });

  const httpServer = createServer(app);
  
  console.log("✅ All routes registered successfully");
  return httpServer;
}