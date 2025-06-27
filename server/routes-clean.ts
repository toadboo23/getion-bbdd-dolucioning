import type { Express } from "express";
import { createServer, type Server } from "http";
import { PostgresStorage } from "./storage-postgres.js";
import { setupAuth, isAuthenticated } from "./auth-local.js";
import { AuditService } from "./audit-service.js";
import * as XLSX from 'xlsx';

const storage = new PostgresStorage();

export async function registerRoutes(app: Express): Promise<Server> {
  if (process.env.NODE_ENV !== 'production') console.log("🚀 Setting up routes...");

  // Setup authentication first
  await setupAuth(app);

  // Health check
  app.get("/api/health", (req, res) => {
    if (process.env.NODE_ENV !== 'production') console.log("❤️ Health check");
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Dashboard metrics (protected)
  app.get("/api/dashboard/metrics", isAuthenticated, async (req: any, res) => {
    if (process.env.NODE_ENV !== 'production') console.log("📊 Dashboard metrics request");
    try {
      const user = req.user;
      if (user?.role === 'normal') {
        return res.status(403).json({ message: "No tienes permisos para ver el dashboard" });
      }
      const metrics = await storage.getDashboardMetrics();
      
      // Solo el super admin puede ver las notificaciones pendientes
      if (user?.role !== 'super_admin') {
        metrics.pendingActions = 0; // Ocultar notificaciones pendientes para otros roles
      }
      
      res.json(metrics);
    } catch (error) {
      if (process.env.NODE_ENV !== 'production') console.error("❌ Error fetching dashboard metrics:", error);
      res.status(500).json({ message: "Failed to fetch dashboard metrics" });
    }
  });

  // Get unique cities for filters (protected)
  app.get("/api/cities", isAuthenticated, async (req, res) => {
    if (process.env.NODE_ENV !== 'production') console.log("🏙️ Unique cities request");
    try {
      const cities = await storage.getUniqueCities();
      res.json(cities);
    } catch (error) {
      if (process.env.NODE_ENV !== 'production') console.error("❌ Error fetching cities:", error);
      res.status(500).json({ message: "Failed to fetch cities" });
    }
  });

  // Get unique fleets for filters (protected)
  app.get("/api/fleets", isAuthenticated, async (req, res) => {
    if (process.env.NODE_ENV !== 'production') console.log("🛳️ Unique fleets request");
    try {
      const fleets = await storage.getUniqueFleets();
      res.json(fleets);
    } catch (error) {
      if (process.env.NODE_ENV !== 'production') console.error("❌ Error fetching fleets:", error);
      res.status(500).json({ message: "Failed to fetch fleets" });
    }
  });

  // Employees list (protected)
  app.get("/api/employees", isAuthenticated, async (req, res) => {
    if (process.env.NODE_ENV !== 'production') console.log("👥 Employees list request with filters:", req.query);
    try {
      const { city, status, search, fleet } = req.query;
      
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
      
      // Apply fleet filter
      if (fleet && typeof fleet === 'string' && fleet.trim() !== '') {
        employees = employees.filter(emp => 
          emp.flota?.toLowerCase() === fleet.toLowerCase()
        );
      }
      
      if (process.env.NODE_ENV !== 'production') console.log(`✅ Filtered employees: ${employees.length} results`);
      res.json(employees);
    } catch (error) {
      if (process.env.NODE_ENV !== 'production') console.error("❌ Error fetching employees:", error);
      res.status(500).json({ message: "Failed to fetch employees" });
    }
  });

  // Individual employee (protected)
  app.get("/api/employees/:id", isAuthenticated, async (req, res) => {
    if (process.env.NODE_ENV !== 'production') console.log("👤 Employee detail request for ID:", req.params.id);
    try {
      const id = req.params.id;
      const employee = await storage.getEmployee(id);
      
      if (!employee) {
        return res.status(404).json({ message: "Employee not found" });
      }
      
      res.json(employee);
    } catch (error) {
      if (process.env.NODE_ENV !== 'production') console.error("❌ Error fetching employee:", error);
      res.status(500).json({ message: "Failed to fetch employee" });
    }
  });

  // Create new employee (protected)
  app.post("/api/employees", isAuthenticated, async (req: any, res) => {
    if (process.env.NODE_ENV !== 'production') console.log("➕ Create employee request", req.body);
    if (process.env.NODE_ENV !== 'production') console.log("🔍 Raw request body:", JSON.stringify(req.body, null, 2));
    
    try {
      // Check permissions
      const user = req.user;
      if (!user || !['super_admin', 'admin'].includes(user.role)) {
        if (process.env.NODE_ENV !== 'production') console.log("❌ Permission denied for user:", user?.email, user?.role);
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      const employeeData = req.body;
      
      // Validate required fields
      if (!employeeData.idGlovo || !employeeData.nombre || !employeeData.telefono) {
        if (process.env.NODE_ENV !== 'production') console.log("❌ Missing required fields:", {
          idGlovo: employeeData.idGlovo,
          nombre: employeeData.nombre,
          telefono: employeeData.telefono
        });
        return res.status(400).json({ 
          message: "Campos requeridos: ID Glovo, Nombre y Teléfono" 
        });
      }

      if (process.env.NODE_ENV !== 'production') console.log("🔧 Processing employee data for creation...");
      
      // Create employee
      const employee = await storage.createEmployee(employeeData);
      if (process.env.NODE_ENV !== 'production') console.log("✅ Employee created successfully:", employee.idGlovo);
      
      // Log audit trail
      await AuditService.logEmployeeCreation(user.email, user.role, employee, req);
      
      res.status(201).json(employee);
    } catch (error) {
      if (process.env.NODE_ENV !== 'production') console.error("❌ Error creating employee:", error);
      if (process.env.NODE_ENV !== 'production') console.error("❌ Error details:", error instanceof Error ? error.message : String(error));
      res.status(500).json({ message: "Failed to create employee" });
    }
  });

  // Bulk import employees (protected - super_admin only)
  app.post("/api/employees/bulk-import", isAuthenticated, async (req: any, res) => {
    if (process.env.NODE_ENV !== 'production') console.log("📦 Bulk import employees request from user:", req.user?.email, req.user?.role);
    try {
      const user = req.user;
      if (!user || user.role !== 'super_admin') {
        if (process.env.NODE_ENV !== 'production') console.log("❌ Permission denied for bulk import. User role:", user?.role);
        return res.status(403).json({ message: "Only super admin can import employees" });
      }

      const { employees } = req.body;
      
      if (!employees || !Array.isArray(employees) || employees.length === 0) {
        return res.status(400).json({ message: "Se requiere un array de empleados" });
      }

      if (process.env.NODE_ENV !== 'production') console.log(`🔧 Processing ${employees.length} employees for bulk import...`);
      
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
          if (process.env.NODE_ENV !== 'production') console.warn(`Error parsing date "${dateValue}":`, error);
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
      const dniNieSet = new Set<string>(); // Para trackear DNI/NIE duplicados
      const idGlovoSet = new Set<string>(); // Para trackear ID Glovo duplicados

      for (let i = 0; i < employees.length; i++) {
        const emp = employees[i];
        
        // Check required fields
        if (!emp.idGlovo || !emp.nombre || !emp.telefono) {
          errors.push({
            type: 'validation',
            message: `Faltan campos requeridos`,
            row: i + 2,
            employee: emp.nombre || 'Sin nombre',
            details: {
              idGlovo: emp.idGlovo || 'VACÍO',
              nombre: emp.nombre || 'VACÍO',
              telefono: emp.telefono || 'VACÍO'
            }
          });
          continue;
        }
        
        // Validar ID Glovo duplicados en el archivo
        const idGlovo = String(emp.idGlovo).trim();
        if (idGlovoSet.has(idGlovo)) {
          errors.push({
            type: 'duplicate',
            message: `ID Glovo duplicado en el archivo`,
            row: i + 2,
            employee: emp.nombre || 'Sin nombre',
            field: 'idGlovo',
            value: idGlovo
          });
          continue;
        }
        idGlovoSet.add(idGlovo);
        
        // Process all fields with proper type conversion
        const processedEmployee = {
          idGlovo: idGlovo,
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

        // Validar DNI/NIE duplicados en el archivo
        if (processedEmployee.dniNie) {
          if (dniNieSet.has(processedEmployee.dniNie)) {
            errors.push({
              type: 'duplicate',
              message: `DNI/NIE duplicado en el archivo`,
              row: i + 2,
              employee: processedEmployee.nombre,
              field: 'dniNie',
              value: processedEmployee.dniNie
            });
            continue;
          }
          dniNieSet.add(processedEmployee.dniNie);
        }

        if (process.env.NODE_ENV !== 'production') console.log(`📝 Processed employee ${i + 1}:`, {
          idGlovo: processedEmployee.idGlovo,
          nombre: processedEmployee.nombre,
          dniNie: processedEmployee.dniNie,
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
          errors: errors.map(err => `${err.message} - Fila ${err.row}: ${err.employee}`),
          errorType: "validation_error",
          errorDetails: errors
        });
      }

      if (process.env.NODE_ENV !== 'production') console.log(`✅ Ready to import ${validEmployees.length} valid employees`);

      // Verificar duplicados de DNI/NIE en la base de datos existente
      const existingEmployees = await storage.getAllEmployees();
      const existingDniNieSet = new Set(
        existingEmployees
          .map(emp => emp.dniNie)
          .filter(dniNie => dniNie && dniNie.trim() !== '')
      );

      const duplicateDniNieErrors = [];
      for (const employee of validEmployees) {
        if (employee.dniNie && existingDniNieSet.has(employee.dniNie)) {
          duplicateDniNieErrors.push({
            type: 'duplicate',
            message: `DNI/NIE ya existe en la base de datos`,
            employee: employee.nombre,
            field: 'dniNie',
            value: employee.dniNie,
            idGlovo: employee.idGlovo
          });
        }
      }

      if (duplicateDniNieErrors.length > 0) {
        return res.status(400).json({
          message: "No se pueden importar empleados con DNI/NIE duplicados",
          errors: [...errors.map(err => `${err.message} - Fila ${err.row}: ${err.employee}`), 
                   ...duplicateDniNieErrors.map(err => `${err.message} - ${err.employee} (${err.idGlovo}): ${err.value}`)],
          errorType: "duplicate_dni_nie",
          errorDetails: [...errors, ...duplicateDniNieErrors],
          duplicateDniNieCount: duplicateDniNieErrors.length
        });
      }

      // Clear existing employees and bulk create new ones
      await storage.clearAllEmployees();
      const createdEmployees = await storage.bulkCreateEmployees(validEmployees);
      
      if (process.env.NODE_ENV !== 'production') console.log(`✅ Bulk import completed: ${createdEmployees.length} employees created`);
      
      // Log audit trail
      await AuditService.logBulkImport(user.email, user.role, createdEmployees.length, req);
      
      res.status(201).json({ 
        message: `${createdEmployees.length} empleados importados correctamente`,
        imported: createdEmployees.length,
        errors: errors.length > 0 ? errors.map(err => `${err.message} - Fila ${err.row}: ${err.employee}`) : undefined,
        errorDetails: errors.length > 0 ? errors : undefined
      });
    } catch (error) {
      if (process.env.NODE_ENV !== 'production') console.error("❌ Error in bulk import:", error);
      if (process.env.NODE_ENV !== 'production') console.error("❌ Full error details:", error instanceof Error ? error.stack : String(error));
      res.status(500).json({ 
        message: "Failed to import employees", 
        error: error instanceof Error ? error.message : String(error),
        errorType: "server_error"
      });
    }
  });

  // Update employee (protected)
  app.put("/api/employees/:id", isAuthenticated, async (req: any, res) => {
    if (process.env.NODE_ENV !== 'production') console.log("📝 Update employee request for ID:", req.params.id, req.body);
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
      if (process.env.NODE_ENV !== 'production') console.log("✅ Employee updated successfully:", idGlovo);
      
      // Log audit trail
      if (oldEmployee) {
        await AuditService.logEmployeeUpdate(user.email, user.role, idGlovo, oldEmployee, employee, req);
      }
      
      res.json(employee);
    } catch (error) {
      if (process.env.NODE_ENV !== 'production') console.error("❌ Error updating employee:", error);
      res.status(500).json({ message: "Failed to update employee" });
    }
  });

  // Request company leave (protected)
  app.post("/api/employees/:id/company-leave", isAuthenticated, async (req: any, res) => {
    if (process.env.NODE_ENV !== 'production') console.log("🏢 Company leave request for employee:", req.params.id, req.body);
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

      if (process.env.NODE_ENV !== 'production') console.log("✅ Company leave notification created:", notification.id);
      
      // Log audit trail
      await AuditService.logCompanyLeaveRequest(user.email, user.role, employee, leaveType, leaveDate, req);
      
      res.status(201).json({ message: "Solicitud de baja empresa enviada para aprobación", notificationId: notification.id });
    } catch (error) {
      if (process.env.NODE_ENV !== 'production') console.error("❌ Error creating company leave request:", error);
      res.status(500).json({ message: "Failed to create company leave request" });
    }
  });

  // Request IT leave (protected)
  app.post("/api/employees/:id/it-leave", isAuthenticated, async (req: any, res) => {
    if (process.env.NODE_ENV !== 'production') console.log("🏥 [IT-LEAVE] Request for employee:", req.params.id, req.body);
    try {
      const user = req.user;
      if (!user || !['super_admin', 'admin'].includes(user.role)) {
        if (process.env.NODE_ENV !== 'production') console.log("❌ [IT-LEAVE] Insufficient permissions for user:", user?.email, user?.role);
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      const employeeId = req.params.id;
      const { leaveType, leaveDate } = req.body;
      
      if (process.env.NODE_ENV !== 'production') console.log("📋 [IT-LEAVE] Processing data:", { employeeId, leaveType, leaveDate });
      
      if (!leaveType || !leaveDate) {
        if (process.env.NODE_ENV !== 'production') console.log("❌ [IT-LEAVE] Missing required fields:", { leaveType: !!leaveType, leaveDate: !!leaveDate });
        return res.status(400).json({ message: "Tipo de baja y fecha son requeridos" });
      }

      // Get employee to ensure it exists
      if (process.env.NODE_ENV !== 'production') console.log("🔍 [IT-LEAVE] Getting employee:", employeeId);
      const employee = await storage.getEmployee(employeeId);
      if (!employee) {
        if (process.env.NODE_ENV !== 'production') console.log("❌ [IT-LEAVE] Employee not found:", employeeId);
        return res.status(404).json({ message: "Employee not found" });
      }
      
      if (process.env.NODE_ENV !== 'production') console.log("👤 [IT-LEAVE] Employee found:", { 
        id: employee.idGlovo, 
        name: `${employee.nombre} ${employee.apellido}`,
        currentStatus: employee.status 
      });

      // Update employee status to it_leave
      if (process.env.NODE_ENV !== 'production') console.log("🔄 [IT-LEAVE] Updating employee status to 'it_leave'...");
      const updatedEmployee = await storage.updateEmployee(employeeId, { 
        status: "it_leave"
      });
      
      if (process.env.NODE_ENV !== 'production') console.log("✅ [IT-LEAVE] Employee status updated:", {
        id: updatedEmployee.idGlovo,
        oldStatus: employee.status,
        newStatus: updatedEmployee.status
      });

      // Create IT leave record
      if (process.env.NODE_ENV !== 'production') console.log("📝 [IT-LEAVE] Creating IT leave record...");
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
      
      if (process.env.NODE_ENV !== 'production') console.log("📊 [IT-LEAVE] IT leave data:", itLeaveData);
      const itLeave = await storage.createItLeave(itLeaveData);

      if (process.env.NODE_ENV !== 'production') console.log("🎉 [IT-LEAVE] ✅ SUCCESS! IT leave processed completely:", {
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
      if (process.env.NODE_ENV !== 'production') console.error("💥 [IT-LEAVE] CRITICAL ERROR:", error);
      if (process.env.NODE_ENV !== 'production') console.error("💥 [IT-LEAVE] Error details:", {
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
    if (process.env.NODE_ENV !== 'production') console.log("👥 Get all system users request");
    try {
      const user = req.user;
      if (!user || user.role !== 'super_admin') {
        return res.status(403).json({ message: "Only super admin can manage system users" });
      }

      const users = await storage.getAllSystemUsers();
      res.json(users);
    } catch (error) {
      if (process.env.NODE_ENV !== 'production') console.error("❌ Error fetching system users:", error);
      res.status(500).json({ message: "Failed to fetch system users" });
    }
  });

  // Create new system user (super_admin only)
  app.post("/api/system-users", isAuthenticated, async (req: any, res) => {
    if (process.env.NODE_ENV !== 'production') console.log("➕ Create system user request");
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
      if (process.env.NODE_ENV !== 'production') console.error("❌ Error creating system user:", error);
      res.status(500).json({ message: "Failed to create system user" });
    }
  });

  // Update system user (super_admin only)
  app.put("/api/system-users/:id", isAuthenticated, async (req: any, res) => {
    if (process.env.NODE_ENV !== 'production') console.log("📝 Update system user request");
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
      if (process.env.NODE_ENV !== 'production') console.error("❌ Error updating system user:", error);
      res.status(500).json({ message: "Failed to update system user" });
    }
  });

  // Delete system user (super_admin only) - DISABLED: No one can delete users
  /*
  app.delete("/api/system-users/:id", isAuthenticated, async (req: any, res) => {
    if (process.env.NODE_ENV !== 'production') console.log("🗑️ Delete system user request");
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
      if (process.env.NODE_ENV !== 'production') console.error("❌ Error deleting system user:", error);
      res.status(500).json({ message: "Failed to delete system user" });
    }
  });
  */

  // Reactivate employee from IT leave (super admin only)
  app.post("/api/employees/:id/reactivate", isAuthenticated, async (req: any, res) => {
    if (process.env.NODE_ENV !== 'production') console.log("🔄 [REACTIVATE] Reactivate employee request:", req.params.id);
    try {
      const user = req.user;
      if (!user || user.role !== 'super_admin') {
        if (process.env.NODE_ENV !== 'production') console.log("❌ [REACTIVATE] Insufficient permissions for user:", user?.email, user?.role);
        return res.status(403).json({ message: "Only super admin can reactivate employees" });
      }

      const employeeId = req.params.id;
      
      // Get employee to ensure it exists and is in IT leave
      if (process.env.NODE_ENV !== 'production') console.log("🔍 [REACTIVATE] Getting employee:", employeeId);
      const employee = await storage.getEmployee(employeeId);
      if (!employee) {
        if (process.env.NODE_ENV !== 'production') console.log("❌ [REACTIVATE] Employee not found:", employeeId);
        return res.status(404).json({ message: "Employee not found" });
      }
      
      if (employee.status !== 'it_leave') {
        if (process.env.NODE_ENV !== 'production') console.log("❌ [REACTIVATE] Employee is not in IT leave:", { 
          id: employee.idGlovo, 
          currentStatus: employee.status 
        });
        return res.status(400).json({ 
          message: `Employee is not in IT leave. Current status: ${employee.status}` 
        });
      }
      
      if (process.env.NODE_ENV !== 'production') console.log("👤 [REACTIVATE] Employee in IT leave found:", { 
        id: employee.idGlovo, 
        name: `${employee.nombre} ${employee.apellido}`,
        currentStatus: employee.status 
      });

      // Update employee status to active
      if (process.env.NODE_ENV !== 'production') console.log("🔄 [REACTIVATE] Updating employee status to 'active'...");
      const updatedEmployee = await storage.updateEmployee(employeeId, { 
        status: "active"
      });
      
      if (process.env.NODE_ENV !== 'production') console.log("✅ [REACTIVATE] Employee status updated:", {
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

      if (process.env.NODE_ENV !== 'production') console.log("🎉 [REACTIVATE] ✅ SUCCESS! Employee reactivated:", {
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
      if (process.env.NODE_ENV !== 'production') console.error("💥 [REACTIVATE] CRITICAL ERROR:", error);
      if (process.env.NODE_ENV !== 'production') console.error("💥 [REACTIVATE] Error details:", {
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
    if (process.env.NODE_ENV !== 'production') console.log("📋 Process notification:", req.params.id, req.body);
    try {
      const user = req.user;
      if (!user || user.role !== 'super_admin') {
        return res.status(403).json({ message: "Only super admin can process notifications" });
      }

      const notificationId = parseInt(req.params.id);
      const { action, processingDate } = req.body; // "approve", "reject", "pending_laboral", "processed"

      if (!action || !["approve", "reject", "pending_laboral", "processed"].includes(action)) {
        return res.status(400).json({ message: "Action must be 'approve', 'reject', 'pending_laboral', or 'processed'" });
      }

      // Validar fecha de procesamiento
      const processDate = processingDate ? new Date(processingDate) : new Date();
      if (isNaN(processDate.getTime())) {
        return res.status(400).json({ message: "Invalid processing date" });
      }
      // Solo permitir fechas futuras para pending_laboral
      if ((action === "approve" || action === "reject") && processDate > new Date(new Date().toISOString().split('T')[0])) {
        return res.status(400).json({ message: "No se permiten fechas futuras para aprobar o rechazar. Solo para pendiente laboral." });
      }

      if (process.env.NODE_ENV !== 'production') console.log(`📋 Processing notification ${notificationId} with action "${action}" and date "${processDate.toISOString()}"`);

      // Get all notifications and find the one we need
      const allNotifications = await storage.getAllNotifications();
      const notification = allNotifications.find(n => n.id === notificationId);
      
      if (!notification) {
        return res.status(404).json({ message: "Notification not found" });
      }

      if (notification.status !== "pending" && notification.status !== "pending_laboral") {
        return res.status(400).json({ message: "Notification already processed" });
      }

      if (notification.type === "company_leave_request") {
        const metadata = notification.metadata as any;
        
        // Get complete employee data before creating the leave record
        const employee = await storage.getEmployee(metadata.employeeId);
        if (!employee) {
          return res.status(404).json({ message: "Employee not found" });
        }

        if (action === "approve") {
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

          if (process.env.NODE_ENV !== 'production') console.log(`✅ Company leave approved with date ${processDate.toISOString()}, employee moved to company_leaves table`);
        } else if (action === "reject") {
          // Reject the leave request - employee stays active
          if (process.env.NODE_ENV !== 'production') console.log(`❌ Company leave rejected, employee remains active`);
        } else if (action === "pending_laboral") {
          // Move employee to pending_laboral status
          await storage.updateEmployee(metadata.employeeId, { 
            status: "pending_laboral"
          });
          if (process.env.NODE_ENV !== 'production') console.log(`⏳ Employee moved to pending_laboral status`);
        } else if (action === "processed") {
          // Process the leave - move to company_leaves table
          const companyLeave = await storage.createCompanyLeave({
            employeeId: metadata.employeeId,
            employeeData: employee,
            leaveType: metadata.leaveType,
            leaveDate: metadata.leaveDate,
            leaveRequestedAt: notification.createdAt || new Date(),
            leaveRequestedBy: notification.requestedBy,
            approvedBy: user.email,
            approvedAt: processDate,
            status: "approved",
          });

          // Remove employee from active employees table
          await storage.deleteEmployee(metadata.employeeId);

          if (process.env.NODE_ENV !== 'production') console.log(`✅ Company leave processed with date ${processDate.toISOString()}, employee moved to company_leaves table`);
        }
      }

      // Update notification status
      await storage.updateNotificationStatus(notificationId, action === "approve" ? "approved" : action === "reject" ? "rejected" : action === "pending_laboral" ? "pending_laboral" : "processed");

      // Log audit trail
      if (notification.type === "company_leave_request") {
        const metadata = notification.metadata as any;
        const employee = await storage.getEmployee(metadata.employeeId);
        if (employee) {
          await AuditService.logCompanyLeaveApproval(user.email, user.role, employee, metadata.leaveType, action, processDate.toISOString(), req);
        }
      }

      if (process.env.NODE_ENV !== 'production') console.log(`✅ Notification ${action}d:`, notificationId);
      res.json({ message: `Notification ${action}d successfully` });
    } catch (error) {
      if (process.env.NODE_ENV !== 'production') console.error("❌ Error processing notification:", error);
      res.status(500).json({ message: "Failed to process notification" });
    }
  });

  // Company leaves (protected)
  app.get("/api/company-leaves", isAuthenticated, async (req: any, res) => {
    if (process.env.NODE_ENV !== 'production') console.log("🏢 Company leaves request");
    try {
      const user = req.user;
      if (user?.role === 'normal') {
        return res.status(403).json({ message: "No tienes permisos para ver las bajas empresa" });
      }
      const leaves = await storage.getAllCompanyLeaves();
      res.json(leaves);
    } catch (error) {
      if (process.env.NODE_ENV !== 'production') console.error("❌ Error fetching company leaves:", error);
      res.status(500).json({ message: "Failed to fetch company leaves" });
    }
  });

  // Notifications (protected - admin and super_admin can view)
  app.get("/api/notifications", isAuthenticated, async (req: any, res) => {
    if (process.env.NODE_ENV !== 'production') console.log("🔔 Notifications request from user:", req.user?.email, req.user?.role);
    try {
      const user = req.user;
      if (!user || user.role !== 'super_admin') {
        if (process.env.NODE_ENV !== 'production') console.log("❌ Permission denied for notifications view. User role:", user?.role);
        return res.status(403).json({ message: "Insufficient permissions to view notifications" });
      }
      const notifications = await storage.getAllNotifications();
      if (process.env.NODE_ENV !== 'production') console.log(`✅ Returning ${notifications.length} notifications to ${user.role} user: ${user.email}`);
      res.json(notifications);
    } catch (error) {
      if (process.env.NODE_ENV !== 'production') console.error("❌ Error fetching notifications:", error);
      res.status(500).json({ message: "Failed to fetch notifications" });
    }
  });

  // Exportar notificaciones de los últimos 90 días
  app.get("/api/notifications/export", isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      if (!user || user.role !== 'super_admin') {
        return res.status(403).json({ message: "Only super admin can export notifications" });
      }
      
      const now = new Date();
      const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      const allNotifications = await storage.getAllNotifications();
      const filtered = allNotifications.filter(n => {
        if (!n.createdAt) return false;
        return new Date(n.createdAt) >= ninetyDaysAgo;
      });
      
      // Obtener datos de empleados para las notificaciones de baja empresa
      const employees = await storage.getAllEmployees();
      const employeeMap = new Map();
      employees.forEach(emp => {
        employeeMap.set(emp.idGlovo, emp);
      });
      
      // Preparar datos para Excel
      const excelData = filtered.map(n => {
        const baseData: Record<string, any> = {
          'ID Notificación': n.id,
          'Tipo': n.type === 'company_leave_request' ? 'Solicitud de Baja Empresa' : 
                 n.type === 'employee_update' ? 'Actualización de Empleado' : 'Carga Masiva',
          'Título': n.title,
          'Mensaje': n.message.replace(/\n/g, ' '),
          'Solicitado por': n.requestedBy,
          'Estado': n.status === 'pending' ? 'Pendiente' :
                   n.status === 'pending_laboral' ? 'Pendiente Laboral' :
                   n.status === 'approved' ? 'Tramitada' :
                   n.status === 'rejected' ? 'Rechazada' : 'Procesada',
          'Fecha de creación': n.createdAt ? new Date(n.createdAt).toLocaleString('es-ES') : 'N/A',
          'Fecha de actualización': n.updatedAt ? new Date(n.updatedAt).toLocaleString('es-ES') : '',
          'ID Glovo': 'N/A',
          'Email Glovo': 'N/A',
          'Nombre Empleado': 'N/A',
          'Flota': 'N/A',
          'Tipo de Baja': 'N/A',
          'Fecha de Baja': 'N/A',
        };
        if (n.type === 'company_leave_request' && n.metadata) {
          const metadata = n.metadata as any;
          const employeeId = metadata.employeeId;
          const employee = employeeMap.get(employeeId);
          if (employee) {
            baseData['ID Glovo'] = employee.idGlovo || 'N/A';
            baseData['Email Glovo'] = employee.emailGlovo || 'N/A';
            baseData['Nombre Empleado'] = `${employee.nombre || ''} ${employee.apellido || ''}`.trim() || 'N/A';
            baseData['Flota'] = employee.flota || 'N/A';
          } else {
            baseData['Nombre Empleado'] = metadata.employeeName || 'N/A';
          }
          if (metadata.leaveType) {
            baseData['Tipo de Baja'] = metadata.leaveType;
          }
          if (metadata.leaveDate) {
            baseData['Fecha de Baja'] = new Date(metadata.leaveDate).toLocaleDateString('es-ES');
          }
        }
        return baseData;
      });
      
      // Crear workbook y worksheet
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(excelData);
      
      // Ajustar ancho de columnas
      const columnWidths = [
        { wch: 12 }, // ID Notificación
        { wch: 25 }, // Tipo
        { wch: 40 }, // Título
        { wch: 50 }, // Mensaje
        { wch: 20 }, // Solicitado por
        { wch: 15 }, // Estado
        { wch: 20 }, // Fecha de creación
        { wch: 20 }, // Fecha de actualización
        { wch: 12 }, // ID Glovo
        { wch: 25 }, // Email Glovo
        { wch: 30 }, // Nombre Empleado
        { wch: 20 }, // Flota
        { wch: 15 }, // Tipo de Baja
        { wch: 15 }, // Fecha de Baja
      ];
      worksheet['!cols'] = columnWidths;
      
      // Agregar worksheet al workbook
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Notificaciones');
      
      // Generar buffer del archivo Excel
      const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
      
      // Enviar archivo
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename="notificaciones_ultimos_90_dias.xlsx"');
      res.send(excelBuffer);
    } catch (error) {
      if (process.env.NODE_ENV !== 'production') console.error("❌ Error exporting notifications:", error);
      res.status(500).json({ message: "Failed to export notifications" });
    }
  });

  // ============================================
  // SYSTEM USERS MANAGEMENT (Super Admin Only)
  // ============================================

  // Get all system users
  app.get("/api/system-users", isAuthenticated, async (req: any, res) => {
    if (process.env.NODE_ENV !== 'production') console.log("👥 System users request from:", req.user?.email, req.user?.role);
    try {
      const user = req.user;
      if (!user || user.role !== 'super_admin') {
        if (process.env.NODE_ENV !== 'production') console.log("❌ Permission denied for system users. User role:", user?.role);
        return res.status(403).json({ message: "Only super admin can manage system users" });
      }

      const users = await storage.getAllSystemUsers();
      // Remove password from response
      const safeUsers = users.map(u => ({ ...u, password: undefined }));
      if (process.env.NODE_ENV !== 'production') console.log(`✅ Returning ${users.length} system users`);
      res.json(safeUsers);
    } catch (error) {
      if (process.env.NODE_ENV !== 'production') console.error("❌ Error fetching system users:", error);
      res.status(500).json({ message: "Failed to fetch system users" });
    }
  });

  // Create new system user
  app.post("/api/system-users", isAuthenticated, async (req: any, res) => {
    if (process.env.NODE_ENV !== 'production') console.log("➕ Create system user request:", req.body.email, req.body.role);
    try {
      const user = req.user;
      if (!user || user.role !== 'super_admin') {
        return res.status(403).json({ message: "Only super admin can create system users" });
      }

      const { email, firstName, lastName, password, role } = req.body;

      if (!email || !firstName || !lastName || !password || !role) {
        return res.status(400).json({ message: "All fields are required" });
      }

      if (!['admin', 'normal'].includes(role)) {
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
      if (process.env.NODE_ENV !== 'production') console.error("❌ Error creating system user:", error);
      res.status(500).json({ message: "Failed to create system user" });
    }
  });

  // Update system user
  app.put("/api/system-users/:id", isAuthenticated, async (req: any, res) => {
    if (process.env.NODE_ENV !== 'production') console.log("📝 Update system user request:", req.params.id);
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
      if (process.env.NODE_ENV !== 'production') console.error("❌ Error updating system user:", error);
      res.status(500).json({ message: "Failed to update system user" });
    }
  });

  // Delete system user
  app.delete("/api/system-users/:id", isAuthenticated, async (req: any, res) => {
    if (process.env.NODE_ENV !== 'production') console.log("🗑️ Delete system user request:", req.params.id);
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
      if (process.env.NODE_ENV !== 'production') console.error("❌ Error deleting system user:", error);
      res.status(500).json({ message: "Failed to delete system user" });
    }
  });

  // ============================================
  // AUDIT LOGS (Super Admin Only)
  // ============================================

  // Get audit logs
  app.get("/api/audit-logs", isAuthenticated, async (req: any, res) => {
    if (process.env.NODE_ENV !== 'production') console.log("📋 Audit logs request from:", req.user?.email, req.user?.role);
    try {
      const user = req.user;
      if (!user || user.role !== 'super_admin') {
        if (process.env.NODE_ENV !== 'production') console.log("❌ Permission denied for audit logs. User role:", user?.role);
        return res.status(403).json({ message: "Only super admin can view audit logs" });
      }

      const { limit = 100, userId, action, entityType, startDate, endDate } = req.query;

      let logs;
      
      // Si hay filtros específicos, usar los métodos específicos
      if (userId) {
        logs = await storage.getAuditLogsByUser(userId as string, parseInt(limit as string));
      } else if (action) {
        logs = await storage.getAuditLogsByAction(action as string, parseInt(limit as string));
      } else if (entityType) {
        logs = await storage.getAuditLogsByEntity(entityType as string, undefined, parseInt(limit as string));
      } else {
        // Obtener todos los logs y aplicar filtros de fecha si están presentes
        logs = await storage.getAllAuditLogs(parseInt(limit as string));
      }

      // Aplicar filtros de fecha si están presentes
      if (startDate || endDate) {
        logs = logs.filter(log => {
          if (!log.createdAt) return false;
          const logDate = new Date(log.createdAt);
          const start = startDate ? new Date(startDate as string) : null;
          const end = endDate ? new Date(endDate as string) : null;
          
          if (start && logDate < start) return false;
          if (end && logDate > end) return false;
          
          return true;
        });
      }

      if (process.env.NODE_ENV !== 'production') console.log(`✅ Returning ${logs.length} audit logs`);
      res.json(logs);
    } catch (error) {
      if (process.env.NODE_ENV !== 'production') console.error("❌ Error fetching audit logs:", error);
      res.status(500).json({ message: "Failed to fetch audit logs" });
    }
  });

  // Get audit logs statistics
  app.get("/api/audit-logs/stats", isAuthenticated, async (req: any, res) => {
    if (process.env.NODE_ENV !== 'production') console.log("📊 Audit logs stats request from:", req.user?.email, req.user?.role);
    try {
      const user = req.user;
      if (!user || user.role !== 'super_admin') {
        return res.status(403).json({ message: "Only super admin can view audit stats" });
      }

      const stats = await storage.getAuditLogsStats();
      if (process.env.NODE_ENV !== 'production') console.log("✅ Returning audit logs statistics");
      res.json(stats);
    } catch (error) {
      if (process.env.NODE_ENV !== 'production') console.error("❌ Error fetching audit logs stats:", error);
      res.status(500).json({ message: "Failed to fetch audit logs stats" });
    }
  });

  // Penalizar empleado (super admin y admin only)
  app.post("/api/employees/:id/penalize", isAuthenticated, async (req: any, res) => {
    if (process.env.NODE_ENV !== 'production') console.log("⚠️ Penalize employee request:", req.params.id, req.body);
    try {
      const user = req.user;
      if (!user || !['super_admin', 'admin'].includes(user.role)) {
        return res.status(403).json({ message: "Insufficient permissions to penalize employees" });
      }

      const employeeId = req.params.id;
      const { startDate, endDate, observations } = req.body;

      if (!startDate || !endDate) {
        return res.status(400).json({ message: "Fecha de inicio y fin son requeridas" });
      }

      if (!observations || !observations.trim()) {
        return res.status(400).json({ message: "Las observaciones son requeridas" });
      }

      // Validar fechas
      const start = new Date(startDate);
      const end = new Date(endDate);
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return res.status(400).json({ message: "Fechas inválidas" });
      }

      if (start >= end) {
        return res.status(400).json({ message: "La fecha de fin debe ser posterior a la fecha de inicio" });
      }

      // Get employee to ensure it exists
      const employee = await storage.getEmployee(employeeId);
      if (!employee) {
        return res.status(404).json({ message: "Employee not found" });
      }

      // Guardar horas originales si no están guardadas
      const originalHours = employee.originalHours || employee.horas || 0;

      // Update employee status to penalizado
      await storage.updateEmployee(employeeId, { 
        status: "penalizado",
        penalizationStartDate: startDate,
        penalizationEndDate: endDate,
        originalHours: originalHours,
        horas: 0 // Poner horas a cero
      });

      // Log audit trail con observaciones
      await AuditService.logAction({
        userId: user.email,
        userRole: user.role as "super_admin" | "admin",
        action: "penalize_employee",
        entityType: "employee",
        entityId: employeeId,
        entityName: `${employee.nombre} ${employee.apellido || ""}`,
        description: `Empleado penalizado desde ${startDate} hasta ${endDate}. Horas originales: ${originalHours}. Observaciones: ${observations.trim()}`,
        newData: { status: "penalizado", startDate, endDate, originalHours, observations: observations.trim() },
        req
      });

      if (process.env.NODE_ENV !== 'production') console.log("✅ Employee penalized:", employeeId);
      res.json({ message: "Employee penalized successfully" });
    } catch (error) {
      if (process.env.NODE_ENV !== 'production') console.error("❌ Error penalizing employee:", error);
      res.status(500).json({ message: "Failed to penalize employee" });
    }
  });

  // Remover penalización de empleado (super admin y admin only)
  app.post("/api/employees/:id/remove-penalization", isAuthenticated, async (req: any, res) => {
    if (process.env.NODE_ENV !== 'production') console.log("✅ Remove penalization request:", req.params.id);
    try {
      const user = req.user;
      if (!user || !['super_admin', 'admin'].includes(user.role)) {
        return res.status(403).json({ message: "Insufficient permissions to remove penalization" });
      }

      const employeeId = req.params.id;

      // Get employee to ensure it exists
      const employee = await storage.getEmployee(employeeId);
      if (!employee) {
        return res.status(404).json({ message: "Employee not found" });
      }

      if (employee.status !== "penalizado") {
        return res.status(400).json({ message: "Employee is not penalized" });
      }

      // Restaurar horas originales
      const originalHours = employee.originalHours || 0;

      // Update employee status back to active
      await storage.updateEmployee(employeeId, { 
        status: "active",
        penalizationStartDate: undefined,
        penalizationEndDate: undefined,
        originalHours: undefined,
        horas: originalHours // Restaurar horas originales
      });

      // Log audit trail
      await AuditService.logAction({
        userId: user.email,
        userRole: user.role as "super_admin" | "admin",
        action: "remove_penalization",
        entityType: "employee",
        entityId: employeeId,
        entityName: `${employee.nombre} ${employee.apellido || ""}`,
        description: `Penalización removida. Horas restauradas: ${originalHours}`,
        newData: { status: "active", restoredHours: originalHours },
        req
      });

      if (process.env.NODE_ENV !== 'production') console.log("✅ Employee penalization removed:", employeeId);
      res.json({ message: "Employee penalization removed successfully" });
    } catch (error) {
      if (process.env.NODE_ENV !== 'production') console.error("❌ Error removing penalization:", error);
      res.status(500).json({ message: "Failed to remove penalization" });
    }
  });

  // Job automático para restaurar penalizaciones expiradas
  app.post("/api/employees/restore-expired-penalizations", async (req: any, res) => {
    if (process.env.NODE_ENV !== 'production') console.log("🔄 Checking for expired penalizations...");
    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Buscar empleados con penalización expirada
      const allEmployees = await storage.getAllEmployees();
      const expiredPenalizations = allEmployees.filter(emp => 
        emp.status === 'penalizado' && 
        emp.penalizationEndDate && 
        new Date(emp.penalizationEndDate) < new Date(today)
      );

      if (expiredPenalizations.length === 0) {
        if (process.env.NODE_ENV !== 'production') console.log("✅ No expired penalizations found");
        return res.json({ 
          message: "No expired penalizations found",
          restored: 0 
        });
      }

      let restoredCount = 0;
      
      for (const employee of expiredPenalizations) {
        try {
          // Restaurar empleado
          await storage.updateEmployee(employee.idGlovo, {
            status: "active",
            penalizationStartDate: undefined,
            penalizationEndDate: undefined,
            originalHours: undefined,
            horas: employee.originalHours || 0
          });

          // Log audit trail
          await AuditService.logAction({
            userId: "SYSTEM",
            userRole: "super_admin",
            action: "auto_restore_penalization",
            entityType: "employee",
            entityId: employee.idGlovo,
            entityName: `${employee.nombre} ${employee.apellido || ""}`,
            description: `Penalización restaurada automáticamente al expirar. Horas restauradas: ${employee.originalHours || 0}`,
            newData: { status: "active", restoredHours: employee.originalHours || 0 },
            req
          });

          restoredCount++;
          if (process.env.NODE_ENV !== 'production') console.log(`✅ Restored penalization for employee: ${employee.idGlovo}`);
        } catch (error) {
          if (process.env.NODE_ENV !== 'production') console.error(`❌ Error restoring penalization for employee ${employee.idGlovo}:`, error);
        }
      }

      if (process.env.NODE_ENV !== 'production') console.log(`✅ Restored ${restoredCount} expired penalizations`);
      res.json({ 
        message: `Restored ${restoredCount} expired penalizations`,
        restored: restoredCount 
      });
    } catch (error) {
      if (process.env.NODE_ENV !== 'production') console.error("❌ Error checking expired penalizations:", error);
      res.status(500).json({ message: "Failed to check expired penalizations" });
    }
  });

  // Delete all employees (super_admin only)
  app.delete("/api/employees/all", isAuthenticated, async (req: any, res) => {
    if (process.env.NODE_ENV !== 'production') console.log("🗑️ Delete all employees request from user:", req.user?.email, req.user?.role);
    
    try {
      const user = req.user;
      if (!user || user.role !== 'super_admin') {
        if (process.env.NODE_ENV !== 'production') console.log("❌ Permission denied for delete all employees. User role:", user?.role);
        return res.status(403).json({ message: "Only super admin can delete all employees" });
      }

      // Get current employee count for audit log
      const currentEmployees = await storage.getAllEmployees();
      const employeeCount = currentEmployees.length;

      if (employeeCount === 0) {
        return res.status(400).json({ message: "No hay empleados para eliminar" });
      }

      if (process.env.NODE_ENV !== 'production') console.log(`🗑️ Deleting all ${employeeCount} employees...`);
      
      // Delete all employees
      await storage.clearAllEmployees();
      
      if (process.env.NODE_ENV !== 'production') console.log("✅ All employees deleted successfully");
      
      // Log audit trail
      await AuditService.logAction({
        userId: user.email,
        userRole: user.role as "super_admin" | "admin",
        action: "DELETE_ALL_EMPLOYEES",
        entityType: "employee",
        entityName: `Eliminación masiva de empleados`,
        description: `Eliminación masiva de empleados`,
        newData: { deletedCount: employeeCount },
        req
      });
      
      res.status(200).json({ 
        message: `Se eliminaron ${employeeCount} empleados exitosamente`,
        deletedCount: employeeCount
      });
    } catch (error) {
      if (process.env.NODE_ENV !== 'production') console.error("❌ Error deleting all employees:", error);
      res.status(500).json({ message: "Error al eliminar todos los empleados" });
    }
  });

  // Catch-all for undefined API routes
  app.all('/api/*', (req, res) => {
    if (process.env.NODE_ENV !== 'production') console.log("❓ Unknown API route:", req.method, req.path);
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
        'GET /api/audit-logs/stats',
        'GET /api/notifications/export'
      ]
    });
  });

  const httpServer = createServer(app);
  
  if (process.env.NODE_ENV !== 'production') console.log("✅ All routes registered successfully");
  return httpServer;
}