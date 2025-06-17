// Storage configuration for different environments
import { MemStorage } from "./storage.js";
import { PostgresStorage } from "./storage-postgres.js";

// Use in-memory storage for Replit development, PostgreSQL for local Docker
export const storage = process.env.NODE_ENV === "production" || process.env.USE_POSTGRES === "true" 
  ? new PostgresStorage() 
  : new MemStorage();

export * from "./storage.js";