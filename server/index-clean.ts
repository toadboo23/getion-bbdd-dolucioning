import express from "express";
import { registerRoutes } from "./routes-clean.js";
import { PostgresStorage } from "./storage-postgres.js";

const app = express();
const PORT = process.env.PORT || 5173;

// Enhanced logging
console.log("🔥 Starting Employee Management System Server...");
console.log("📍 Port:", PORT);
console.log("🌍 Environment:", process.env.NODE_ENV || "development");

// Manual CORS configuration (more reliable than cors package)
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Credentials", "true");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization, Cookie");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  
  if (req.method === "OPTIONS") {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`🌐 ${timestamp} - ${req.method} ${req.path}`);
  
  // Log request body for POST requests (excluding sensitive data)
  if (req.method === 'POST' && req.body) {
    const logBody = { ...req.body };
    if (logBody.password) {
      logBody.password = '***HIDDEN***';
    }
    console.log(`📝 Request body:`, logBody);
  }
  
  next();
});

// Initialize database and users
async function initializeSystem() {
  try {
    console.log("🗄️ Initializing database connection...");
    const storage = new PostgresStorage();
    
    // Initialize default users
    console.log("👥 Initializing default users...");
    
    const defaultUsers = [
      {
        id: "superadmin-001",
        email: "superadmin@glovo.com",
        firstName: "Super",
        lastName: "Admin",
        role: "super_admin" as const
      },
      {
        id: "admin-001",
        email: "admin@glovo.com",
        firstName: "Admin",
        lastName: "User",
        role: "admin" as const
      },
      {
        id: "user-001",
        email: "user@glovo.com",
        firstName: "Normal",
        lastName: "User",
        role: "normal" as const
      }
    ];

    for (const user of defaultUsers) {
      try {
        await storage.upsertUser(user);
        console.log(`✅ User initialized: ${user.email}`);
      } catch (error) {
        console.error(`❌ Error initializing user ${user.email}:`, error);
      }
    }

    console.log("🎯 System initialization completed");
  } catch (error) {
    console.error("🚨 Error during system initialization:", error);
    console.log("⚠️ Continuing anyway...");
  }
}

// Register routes and start server
async function startServer() {
  try {
    console.log("🛠️ Registering routes...");
    const httpServer = await registerRoutes(app);
    
    await initializeSystem();
    
    httpServer.listen(PORT, "0.0.0.0", () => {
      console.log("\n🚀 Server running on http://localhost:" + PORT);
      console.log("📊 Available users:");
      console.log("   - Super Admin: superadmin@glovo.com / superadmin123");
      console.log("   - Admin: admin@glovo.com / admin123");
      console.log("   - User: user@glovo.com / user123");
      console.log("\n🔗 API Endpoints:");
      console.log("   - Health: GET /api/health");
      console.log("   - Login: POST /api/auth/login");
      console.log("   - User Info: GET /api/auth/user");
      console.log("   - Logout: POST /api/auth/logout");
      console.log("   - Dashboard: GET /api/dashboard/metrics");
      console.log("   - Employees: GET /api/employees");
      console.log("\n✨ Ready to accept connections!");
    });

  } catch (error) {
    console.error("💥 Failed to start server:", error);
    process.exit(1);
  }
}

// Error handling
process.on('uncaughtException', (error) => {
  console.error('💥 Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
});

// Start the server
startServer().catch((error) => {
  console.error("💥 Server startup failed:", error);
  process.exit(1);
});