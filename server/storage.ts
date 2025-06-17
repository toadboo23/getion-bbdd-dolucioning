import {
  users,
  employees,
  companyLeaves,
  itLeaves,
  notifications,
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
} from "@shared/schema";

// Interface for storage operations
export interface IStorage {
  // User operations (required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Employee operations
  getAllEmployees(): Promise<Employee[]>;
  getEmployee(id: number): Promise<Employee | undefined>;
  createEmployee(employee: InsertEmployee): Promise<Employee>;
  updateEmployee(id: number, employee: UpdateEmployee): Promise<Employee>;
  deleteEmployee(id: number): Promise<void>;
  getEmployeesByCity(city: string): Promise<Employee[]>;
  searchEmployees(query: string): Promise<Employee[]>;
  getEmployeesByStatus(status: string): Promise<Employee[]>;
  
  // Company leave operations
  getAllCompanyLeaves(): Promise<CompanyLeave[]>;
  createCompanyLeave(leave: InsertCompanyLeave): Promise<CompanyLeave>;
  
  // IT leave operations
  getAllItLeaves(): Promise<ItLeave[]>;
  createItLeave(leave: InsertItLeave): Promise<ItLeave>;
  
  // Notification operations
  getAllNotifications(): Promise<Notification[]>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  updateNotificationStatus(id: number, status: string): Promise<Notification>;
  deleteNotification(id: number): Promise<void>;
  
  // Dashboard metrics
  getDashboardMetrics(): Promise<{
    totalEmployees: number;
    activeEmployees: number;
    itLeaves: number;
    pendingActions: number;
    employeesByCity: { city: string; count: number }[];
  }>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User> = new Map();
  private employees: Map<number, Employee> = new Map();
  private companyLeaves: Map<number, CompanyLeave> = new Map();
  private itLeaves: Map<number, ItLeave> = new Map();
  private notifications: Map<number, Notification> = new Map();
  private currentEmployeeId = 1;
  private currentCompanyLeaveId = 1;
  private currentItLeaveId = 1;
  private currentNotificationId = 1;

  constructor() {
    // Initialize with sample data for demonstration
    this.initializeSampleData();
  }

  private initializeSampleData() {
    // Sample employees
    const sampleEmployees: (InsertEmployee & { id: number })[] = [
      {
        id: 1,
        firstName: "María",
        lastName: "García López",
        email: "maria.garcia@empresa.com",
        phone: "+34 612 345 678",
        position: "Desarrolladora Senior",
        city: "Madrid",
        status: "active",
        profileImageUrl: "https://images.unsplash.com/photo-1494790108755-2616b612b5bc?w=100&h=100&fit=crop&crop=face"
      },
      {
        id: 2,
        firstName: "Carlos",
        lastName: "López Martín",
        email: "carlos.lopez@empresa.com",
        phone: "+34 678 901 234",
        position: "Project Manager",
        city: "Barcelona",
        status: "it_leave",
        profileImageUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face"
      },
      {
        id: 3,
        firstName: "Ana",
        lastName: "Martínez Silva",
        email: "ana.martinez@empresa.com",
        phone: "+34 654 321 987",
        position: "UX Designer",
        city: "Valencia",
        status: "active",
        profileImageUrl: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=100&h=100&fit=crop&crop=face"
      },
      {
        id: 4,
        firstName: "Pedro",
        lastName: "Sánchez Ruiz",
        email: "pedro.sanchez@empresa.com",
        phone: "+34 698 123 456",
        position: "Backend Developer",
        city: "Sevilla",
        status: "active",
        profileImageUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face"
      }
    ];

    sampleEmployees.forEach(emp => {
      const employee = {
        ...emp,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      this.employees.set(emp.id, employee);
    });
    this.currentEmployeeId = 5;

    // Sample notifications
    const sampleNotifications: (InsertNotification & { id: number })[] = [
      {
        id: 1,
        type: "company_leave_request",
        title: "Solicitud de Baja Empresa",
        message: "Pedro Sánchez Ruiz ha solicitado una baja voluntaria",
        employeeId: 4,
        employeeName: "Pedro Sánchez Ruiz",
        requestedBy: "Ana Martínez",
        status: "pending",
        metadata: { leaveType: "voluntaria", leaveDate: "2024-03-15" }
      },
      {
        id: 2,
        type: "employee_update",
        title: "Actualización de Datos",
        message: "María García López - Dirección y teléfono actualizados",
        employeeId: 1,
        employeeName: "María García López",
        requestedBy: "Juan Pérez",
        status: "processed",
        metadata: { changes: ["dirección", "teléfono"] }
      }
    ];

    sampleNotifications.forEach(notif => {
      const notification = {
        ...notif,
        createdAt: new Date()
      };
      this.notifications.set(notif.id, notification);
    });
    this.currentNotificationId = 3;
  }

  // User operations
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const user: User = {
      id: userData.id!,
      email: userData.email || null,
      firstName: userData.firstName || null,
      lastName: userData.lastName || null,
      profileImageUrl: userData.profileImageUrl || null,
      role: userData.role || "normal",
      createdAt: userData.createdAt || new Date(),
      updatedAt: new Date()
    };
    this.users.set(user.id, user);
    return user;
  }

