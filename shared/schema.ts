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
  date,
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

// Users table (required for Replit Auth)
export const users = pgTable("users", {
  id: varchar("id", { length: 255 }).primaryKey(),
  email: varchar("email", { length: 255 }).unique().notNull(),
  firstName: varchar("firstName", { length: 255 }).notNull(),
  lastName: varchar("lastName", { length: 255 }).notNull(),
  role: varchar("role", { length: 50 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Employees table (active employees)
export const employees = pgTable("employees", {
  idGlovo: varchar("id_glovo", { length: 50 }).primaryKey(),
  emailGlovo: varchar("email_glovo", { length: 100 }).unique(),
  turno: varchar("turno", { length: 50 }),
  nombre: varchar("nombre", { length: 100 }).notNull(),
  apellido: varchar("apellido", { length: 100 }),
  telefono: varchar("telefono", { length: 30 }),
  email: varchar("email", { length: 100 }),
  horas: integer("horas"),
  complementaries: text("complementaries"),
  ciudad: varchar("ciudad", { length: 100 }),
  cityCode: varchar("citycode", { length: 30 }),
  dniNie: varchar("dni_nie", { length: 30 }),
  iban: varchar("iban", { length: 34 }),
  direccion: varchar("direccion", { length: 255 }),
  vehiculo: varchar("vehiculo", { length: 50 }),
  naf: varchar("naf", { length: 30 }),
  fechaAltaSegSoc: date("fecha_alta_seg_soc"),
  statusBaja: varchar("status_baja", { length: 100 }),
  estadoSs: varchar("estado_ss", { length: 100 }),
  informadoHorario: boolean("informado_horario").default(false),
  cuentaDivilo: varchar("cuenta_divilo", { length: 100 }),
  proximaAsignacionSlots: date("proxima_asignacion_slots"),
  jefeTrafico: varchar("jefe_trafico", { length: 100 }),
  comentsJefeDeTrafico: text("coments_jefe_de_trafico"),
  incidencias: text("incidencias"),
  fechaIncidencia: date("fecha_incidencia"),
  faltasNoCheckInEnDias: integer("faltas_no_check_in_en_dias").default(0),
  cruce: text("cruce"),
  status: varchar("status", { 
    enum: ["active", "it_leave", "company_leave_pending", "company_leave_approved"] 
  }).notNull().default("active"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Company leaves table (employees with approved company leaves) - BAJA EMPRESA
export const companyLeaves = pgTable("company_leaves", {
  id: serial("id").primaryKey(),
  employeeId: varchar("employee_id", { length: 50 }).notNull(),
  employeeData: jsonb("employee_data").notNull(),
  leaveType: varchar("leave_type", { length: 100 }).notNull(),
  leaveDate: date("leave_date").notNull(),
  leaveRequestedAt: timestamp("leave_requested_at").notNull(),
  leaveRequestedBy: varchar("leave_requested_by", { length: 255 }).notNull(),
  approvedBy: varchar("approved_by", { length: 255 }),
  approvedAt: timestamp("approved_at"),
  status: varchar("status", { length: 50 }).notNull().default("approved"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// IT leaves table
export const itLeaves = pgTable("it_leaves", {
  id: serial("id").primaryKey(),
  employeeId: varchar("employee_id", { length: 50 }).notNull().references(() => employees.idGlovo),
  leaveType: varchar("leave_type", { enum: ["enfermedad", "accidente"] }).notNull(),
  leaveDate: timestamp("leave_date").notNull(),
  requestedAt: timestamp("requested_at").defaultNow(),
  requestedBy: varchar("requested_by").notNull(),
  approvedAt: timestamp("approved_at"),
  approvedBy: varchar("approved_by"),
  status: varchar("status", { enum: ["pending", "approved", "rejected"] }).notNull().default("pending"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Notifications table
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  type: varchar("type", { enum: ["company_leave_request", "employee_update", "bulk_upload"] }).notNull(),
  title: varchar("title").notNull(),
  message: text("message").notNull(),
  requestedBy: varchar("requested_by").notNull(),
  status: varchar("status", { enum: ["pending", "approved", "rejected", "processed"] }).notNull().default("pending"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// System users table (for user management by super admin)
export const systemUsers = pgTable("system_users", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 255 }).unique().notNull(),
  firstName: varchar("first_name", { length: 100 }).notNull(),
  lastName: varchar("last_name", { length: 100 }).notNull(),
  password: varchar("password", { length: 255 }).notNull(), // Hashed password
  role: varchar("role", { enum: ["super_admin", "admin", "normal"] }).notNull(),
  isActive: boolean("is_active").default(true),
  createdBy: varchar("created_by", { length: 255 }).notNull(), // Email of creator
  lastLogin: timestamp("last_login"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Audit logs table (for tracking all admin/super_admin actions)
export const auditLogs = pgTable("audit_logs", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id", { length: 255 }).notNull(), // Email of user performing action
  userRole: varchar("user_role", { enum: ["super_admin", "admin"] }).notNull(),
  action: varchar("action", { length: 100 }).notNull(), // create_employee, edit_employee, delete_employee, etc.
  entityType: varchar("entity_type", { length: 50 }).notNull(), // employee, user, notification, etc.
  entityId: varchar("entity_id", { length: 255 }), // ID of affected entity
  entityName: varchar("entity_name", { length: 255 }), // Name/description for easy reading
  description: text("description").notNull(), // Human readable description
  oldData: jsonb("old_data"), // Previous state (for updates)
  newData: jsonb("new_data"), // New state (for creates/updates)
  ipAddress: varchar("ip_address", { length: 45 }), // User's IP
  userAgent: text("user_agent"), // Browser info
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  // Indexes for performance
  index("idx_audit_user_id").on(table.userId),
  index("idx_audit_action").on(table.action),
  index("idx_audit_entity_type").on(table.entityType),
  index("idx_audit_created_at").on(table.createdAt),
]);

// Schema exports for validation
export const upsertUserSchema = createInsertSchema(users);
export const insertEmployeeSchema = z.object({
  // Campos requeridos
  idGlovo: z.string().min(1, "ID Glovo es requerido"),
  nombre: z.string().min(1, "Nombre es requerido"),
  telefono: z.string().min(1, "Teléfono es requerido"),
  // Campos opcionales simplificados
  emailGlovo: z.string().optional(),
  turno: z.string().optional(),
  apellido: z.string().optional(),
  email: z.string().optional(),
  horas: z.coerce.number().optional(),
  complementaries: z.string().optional(),
  ciudad: z.string().optional(),
  cityCode: z.string().optional(),
  dniNie: z.string().optional(),
  iban: z.string().optional(),
  direccion: z.string().optional(),
  vehiculo: z.string().optional(),
  naf: z.string().optional(),
  fechaAltaSegSoc: z.string().optional(),
  statusBaja: z.string().optional(),
  estadoSs: z.string().optional(),
  informadoHorario: z.boolean().optional(),
  cuentaDivilo: z.string().optional(),
  proximaAsignacionSlots: z.string().optional(),
  jefeTrafico: z.string().optional(),
  comentsJefeDeTrafico: z.string().optional(),
  incidencias: z.string().optional(),
  fechaIncidencia: z.string().optional(),
  faltasNoCheckInEnDias: z.coerce.number().optional(),
  cruce: z.string().optional(),
  status: z.enum(["active", "it_leave", "company_leave_pending", "company_leave_approved"]).optional(),
});

export const updateEmployeeSchema = insertEmployeeSchema.partial();
export const insertCompanyLeaveSchema = createInsertSchema(companyLeaves).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export const insertItLeaveSchema = createInsertSchema(itLeaves).omit({
  id: true,
  createdAt: true,
});
export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// System users schemas
export const insertSystemUserSchema = createInsertSchema(systemUsers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  lastLogin: true,
});

export const updateSystemUserSchema = insertSystemUserSchema.partial().omit({
  createdBy: true,
});

// Audit logs schema
export const insertAuditLogSchema = createInsertSchema(auditLogs).omit({
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
export type SystemUser = typeof systemUsers.$inferSelect;
export type InsertSystemUser = z.infer<typeof insertSystemUserSchema>;
export type UpdateSystemUser = z.infer<typeof updateSystemUserSchema>;
export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = z.infer<typeof insertAuditLogSchema>;
