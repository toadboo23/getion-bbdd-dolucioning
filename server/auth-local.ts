import session from "express-session";
import type { Express, RequestHandler } from "express";
import connectPg from "connect-pg-simple";
import { PostgresStorage } from "./storage-postgres.js";

const storage = new PostgresStorage();

// Users database with predefined users
const USERS_DB = {
  "superadmin@glovo.com": {
    id: "superadmin-001",
    email: "superadmin@glovo.com",
    firstName: "Super",
    lastName: "Admin",
    role: "super_admin" as const,
    password: "superadmin123"
  },
  "admin@glovo.com": {
    id: "admin-001", 
    email: "admin@glovo.com",
    firstName: "Admin",
    lastName: "User",
    role: "admin" as const,
    password: "admin123"
  },
  "user@glovo.com": {
    id: "user-001",
    email: "user@glovo.com", 
    firstName: "Normal",
    lastName: "User",
    role: "normal" as const,
    password: "user123"
  }
};

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: true,
    ttl: sessionTtl,
    tableName: "session",
  });
  
  return session({
    secret: process.env.SESSION_SECRET || "fallback-secret-key-for-dev",
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: false, // Set to true in production with HTTPS
      maxAge: sessionTtl,
    },
  });
}

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());
  
  console.log("🔐 Setting up authentication routes...");
  
  // LOGIN ROUTE - Enhanced to support database users
  app.post("/api/auth/login", async (req: any, res) => {
    console.log("📝 Login attempt:", { email: req.body.email, password: "***HIDDEN***" });
    
    try {
      const { email, password } = req.body;
      
      // Validate input
      if (!email || !password) {
        console.log("❌ Missing email or password");
        return res.status(400).json({ 
          error: "Email y contraseña son requeridos",
          success: false
        });
      }

      let userRecord = null;
      let isHardcodedUser = false;

      // First, check hardcoded users
      const hardcodedUser = USERS_DB[email as keyof typeof USERS_DB];
      if (hardcodedUser) {
        userRecord = hardcodedUser;
        isHardcodedUser = true;
        console.log("🔍 Found hardcoded user:", email);
      } else {
        // Check database users
        console.log("🔍 Checking database for user:", email);
        try {
          const dbUsers = await storage.getAllSystemUsers();
          const dbUser = dbUsers.find((u: any) => u.email === email && u.isActive);
          
          if (dbUser) {
            userRecord = {
              id: dbUser.id.toString(),
              email: dbUser.email,
              firstName: dbUser.firstName,
              lastName: dbUser.lastName,
              role: dbUser.role as "super_admin" | "admin" | "normal",
              password: dbUser.password
            };
            console.log("✅ Found database user:", email);
          }
        } catch (dbError) {
          console.error("❌ Database error while fetching user:", dbError);
        }
      }
      
      if (!userRecord) {
        console.log("❌ User not found:", email);
        return res.status(401).json({ 
          error: "Usuario no encontrado",
          success: false
        });
      }

      // Check password
      let passwordValid = false;
      if (isHardcodedUser) {
        passwordValid = userRecord.password === password;
      } else {
        // For database users, we need to check the hashed password
        // For now, comparing plain text (should be hashed in production)
        passwordValid = userRecord.password === password;
      }

      if (!passwordValid) {
        console.log("❌ Invalid password for:", email);
        return res.status(401).json({ 
          error: "Contraseña incorrecta",
          success: false
        });
      }

      // Create user data without password
      const userData = {
        id: userRecord.id,
        email: userRecord.email,
        firstName: userRecord.firstName,
        lastName: userRecord.lastName,
        role: userRecord.role
      };

      console.log("✅ Login successful for:", email);

      // Create or update user in database (only for hardcoded users)
      if (isHardcodedUser) {
        try {
          await storage.upsertUser(userData);
          console.log("✅ Hardcoded user stored in database");
        } catch (dbError) {
          console.error("⚠️ Database error (continuing anyway):", dbError);
        }
      }

      // Set session
      req.session.user = userData;
      
      res.json({ 
        success: true, 
        user: userData 
      });
    } catch (error) {
      console.error("🚨 Error during login:", error);
      res.status(500).json({ 
        error: "Error interno del servidor",
        success: false
      });
    }
  });

  // LOGOUT ROUTE
  app.post("/api/auth/logout", (req: any, res) => {
    console.log("👋 Logout request");
    req.session.destroy((err: any) => {
      if (err) {
        console.error("❌ Error destroying session:", err);
        return res.status(500).json({ error: "Error al cerrar sesión" });
      }
      res.json({ success: true });
    });
  });

  // GET USER INFO ROUTE
  app.get("/api/auth/user", (req: any, res) => {
    console.log("👤 Get user request, session user:", req.session?.user);
    
    if (!req.session?.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    res.json(req.session.user);
  });

  // GET ME ROUTE (alternative)
  app.get("/api/auth/me", (req: any, res) => {
    if (req.session?.user) {
      res.json(req.session.user);
    } else {
      res.status(401).json({ message: "No authenticated" });
    }
  });

  console.log("✅ Authentication routes set up successfully");
}

export const isAuthenticated: RequestHandler = async (req: any, res, next) => {
  if (!req.session?.user) {
    console.log("🚫 Authentication required, no session found");
    return res.status(401).json({ message: "Unauthorized" });
  }
  
  req.user = req.session.user;
  console.log("✅ User authenticated:", req.user.email);
  next();
};