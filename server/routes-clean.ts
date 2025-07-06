import type { Express } from 'express';
import { createServer, type Server } from 'http';
import { PostgresStorage } from './storage-postgres.js';
import { setupAuth, isAuthenticated } from './auth-local.js';
import { AuditService } from './audit-service.js';
// XLSX import removed as it's not used in this file

const storage = new PostgresStorage();

export async function registerRoutes (app: Express): Promise<Server> {
  if (process.env.NODE_ENV !== 'production') console.log('🚀 Setting up routes...');

  // Setup authentication first
  await setupAuth(app);

  // Health check
  app.get('/api/health', (req, res) => {
    if (process.env.NODE_ENV !== 'production') console.log('❤️ Health check');
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Dashboard metrics (protected)
  app.get('/api/dashboard/metrics', isAuthenticated, async (req, res) => {
    if (process.env.NODE_ENV !== 'production') console.log('📊 Dashboard metrics request');
    try {
      const user = req.user as { role?: string };
      if (user?.role === 'normal') {
        return res.status(403).json({ message: 'No tienes permisos para ver el dashboard' });
      }
      const metrics = await storage.getDashboardMetrics();

      // Solo el super admin puede ver las notificaciones pendientes
      if (user?.role !== 'super_admin') {
        metrics.pendingActions = 0; // Ocultar notificaciones pendientes para otros roles
      }

      res.json(metrics);
    } catch (error) {
      if (process.env.NODE_ENV !== 'production') console.error('❌ Error fetching dashboard metrics:', error);
      res.status(500).json({ message: 'Failed to fetch dashboard metrics' });
    }
  });

  // Get unique cities for filters (protected)
  app.get('/api/cities', isAuthenticated, async (req, res) => {
    if (process.env.NODE_ENV !== 'production') console.log('🏙️ Unique cities request');
    try {
      const cities = await storage.getUniqueCities();
      res.json(cities);
    } catch (error) {
      if (process.env.NODE_ENV !== 'production') console.error('❌ Error fetching cities:', error);
      res.status(500).json({ message: 'Failed to fetch cities' });
    }
  });

  // Get unique fleets for filters (protected)
  app.get('/api/fleets', isAuthenticated, async (req, res) => {
    if (process.env.NODE_ENV !== 'production') console.log('🛳️ Unique fleets request');
    try {
      const fleets = await storage.getUniqueFleets();
      res.json(fleets);
    } catch (error) {
      if (process.env.NODE_ENV !== 'production') console.error('❌ Error fetching fleets:', error);
      res.status(500).json({ message: 'Failed to fetch fleets' });
    }
  });

  // Get unique flotas for filters (protected)
  app.get('/api/flotas', isAuthenticated, async (req, res) => {
    if (process.env.NODE_ENV !== 'production') console.log('🚗 Unique flotas request');
    try {
      const flotas = await storage.getUniqueFlotas();
      res.json(flotas);
    } catch (error) {
      if (process.env.NODE_ENV !== 'production') console.error('❌ Error fetching flotas:', error);
      res.status(500).json({ message: 'Failed to fetch flotas' });
    }
  });

  // Employees list (protected)
  app.get('/api/employees', isAuthenticated, async (req, res) => {
    if (process.env.NODE_ENV !== 'production') console.log('👥 Employees list request with filters:', req.query);
    try {
      const { city, status, search, flota } = req.query;

      let employees = await storage.getAllEmployees();

      // Apply filters
      if (city && city !== 'all') {
        employees = employees.filter(emp => emp.ciudad === city);
      }

      if (status && status !== 'all') {
        employees = employees.filter(emp => emp.status === status);
      }

      if (flota && flota !== 'all') {
        employees = employees.filter(emp => emp.flota === flota);
      }

      if (search) {
        const searchTerm = search.toString().toLowerCase();
        employees = employees.filter(emp =>
          emp.nombre?.toLowerCase().includes(searchTerm) ||
          emp.apellido?.toLowerCase().includes(searchTerm) ||
          emp.telefono?.includes(searchTerm) ||
          emp.email?.toLowerCase().includes(searchTerm),
        );
      }

      res.json(employees);
    } catch (error) {
      if (process.env.NODE_ENV !== 'production') console.error('❌ Error fetching employees:', error);
      res.status(500).json({ message: 'Failed to fetch employees' });
    }
  });

  // Create employee (protected - admin/super_admin only)
  app.post('/api/employees', isAuthenticated, async (req, res) => {
    if (process.env.NODE_ENV !== 'production') console.log('➕ Create employee request');
    try {
      const user = req.user as { email?: string; role?: string };
      if (user?.role === 'normal') {
        return res.status(403).json({ message: 'No tienes permisos para crear empleados' });
      }

      const employeeData = req.body as Record<string, unknown>;
      const employee = await storage.createEmployee(employeeData as any);

      // Log audit
      await AuditService.logAction({
        userId: user.email || '',
        userRole: user.role as 'super_admin' | 'admin',
        action: 'create_employee',
        entityType: 'employee',
        entityId: employee.idGlovo,
        entityName: `${employee.nombre} ${employee.apellido}`,
        description: `Empleado creado: ${employee.nombre} ${employee.apellido} (${employee.idGlovo})`,
        newData: employee,
      });

      res.status(201).json(employee);
    } catch (error) {
      if (process.env.NODE_ENV !== 'production') console.error('❌ Error creating employee:', error);
      res.status(500).json({ message: 'Failed to create employee' });
    }
  });

  // Update employee (protected - admin/super_admin only)
  app.put('/api/employees/:id', isAuthenticated, async (req, res) => {
    if (process.env.NODE_ENV !== 'production') console.log('✏️ Update employee request');
    try {
      const user = req.user as { email?: string; role?: string };
      if (user?.role === 'normal') {
        return res.status(403).json({ message: 'No tienes permisos para editar empleados' });
      }

      const { id } = req.params;
      const employeeData = req.body as Record<string, unknown>;

      // Get old data for audit
      const oldEmployee = await storage.getEmployee(id);

      const employee = await storage.updateEmployee(id, employeeData as Record<string, unknown>);

      // Log audit
      await AuditService.logAction({
        userId: user.email || '',
        userRole: user.role as 'super_admin' | 'admin',
        action: 'update_employee',
        entityType: 'employee',
        entityId: employee.idGlovo,
        entityName: `${employee.nombre} ${employee.apellido}`,
        description: `Empleado actualizado: ${employee.nombre} ${employee.apellido} (${employee.idGlovo})`,
        oldData: oldEmployee,
        newData: employee,
      });

      res.json(employee);
    } catch (error) {
      if (process.env.NODE_ENV !== 'production') console.error('❌ Error updating employee:', error);
      res.status(500).json({ message: 'Failed to update employee' });
    }
  });

  // Delete employee (protected - super_admin only)
  app.delete('/api/employees/:id', isAuthenticated, async (req, res) => {
    if (process.env.NODE_ENV !== 'production') console.log('🗑️ Delete employee request');
    try {
      const user = req.user as { role?: string };
      if (user?.role !== 'super_admin') {
        return res.status(403).json({ message: 'Solo el super admin puede eliminar empleados' });
      }

      const { id } = req.params;

      // Get employee data for audit
      const employee = await storage.getEmployee(id);
      if (!employee) {
        return res.status(404).json({ message: 'Employee not found' });
      }

      await storage.deleteEmployee(id);

      // Log audit
      await AuditService.logAction({
        userId: user.email,
        userRole: user.role,
        action: 'delete_employee',
        entityType: 'employee',
        entityId: employee.idGlovo,
        entityName: `${employee.nombre} ${employee.apellido}`,
        description: `Empleado eliminado: ${employee.nombre} ${employee.apellido} (${employee.idGlovo})`,
        oldData: employee,
      });

      res.status(204).send();
    } catch (error) {
      if (process.env.NODE_ENV !== 'production') console.error('❌ Error deleting employee:', error);
      res.status(500).json({ message: 'Failed to delete employee' });
    }
  });

  // Delete all employees (protected - super_admin only)
  app.delete('/api/employees/all', isAuthenticated, async (req: { user?: { email?: string; role?: string } }, res) => {
    if (process.env.NODE_ENV !== 'production') console.log('🗑️ Delete all employees request');
    try {
      const user = req.user;
      if (user?.role !== 'super_admin') {
        return res.status(403).json({ message: 'Solo el super admin puede eliminar todos los empleados' });
      }

      // Get count for audit
      const employees = await storage.getAllEmployees();

      await storage.clearAllEmployees();

      // Log audit
      await AuditService.logAction({
        userId: user.email,
        userRole: user.role,
        action: 'delete_all_employees',
        entityType: 'employee',
        description: `Todos los empleados eliminados (${employees.length} empleados)`,
        oldData: { count: employees.length },
      });

      res.status(204).send();
    } catch (error) {
      if (process.env.NODE_ENV !== 'production') console.error('❌ Error deleting all employees:', error);
      res.status(500).json({ message: 'Failed to delete all employees' });
    }
  });

  // Bulk import employees (protected - super_admin only)
  app.post('/api/employees/bulk-import', isAuthenticated, async (req: { user?: { email?: string; role?: string }; body: { employees: Record<string, unknown>[]; dryRun?: boolean } }, res) => {
    if (process.env.NODE_ENV !== 'production') console.log('📥 Bulk import employees request');
    try {
      const user = req.user;
      if (user?.role !== 'super_admin') {
        return res.status(403).json({ message: 'Solo el super admin puede importar empleados' });
      }

      const { employees, dryRun = false } = req.body;

      if (!Array.isArray(employees) || employees.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Invalid input: employees must be a non-empty array',
        });
      }

      // Process and validate employees
      const processedEmployees = employees.map((emp: Record<string, unknown>, index: number) => {
        const processString = (stringValue: unknown): string | undefined => {
          if (!stringValue) return undefined;
          const processed = String(stringValue).trim();
          return processed === '' ? undefined : processed;
        };

        const processNumber = (numberValue: unknown): number | undefined => {
          if (numberValue === null || numberValue === undefined || numberValue === '') return undefined;
          const num = Number(numberValue);
          return isNaN(num) ? undefined : num;
        };

        const processDate = (dateValue: unknown): string | undefined => {
          if (!dateValue) return undefined;
          try {
            const date = new Date(dateValue as string | number | Date);
            if (isNaN(date.getTime())) return undefined;
            return date.toISOString().split('T')[0]; // YYYY-MM-DD format
          } catch {
            return undefined;
          }
        };

        const processBoolean = (boolValue: unknown): boolean => {
          if (typeof boolValue === 'boolean') return boolValue;
          if (typeof boolValue === 'string') {
            const lower = boolValue.toLowerCase();
            return lower === 'true' || lower === '1' || lower === 'yes' || lower === 'sí';
          }
          return false;
        };

        const horas = processNumber(emp.horas);
        const cdp = horas ? Number(((horas / 38) * 100).toFixed(2)) : 0;

        return {
          idGlovo: processString(emp.idGlovo) || `TEMP_${index}`,
          emailGlovo: processString(emp.emailGlovo),
          turno: processString(emp.turno),
          nombre: processString(emp.nombre) || 'Sin Nombre',
          apellido: processString(emp.apellido),
          telefono: processString(emp.telefono) || 'Sin Teléfono',
          email: processString(emp.email),
          horas: horas,
          cdp: cdp,
          complementaries: processString(emp.complementaries),
          ciudad: processString(emp.ciudad),
          cityCode: processString(emp.cityCode),
          dniNie: processString(emp.dniNie),
          iban: processString(emp.iban),
          direccion: processString(emp.direccion),
          vehiculo: processString(emp.vehiculo) as 'Bicicleta' | 'Patinete' | 'Moto' | 'Otro' | undefined,
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
          faltasNoCheckInEnDias: processNumber(emp.faltasNoCheckInEnDias) || 0,
          cruce: processString(emp.cruce),
          flota: processString(emp.flota) || 'SIN_FLOTA',
          status: (processString(emp.status) as 'active' | 'it_leave' | 'company_leave_pending' | 'company_leave_approved' | 'pending_laboral' | 'pendiente_laboral' | 'penalizado') || 'active',
        };
      });

      // Validate required fields
      const errors: string[] = [];
      processedEmployees.forEach((emp, index) => {
        if (!emp.idGlovo || emp.idGlovo === `TEMP_${index}`) {
          errors.push(`Fila ${index + 2}: ID Glovo es requerido`);
        }
        if (!emp.nombre || emp.nombre === 'Sin Nombre') {
          errors.push(`Fila ${index + 2}: Nombre es requerido`);
        }
        if (!emp.telefono || emp.telefono === 'Sin Teléfono') {
          errors.push(`Fila ${index + 2}: Teléfono es requerido`);
        }
      });

      if (errors.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Errores de validación encontrados',
          errors,
        });
      }

      // Si es dryRun, solo devolver validación sin importar
      if (dryRun) {
        return res.json({
          success: true,
          message: 'Vista previa completada',
          validEmployees: processedEmployees,
          invalidEmployees: [],
          validationErrors: errors,
        });
      }

      // Import employees
      const createdEmployees = await storage.bulkCreateEmployees(processedEmployees);

      // Log audit
      await AuditService.logAction({
        userId: user.email,
        userRole: user.role,
        action: 'bulk_import_employees',
        entityType: 'employee',
        description: `Importación masiva de empleados: ${createdEmployees.length} empleados importados`,
        newData: { count: createdEmployees.length, employees: createdEmployees },
      });

      res.json({
        success: true,
        message: `Se importaron ${createdEmployees.length} empleados correctamente`,
        employees: createdEmployees,
      });
    } catch (error) {
      if (process.env.NODE_ENV !== 'production') console.error('❌ Error in bulk import:', error);
      res.status(500).json({
        success: false,
        message: 'Error al importar empleados',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  // Employee penalization (protected - admin/super_admin only)
  app.post('/api/employees/:id/penalize', isAuthenticated, async (req: any, res) => {
    if (process.env.NODE_ENV !== 'production') console.log('⚠️ Penalize employee request');
    try {
      const user = req.user;
      if (user?.role === 'normal') {
        return res.status(403).json({ message: 'No tienes permisos para penalizar empleados' });
      }

      const { id } = req.params;
      const { startDate, endDate, observations } = req.body;

      // Validate required fields
      if (!startDate || !endDate || !observations) {
        return res.status(400).json({ message: 'startDate, endDate y observations son requeridos' });
      }

      // Get employee data for audit
      const employee = await storage.getEmployee(id);
      if (!employee) {
        return res.status(404).json({ message: 'Employee not found' });
      }

      const penalizedEmployee = await storage.penalizeEmployee(id, startDate, endDate, observations);

      // Log audit
      await AuditService.logAction({
        userId: user.email,
        userRole: user.role,
        action: 'penalize_employee',
        entityType: 'employee',
        entityId: employee.idGlovo,
        entityName: `${employee.nombre} ${employee.apellido}`,
        description: `Empleado penalizado: ${employee.nombre} ${employee.apellido} (${employee.idGlovo}) desde ${startDate} hasta ${endDate}`,
        oldData: employee,
        newData: penalizedEmployee,
      });

      res.json(penalizedEmployee);
    } catch (error) {
      if (process.env.NODE_ENV !== 'production') console.error('❌ Error penalizing employee:', error);
      res.status(500).json({ message: 'Failed to penalize employee' });
    }
  });

  app.post('/api/employees/:id/remove-penalization', isAuthenticated, async (req: any, res) => {
    if (process.env.NODE_ENV !== 'production') console.log('✅ Remove employee penalization request');
    try {
      const user = req.user;
      if (user?.role === 'normal') {
        return res.status(403).json({ message: 'No tienes permisos para remover penalizaciones' });
      }

      const { id } = req.params;

      // Get employee data for audit
      const employee = await storage.getEmployee(id);
      if (!employee) {
        return res.status(404).json({ message: 'Employee not found' });
      }

      const updatedEmployee = await storage.removePenalization(id);

      // Log audit
      await AuditService.logAction({
        userId: user.email,
        userRole: user.role,
        action: 'remove_employee_penalization',
        entityType: 'employee',
        entityId: employee.idGlovo,
        entityName: `${employee.nombre} ${employee.apellido}`,
        description: `Penalización removida del empleado: ${employee.nombre} ${employee.apellido} (${employee.idGlovo})`,
        oldData: employee,
        newData: updatedEmployee,
      });

      res.json(updatedEmployee);
    } catch (error) {
      if (process.env.NODE_ENV !== 'production') console.error('❌ Error removing employee penalization:', error);
      res.status(500).json({ message: 'Failed to remove employee penalization' });
    }
  });

  // Company leaves (protected)
  app.get('/api/company-leaves', isAuthenticated, async (req, res) => {
    if (process.env.NODE_ENV !== 'production') console.log('🏢 Company leaves request');
    try {
      const leaves = await storage.getAllCompanyLeaves();
      res.json(leaves);
    } catch (error) {
      if (process.env.NODE_ENV !== 'production') console.error('❌ Error fetching company leaves:', error);
      res.status(500).json({ message: 'Failed to fetch company leaves' });
    }
  });

  app.post('/api/company-leaves', isAuthenticated, async (req: any, res) => {
    if (process.env.NODE_ENV !== 'production') console.log('➕ Create company leave request');
    try {
      const user = req.user;
      if (user?.role === 'normal') {
        return res.status(403).json({ message: 'No tienes permisos para crear bajas de empresa' });
      }

      const leaveData = req.body;
      
      // Asegurar que leaveRequestedAt esté presente
      const processedLeaveData = {
        ...leaveData,
        leaveRequestedAt: leaveData.leaveRequestedAt || new Date(),
      };
      
      const leave = await storage.createCompanyLeave(processedLeaveData);

      // Crear notificación automáticamente
      const notificationData = {
        type: 'company_leave_request' as const,
        title: 'Solicitud de Baja Empresa',
        message: `Se ha solicitado una baja empresa para el empleado ${leaveData.employeeId}`,
        requestedBy: user.email,
        status: 'pending' as const,
        metadata: {
          employeeId: leaveData.employeeId,
          leaveType: leaveData.leaveType,
          leaveDate: leaveData.leaveDate,
          companyLeaveId: leave.id,
        },
      };

      const notification = await storage.createNotification(notificationData);

      // Log audit
      await AuditService.logAction({
        userId: user.email,
        userRole: user.role,
        action: 'create_company_leave',
        entityType: 'company_leave',
        entityId: leave.employeeId,
        description: `Baja de empresa creada para empleado ${leave.employeeId}`,
        newData: leave,
      });

      res.status(201).json({ leave, notification });
    } catch (error) {
      if (process.env.NODE_ENV !== 'production') console.error('❌ Error creating company leave:', error);
      res.status(500).json({ message: 'Failed to create company leave' });
    }
  });

  // IT leaves (protected)
  app.get('/api/it-leaves', isAuthenticated, async (req, res) => {
    if (process.env.NODE_ENV !== 'production') console.log('🏥 IT leaves request');
    try {
      const leaves = await storage.getAllItLeaves();
      res.json(leaves);
    } catch (error) {
      if (process.env.NODE_ENV !== 'production') console.error('❌ Error fetching IT leaves:', error);
      res.status(500).json({ message: 'Failed to fetch IT leaves' });
    }
  });

  app.post('/api/it-leaves', isAuthenticated, async (req: any, res) => {
    if (process.env.NODE_ENV !== 'production') console.log('➕ Create IT leave request');
    try {
      const user = req.user;
      if (user?.role === 'normal') {
        return res.status(403).json({ message: 'No tienes permisos para crear bajas IT' });
      }

      const leaveData = req.body;
      const leave = await storage.createItLeave(leaveData);

      // Log audit
      await AuditService.logAction({
        userId: user.email,
        userRole: user.role,
        action: 'create_it_leave',
        entityType: 'it_leave',
        entityId: leave.employeeId,
        description: `Baja IT creada para empleado ${leave.employeeId}`,
        newData: leave,
      });

      res.status(201).json(leave);
    } catch (error) {
      if (process.env.NODE_ENV !== 'production') console.error('❌ Error creating IT leave:', error);
      res.status(500).json({ message: 'Failed to create IT leave' });
    }
  });

  // Notifications (protected)
  app.get('/api/notifications', isAuthenticated, async (req, res) => {
    if (process.env.NODE_ENV !== 'production') console.log('🔔 Notifications request');
    try {
      const notifications = await storage.getAllNotifications();
      res.json(notifications);
    } catch (error) {
      if (process.env.NODE_ENV !== 'production') console.error('❌ Error fetching notifications:', error);
      res.status(500).json({ message: 'Failed to fetch notifications' });
    }
  });

  app.post('/api/notifications', isAuthenticated, async (req: any, res) => {
    if (process.env.NODE_ENV !== 'production') console.log('➕ Create notification request');
    try {
      const user = req.user;
      const notificationData = req.body;
      const notification = await storage.createNotification(notificationData);

      // Log audit
      await AuditService.logAction({
        userId: user.email,
        userRole: user.role,
        action: 'create_notification',
        entityType: 'notification',
        entityId: notification.id.toString(),
        description: `Notificación creada: ${notification.title}`,
        newData: notification,
      });

      res.status(201).json(notification);
    } catch (error) {
      if (process.env.NODE_ENV !== 'production') console.error('❌ Error creating notification:', error);
      res.status(500).json({ message: 'Failed to create notification' });
    }
  });

  app.put('/api/notifications/:id/status', isAuthenticated, async (req: any, res) => {
    if (process.env.NODE_ENV !== 'production') console.log('✏️ Update notification status request');
    try {
      const user = req.user;
      if (user?.role === 'normal') {
        return res.status(403).json({ message: 'No tienes permisos para actualizar notificaciones' });
      }

      const { id } = req.params;
      const { status } = req.body;

      const notification = await storage.updateNotificationStatus(parseInt(id), status);

      // Log audit
      await AuditService.logAction({
        userId: user.email,
        userRole: user.role,
        action: 'update_notification_status',
        entityType: 'notification',
        entityId: notification.id.toString(),
        description: `Estado de notificación actualizado a: ${status}`,
        oldData: { status: notification.status },
        newData: { status },
      });

      res.json(notification);
    } catch (error) {
      if (process.env.NODE_ENV !== 'production') console.error('❌ Error updating notification status:', error);
      res.status(500).json({ message: 'Failed to update notification status' });
    }
  });

  // Process notification (protected - super_admin only)
  app.post('/api/notifications/:id/process', isAuthenticated, async (req: any, res) => {
    if (process.env.NODE_ENV !== 'production') console.log('⚙️ Process notification request');
    try {
      const user = req.user;
      if (user?.role !== 'super_admin') {
        return res.status(403).json({ message: 'Solo el super admin puede procesar notificaciones' });
      }

      const { id } = req.params;
      const { action, processingDate } = req.body;

      if (!action || !['approve', 'reject', 'pending_laboral', 'processed'].includes(action)) {
        return res.status(400).json({ message: 'Acción inválida. Debe ser: approve, reject, pending_laboral, o processed' });
      }

      // Get the notification
      const notification = await storage.getNotification(parseInt(id));
      if (!notification) {
        return res.status(404).json({ message: 'Notificación no encontrada' });
      }

      // If this is a company leave request, update the employee status and company leave record
      if (notification.type === 'company_leave_request' && notification.metadata) {
        const metadata = notification.metadata as any;
        const employeeId = metadata.employeeId;
        const companyLeaveId = metadata.companyLeaveId;

        if (employeeId) {
          let newEmployeeStatus: string;
          let newCompanyLeaveStatus: string;

          switch (action) {
            case 'approve':
              newEmployeeStatus = 'company_leave_approved';
              newCompanyLeaveStatus = 'approved';
              break;
            case 'reject':
              newEmployeeStatus = 'active'; // Return to active status
              newCompanyLeaveStatus = 'rejected';
              break;
            case 'pending_laboral':
              newEmployeeStatus = 'pending_laboral';
              newCompanyLeaveStatus = 'pending';
              break;
            default:
              newEmployeeStatus = 'company_leave_pending';
              newCompanyLeaveStatus = 'pending';
          }

          // Update employee status
          await storage.updateEmployee(employeeId, { status: newEmployeeStatus });

          // Update company leave status if it exists
          if (companyLeaveId) {
            await storage.updateCompanyLeaveStatus(parseInt(companyLeaveId), newCompanyLeaveStatus, user.email, new Date(processingDate));
          }

          // If action is pending_laboral, create a new notification for pending laboral
          if (action === 'pending_laboral') {
            // Create a new notification for pending laboral
            await storage.createNotification({
              type: 'company_leave_request',
              title: 'Baja Empresa - Pendiente Laboral',
              message: `El empleado ${employeeId} ha sido movido a pendiente laboral. Requiere tramitación.`,
              status: 'pending_laboral',
              requestedBy: user.email,
              metadata: {
                employeeId,
                companyLeaveId,
                originalNotificationId: notification.id,
                action: 'pending_laboral',
              },
            });
          }

          // Log audit for employee status change
          await AuditService.logAction({
            userId: user.email,
            userRole: user.role,
            action: 'process_company_leave_notification',
            entityType: 'employee',
            entityId: employeeId,
            description: `Notificación de baja empresa procesada: ${action} - Empleado ${employeeId} - Estado: ${newEmployeeStatus}`,
            newData: {
              action,
              employeeId,
              newEmployeeStatus,
              newCompanyLeaveStatus,
              processingDate,
            },
          });
        }
      }

      // Update notification status with processing date
      const updatedNotification = await storage.updateNotificationStatusWithDate(
        parseInt(id),
        action === 'approve' ? 'approved' : action === 'reject' ? 'rejected' : action === 'pending_laboral' ? 'approved' : 'processed',
        new Date(processingDate),
      );

      // Log audit for notification processing
      await AuditService.logAction({
        userId: user.email,
        userRole: user.role,
        action: 'process_notification',
        entityType: 'notification',
        entityId: notification.id.toString(),
        description: `Notificación procesada: ${notification.title} - Acción: ${action}`,
        oldData: { status: notification.status },
        newData: { action, processingDate, newStatus: updatedNotification.status },
      });

      res.json(updatedNotification);
    } catch (error) {
      if (process.env.NODE_ENV !== 'production') console.error('❌ Error processing notification:', error);
      res.status(500).json({ message: 'Failed to process notification' });
    }
  });

  // System users (protected - super_admin only)
  app.get('/api/system-users', isAuthenticated, async (req: any, res) => {
    if (process.env.NODE_ENV !== 'production') console.log('👥 System users request');
    try {
      const user = req.user;
      if (user?.role !== 'super_admin') {
        return res.status(403).json({ message: 'Solo el super admin puede ver usuarios del sistema' });
      }

      const users = await storage.getAllSystemUsers();
      res.json(users);
    } catch (error) {
      if (process.env.NODE_ENV !== 'production') console.error('❌ Error fetching system users:', error);
      res.status(500).json({ message: 'Failed to fetch system users' });
    }
  });

  app.post('/api/system-users', isAuthenticated, async (req: any, res) => {
    if (process.env.NODE_ENV !== 'production') console.log('➕ Create system user request');
    try {
      const user = req.user;
      if (user?.role !== 'super_admin') {
        return res.status(403).json({ message: 'Solo el super admin puede crear usuarios del sistema' });
      }

      const userData = req.body;
      const newUser = await storage.createSystemUser(userData);

      // Log audit
      await AuditService.logAction({
        userId: user.email,
        userRole: user.role,
        action: 'create_system_user',
        entityType: 'system_user',
        entityId: newUser.id.toString(),
        entityName: `${newUser.firstName} ${newUser.lastName}`,
        description: `Usuario del sistema creado: ${newUser.email}`,
        newData: { ...newUser, password: '[HIDDEN]' },
      });

      res.status(201).json(newUser);
    } catch (error) {
      if (process.env.NODE_ENV !== 'production') console.error('❌ Error creating system user:', error);
      res.status(500).json({ message: 'Failed to create system user' });
    }
  });

  app.put('/api/system-users/:id', isAuthenticated, async (req: any, res) => {
    if (process.env.NODE_ENV !== 'production') console.log('✏️ Update system user request');
    try {
      const user = req.user;
      if (user?.role !== 'super_admin') {
        return res.status(403).json({ message: 'Solo el super admin puede editar usuarios del sistema' });
      }

      const { id } = req.params;
      const userData = req.body;

      // Get old data for audit
      const oldUser = await storage.getSystemUser(parseInt(id));

      const updatedUser = await storage.updateSystemUser(parseInt(id), userData);

      // Log audit
      await AuditService.logAction({
        userId: user.email,
        userRole: user.role,
        action: 'update_system_user',
        entityType: 'system_user',
        entityId: updatedUser.id.toString(),
        entityName: `${updatedUser.firstName} ${updatedUser.lastName}`,
        description: `Usuario del sistema actualizado: ${updatedUser.email}`,
        oldData: oldUser,
        newData: { ...updatedUser, password: '[HIDDEN]' },
      });

      res.json(updatedUser);
    } catch (error) {
      if (process.env.NODE_ENV !== 'production') console.error('❌ Error updating system user:', error);
      res.status(500).json({ message: 'Failed to update system user' });
    }
  });

  app.delete('/api/system-users/:id', isAuthenticated, async (req: any, res) => {
    if (process.env.NODE_ENV !== 'production') console.log('🗑️ Delete system user request');
    try {
      const user = req.user;
      if (user?.role !== 'super_admin') {
        return res.status(403).json({ message: 'Solo el super admin puede eliminar usuarios del sistema' });
      }

      const { id } = req.params;

      // Get user data for audit
      const systemUser = await storage.getSystemUser(parseInt(id));
      if (!systemUser) {
        return res.status(404).json({ message: 'System user not found' });
      }

      // Prevent deletion of super admin
      if (systemUser.email === 'superadmin@glovo.com') {
        return res.status(403).json({ message: 'No se puede eliminar el super administrador' });
      }

      await storage.deleteSystemUser(parseInt(id));

      // Log audit
      await AuditService.logAction({
        userId: user.email,
        userRole: user.role,
        action: 'delete_system_user',
        entityType: 'system_user',
        entityId: systemUser.id.toString(),
        entityName: `${systemUser.firstName} ${systemUser.lastName}`,
        description: `Usuario del sistema eliminado: ${systemUser.firstName} ${systemUser.lastName} (${systemUser.email})`,
        oldData: systemUser,
      });

      res.status(204).send();
    } catch (error) {
      if (process.env.NODE_ENV !== 'production') console.error('❌ Error deleting system user:', error);
      res.status(500).json({ message: 'Failed to delete system user' });
    }
  });

  // Change system user password (protected - super_admin only)
  app.put('/api/system-users/:id/password', isAuthenticated, async (req: any, res) => {
    if (process.env.NODE_ENV !== 'production') console.log('🔑 Change system user password request');
    try {
      const user = req.user;
      if (user?.role !== 'super_admin') {
        return res.status(403).json({ message: 'Solo el super admin puede cambiar contraseñas' });
      }

      const { id } = req.params;
      const { password } = req.body;

      if (!password || password.length < 6) {
        return res.status(400).json({ message: 'La contraseña debe tener al menos 6 caracteres' });
      }

      // Get user data for audit
      const systemUser = await storage.getSystemUser(parseInt(id));
      if (!systemUser) {
        return res.status(404).json({ message: 'System user not found' });
      }

      // Hash the new password
      const bcrypt = await import('bcrypt');
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      // Update the password
      const updatedUser = await storage.updateSystemUserPassword(parseInt(id), hashedPassword);

      // Log audit
      await AuditService.logAction({
        userId: user.email,
        userRole: user.role,
        action: 'change_system_user_password',
        entityType: 'system_user',
        entityId: systemUser.id.toString(),
        entityName: `${systemUser.firstName} ${systemUser.lastName}`,
        description: `Contraseña cambiada para usuario: ${systemUser.firstName} ${systemUser.lastName} (${systemUser.email})`,
        oldData: systemUser,
        newData: { ...updatedUser, password: '[HIDDEN]' },
      });

      res.json({ message: 'Password updated successfully' });
    } catch (error) {
      if (process.env.NODE_ENV !== 'production') console.error('❌ Error changing system user password:', error);
      res.status(500).json({ message: 'Failed to change password' });
    }
  });

  // Audit logs (protected - super_admin only)
  app.get('/api/audit-logs', isAuthenticated, async (req: { user?: { role?: string }; query: { limit?: string } }, res) => {
    if (process.env.NODE_ENV !== 'production') console.log('📋 Audit logs request');
    try {
      const user = req.user;
      if (user?.role !== 'super_admin') {
        return res.status(403).json({ message: 'Solo el super admin puede ver logs de auditoría' });
      }

      const { limit = 1000 } = req.query;
      const logs = await storage.getAllAuditLogs(parseInt(limit.toString()));
      res.json(logs);
    } catch (error) {
      if (process.env.NODE_ENV !== 'production') console.error('❌ Error fetching audit logs:', error);
      res.status(500).json({ message: 'Failed to fetch audit logs' });
    }
  });

  app.get('/api/audit-logs/stats', isAuthenticated, async (req: { user?: { role?: string } }, res) => {
    if (process.env.NODE_ENV !== 'production') console.log('📊 Audit logs stats request');
    try {
      const user = req.user;
      if (user?.role !== 'super_admin') {
        return res.status(403).json({ message: 'Solo el super admin puede ver estadísticas de auditoría' });
      }

      const stats = await storage.getAuditLogsStats();
      res.json(stats);
    } catch (error) {
      if (process.env.NODE_ENV !== 'production') console.error('❌ Error fetching audit logs stats:', error);
      res.status(500).json({ message: 'Failed to fetch audit logs stats' });
    }
  });

  // Crear baja IT para un empleado específico
  app.post('/api/employees/:id/it-leave', isAuthenticated, async (req: any, res) => {
    if (process.env.NODE_ENV !== 'production') console.log('➕ Create IT leave for employee request');
    try {
      const user = req.user;
      if (user?.role === 'normal') {
        return res.status(403).json({ message: 'No tienes permisos para crear bajas IT' });
      }

      const { id } = req.params;
      const { fechaIncidencia } = req.body;
      const now = new Date();

      // Actualizar estado y fecha en employees
      const updatedEmployee = await storage.setEmployeeItLeave(id, fechaIncidencia);

      // Log audit
      await AuditService.logAction({
        userId: user.email,
        userRole: user.role,
        action: 'set_it_leave',
        entityType: 'employee',
        entityId: id,
        entityName: `${updatedEmployee?.nombre || ''} ${updatedEmployee?.apellido || ''}`,
        description: `Empleado marcado como baja IT (${id}) con fecha ${fechaIncidencia || now.toISOString()}`,
        newData: updatedEmployee,
      });

      res.status(200).json(updatedEmployee);
    } catch (error) {
      console.error('❌ Error setting IT leave:', error);
      res.status(500).json({ message: 'Failed to set IT leave' });
    }
  });

  // Create HTTP server
  const server = createServer(app);

  if (process.env.NODE_ENV !== 'production') console.log('✅ Routes setup completed');

  return server;
}