  // Employee operations
  async getAllEmployees(): Promise<Employee[]> {
    return Array.from(this.employees.values()).sort((a, b) => a.id - b.id);
  }

  async getEmployee(id: number): Promise<Employee | undefined> {
    return this.employees.get(id);
  }

  async createEmployee(employeeData: InsertEmployee): Promise<Employee> {
    const id = this.currentEmployeeId++;
    const employee: Employee = {
      id,
      ...employeeData,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.employees.set(id, employee);
    return employee;
  }

  async updateEmployee(id: number, employeeData: UpdateEmployee): Promise<Employee> {
    const existing = this.employees.get(id);
    if (!existing) throw new Error("Employee not found");
    
    const updated: Employee = {
      ...existing,
      ...employeeData,
      updatedAt: new Date()
    };
    this.employees.set(id, updated);
    return updated;
  }

  async deleteEmployee(id: number): Promise<void> {
    this.employees.delete(id);
  }

  async getEmployeesByCity(city: string): Promise<Employee[]> {
    return Array.from(this.employees.values()).filter(emp => 
      emp.city.toLowerCase() === city.toLowerCase()
    );
  }

  async searchEmployees(query: string): Promise<Employee[]> {
    const searchTerm = query.toLowerCase();
    return Array.from(this.employees.values()).filter(emp =>
      emp.firstName.toLowerCase().includes(searchTerm) ||
      emp.lastName.toLowerCase().includes(searchTerm) ||
      emp.email.toLowerCase().includes(searchTerm) ||
      emp.phone.includes(searchTerm)
    );
  }

  async getEmployeesByStatus(status: string): Promise<Employee[]> {
    return Array.from(this.employees.values()).filter(emp => emp.status === status);
  }

  // Company leave operations
  async getAllCompanyLeaves(): Promise<CompanyLeave[]> {
    return Array.from(this.companyLeaves.values());
  }

  async createCompanyLeave(leaveData: InsertCompanyLeave): Promise<CompanyLeave> {
    const id = this.currentCompanyLeaveId++;
    const leave: CompanyLeave = {
      id,
      ...leaveData,
      approvedAt: new Date()
    };
    this.companyLeaves.set(id, leave);
    
    // Remove employee from active employees
    this.employees.delete(leaveData.employeeId);
    
    return leave;
  }

  // IT leave operations
  async getAllItLeaves(): Promise<ItLeave[]> {
    return Array.from(this.itLeaves.values());
  }

  async createItLeave(leaveData: InsertItLeave): Promise<ItLeave> {
    const id = this.currentItLeaveId++;
    const leave: ItLeave = {
      id,
      ...leaveData,
      createdAt: new Date()
    };
    this.itLeaves.set(id, leave);
    
    // Update employee status
    const employee = this.employees.get(leaveData.employeeId);
    if (employee) {
      await this.updateEmployee(leaveData.employeeId, { status: "it_leave" });
    }
    
    return leave;
  }

  // Notification operations
  async getAllNotifications(): Promise<Notification[]> {
    return Array.from(this.notifications.values()).sort((a, b) => 
      b.createdAt!.getTime() - a.createdAt!.getTime()
    );
  }

  async createNotification(notificationData: InsertNotification): Promise<Notification> {
    const id = this.currentNotificationId++;
    const notification: Notification = {
      id,
      ...notificationData,
      createdAt: new Date()
    };
    this.notifications.set(id, notification);
    return notification;
  }

  async updateNotificationStatus(id: number, status: string): Promise<Notification> {
    const existing = this.notifications.get(id);
    if (!existing) throw new Error("Notification not found");
    
    const updated: Notification = {
      ...existing,
      status: status as any
    };
    this.notifications.set(id, updated);
    return updated;
  }

  async deleteNotification(id: number): Promise<void> {
    this.notifications.delete(id);
  }

  // Dashboard metrics
  async getDashboardMetrics() {
    const allEmployees = await this.getAllEmployees();
    const activeEmployees = allEmployees.filter(emp => emp.status === "active");
    const itLeaveEmployees = allEmployees.filter(emp => emp.status === "it_leave");
    const pendingNotifications = Array.from(this.notifications.values()).filter(n => n.status === "pending");

    // Count employees by city
    const cityCount = allEmployees.reduce((acc, emp) => {
      acc[emp.city] = (acc[emp.city] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const employeesByCity = Object.entries(cityCount).map(([city, count]) => ({
      city,
      count
    }));

    return {
      totalEmployees: allEmployees.length,
      activeEmployees: activeEmployees.length,
      itLeaves: itLeaveEmployees.length,
      pendingActions: pendingNotifications.length,
      employeesByCity
    };
  }
}

export const storage = new MemStorage();
