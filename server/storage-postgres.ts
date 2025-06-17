import { eq, like, sql } from "drizzle-orm";
import { db } from "./db.js";
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
} from "../shared/schema.js";
import { IStorage } from "./storage.js";

export class PostgresStorage implements IStorage {
  // User operations (required for Replit Auth)
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Employee operations
  async getAllEmployees(): Promise<Employee[]> {
    return await db.select().from(employees).orderBy(employees.createdAt);
  }

  async getEmployee(id: number): Promise<Employee | undefined> {
    const [employee] = await db.select().from(employees).where(eq(employees.id, id));
    return employee;
  }

  async createEmployee(employeeData: InsertEmployee): Promise<Employee> {
    const [employee] = await db.insert(employees).values(employeeData).returning();
    return employee;
  }

  async updateEmployee(id: number, employeeData: UpdateEmployee): Promise<Employee> {
    const [employee] = await db
      .update(employees)
      .set({ ...employeeData, updatedAt: new Date() })
      .where(eq(employees.id, id))
      .returning();
    return employee;
  }

  async deleteEmployee(id: number): Promise<void> {
    await db.delete(employees).where(eq(employees.id, id));
  }

  async getEmployeesByCity(city: string): Promise<Employee[]> {
    return await db.select().from(employees).where(eq(employees.city, city));
  }

  async searchEmployees(query: string): Promise<Employee[]> {
    return await db
      .select()
      .from(employees)
      .where(
        sql`LOWER(${employees.firstName}) LIKE ${`%${query.toLowerCase()}%`} OR 
            LOWER(${employees.lastName}) LIKE ${`%${query.toLowerCase()}%`} OR 
            LOWER(${employees.email}) LIKE ${`%${query.toLowerCase()}%`}`
      );
  }

  async getEmployeesByStatus(status: string): Promise<Employee[]> {
    return await db.select().from(employees).where(eq(employees.status, status));
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
    const [leave] = await db.insert(itLeaves).values(leaveData).returning();
    return leave;
  }

  // Notification operations
  async getAllNotifications(): Promise<Notification[]> {
    return await db.select().from(notifications).orderBy(notifications.createdAt);
  }

  async createNotification(notificationData: InsertNotification): Promise<Notification> {
    const [notification] = await db.insert(notifications).values(notificationData).returning();
    return notification;
  }

  async updateNotificationStatus(id: number, status: string): Promise<Notification> {
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

  // Dashboard metrics
  async getDashboardMetrics() {
    const allEmployees = await this.getAllEmployees();
    const activeEmployees = allEmployees.filter(emp => emp.status === "active");
    const itLeaveEmployees = allEmployees.filter(emp => emp.status === "it_leave");
    const allNotifications = await this.getAllNotifications();
    const pendingNotifications = allNotifications.filter(notif => notif.status === "pending");
    
    // Group employees by city
    const cityGroups = allEmployees.reduce((acc, emp) => {
      const city = emp.city || "Sin ciudad";
      if (!acc[city]) acc[city] = 0;
      acc[city]++;
      return acc;
    }, {} as Record<string, number>);
    
    const employeesByCity = Object.entries(cityGroups).map(([city, count]) => ({
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

  // Bulk operations for replacing entire employee database
  async clearAllEmployees(): Promise<void> {
    console.log("Clearing all employees from PostgreSQL database");
    await db.delete(employees);
  }

  async bulkCreateEmployees(employeeDataList: InsertEmployee[]): Promise<Employee[]> {
    console.log("Bulk creating employees in PostgreSQL:", employeeDataList.length);
    const createdEmployees = await db.insert(employees).values(employeeDataList).returning();
    console.log("Bulk operation completed. Total employees:", createdEmployees.length);
    return createdEmployees;
  }
}