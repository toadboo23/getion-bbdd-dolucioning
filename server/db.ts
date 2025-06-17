import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../shared/schema.js";

// Database connection for local development
const databaseUrl = process.env.DATABASE_URL || "postgresql://postgres:password123@localhost:5432/employee_management";

// Create postgres client
const client = postgres(databaseUrl, {
  max: 20,
  idle_timeout: 20,
  connect_timeout: 60,
});

// Create drizzle database instance
export const db = drizzle(client, { schema });