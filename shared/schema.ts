import {
  pgTable,
  text,
  varchar,
  timestamp,
  jsonb,
  index,
  serial,
  integer,
  boolean,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table (required for Replit Auth)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table (required for Replit Auth)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: varchar("role", { enum: ["super_admin", "admin", "normal"] }).notNull().default("admin"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Employees table (active employees)
export const employees = pgTable("employees", {
  id: serial("id").primaryKey(),
  firstName: varchar("first_name").notNull(),
  lastName: varchar("last_name").notNull(),
  email: varchar("email").notNull().unique(),
  phone: varchar("phone").notNull(),
  position: varchar("position").notNull(),
  city: varchar("city").notNull(),
  status: varchar("status", { enum: ["active", "it_leave", "company_leave"] }).notNull().default("active"),
  profileImageUrl: varchar("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Company leaves table (employees with approved company leaves)
export const companyLeaves = pgTable("company_leaves", {
  id: serial("id").primaryKey(),
  employeeId: integer("employee_id").notNull(),
  firstName: varchar("first_name").notNull(),
  lastName: varchar("last_name").notNull(),
  email: varchar("email").notNull(),
  phone: varchar("phone").notNull(),
  position: varchar("position").notNull(),
  city: varchar("city").notNull(),
  leaveType: varchar("leave_type", { enum: ["despido", "voluntaria", "nspp", "anulacion"] }).notNull(),
  leaveDate: timestamp("leave_date").notNull(),
  approvedAt: timestamp("approved_at").defaultNow(),
  approvedBy: varchar("approved_by").notNull(),
});

// IT leaves table
export const itLeaves = pgTable("it_leaves", {
  id: serial("id").primaryKey(),
  employeeId: integer("employee_id").notNull(),
  leaveType: varchar("leave_type", { enum: ["enfermedad", "accidente"] }).notNull(),
  leaveDate: timestamp("leave_date").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  createdBy: varchar("created_by").notNull(),
});

// Notifications table
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  type: varchar("type", { enum: ["company_leave_request", "employee_update", "bulk_upload"] }).notNull(),
  title: varchar("title").notNull(),
  message: text("message").notNull(),
  employeeId: integer("employee_id"),
  employeeName: varchar("employee_name"),
  requestedBy: varchar("requested_by").notNull(),
  status: varchar("status", { enum: ["pending", "approved", "rejected", "processed"] }).notNull().default("pending"),
  metadata: jsonb("metadata"), // Additional data like leave type, changes made, etc.
  createdAt: timestamp("created_at").defaultNow(),
});

// Schema exports for validation
export const upsertUserSchema = createInsertSchema(users);
export const insertEmployeeSchema = createInsertSchema(employees).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export const updateEmployeeSchema = insertEmployeeSchema.partial();
export const insertCompanyLeaveSchema = createInsertSchema(companyLeaves).omit({
  id: true,
  approvedAt: true,
});
export const insertItLeaveSchema = createInsertSchema(itLeaves).omit({
  id: true,
  createdAt: true,
});
export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true,
});

// Type exports
export type UpsertUser = z.infer<typeof upsertUserSchema>;
export type User = typeof users.$inferSelect;
export type Employee = typeof employees.$inferSelect;
export type InsertEmployee = z.infer<typeof insertEmployeeSchema>;
export type UpdateEmployee = z.infer<typeof updateEmployeeSchema>;
export type CompanyLeave = typeof companyLeaves.$inferSelect;
export type InsertCompanyLeave = z.infer<typeof insertCompanyLeaveSchema>;
export type ItLeave = typeof itLeaves.$inferSelect;
export type InsertItLeave = z.infer<typeof insertItLeaveSchema>;
export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
