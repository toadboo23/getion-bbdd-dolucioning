import session from "express-session";
import type { Express, RequestHandler } from "express";
import connectPg from "connect-pg-simple";
import bcrypt from "bcrypt";
import { PostgresStorage } from "./storage-postgres.js";

const storage = new PostgresStorage();

// NOTE: For production, all authentication is done through database users only
// No hardcoded users for security reasons

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
    secret: process.env.SESSION_SECRET || "solucioning_session_secret_2027_ultra_secure",
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // Enable HTTPS in production
      maxAge: sessionTtl,
      sameSite: 'strict', // CSRF protection
    },
  });
}

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());
  
  console.log("🔐 Setting up authentication routes...");
  
  // LOGIN ROUTE - Enhanced to support database users
  app.post("/api/auth/login", async (req: any, res) => {
    console.log("📝 Login attempt:", { email: req.body.email, password: req.body.password });
    
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

      // Check database users only (secure production approach)
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
        return res.status(500).json({ 
          error: "Error interno del servidor",
          success: false
        });
      }
      
      if (!userRecord) {
        console.log("❌ User not found:", email);
        return res.status(401).json({ 
          error: "Usuario no encontrado",
          success: false
        });
      }

      // LOG: Mostrar password recibido y hash guardado
      console.log("🔑 Password recibido:", password);
      console.log("🔒 Hash guardado:", userRecord.password);

      // Check password using bcrypt (all passwords are hashed in production)
      let passwordValid = false;
      try {
        passwordValid = await bcrypt.compare(password, userRecord.password);
        console.log("🔍 Resultado bcrypt.compare:", passwordValid);
      } catch (bcryptError) {
        console.error("❌ Bcrypt error:", bcryptError);
        passwordValid = false;
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

      // Update last login timestamp in database
      try {
        await storage.updateSystemUserLastLogin(parseInt(userRecord.id));
      } catch (dbError) {
        console.error("⚠️ Could not update last login (continuing anyway):", dbError);
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