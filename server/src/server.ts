import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/authRoutes";
import productRoutes from "./routes/productRoutes";
import couponRoutes from "./routes/couponRoutes";
import settingsRoutes from "./routes/settingRoutes";
import cartRoutes from "./routes/cartRoutes";
import addressRoutes from "./routes/addressRoutes";
import orderRoutes from "./routes/orderRoutes";
import wishlistRoutes from "./routes/wishlistRoutes";
import paypalRoutes from "./routes/paypalRoutes";

//load all your enviroment variables
dotenv.config();
const app = express();
const PORT = process.env.PORT || 3001;

const corsOptions = {
  origin: function (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // In development, allow all localhost origins
    if (process.env.NODE_ENV === "development") {
      if (origin.startsWith("http://localhost:") || origin.startsWith("http://127.0.0.1:")) {
        return callback(null, true);
      }
    }
    
    // Get allowed origins from environment variable or use defaults
    const allowedOriginsEnv = process.env.ALLOWED_ORIGINS;
    const allowedOrigins = allowedOriginsEnv 
      ? allowedOriginsEnv.split(",").map(origin => origin.trim())
      : [
          "http://localhost:3000",
          "http://localhost:3001",
          "http://localhost:3002",
          "http://localhost:3003",
          "http://localhost:3004",
          "http://localhost:3005",
        ];
    
    // Also allow any Vercel domain (for production deployments)
    const isVercelDomain = origin.includes(".vercel.app") || origin.includes("vercel.app");
    
    // Also allow any Render.com domain (for production deployments)
    const isRenderDomain = origin.includes(".onrender.com") || origin.includes("onrender.com");
    
    if (allowedOrigins.indexOf(origin) !== -1 || isVercelDomain || isRenderDomain) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser());

// Request logging middleware (development only)
if (process.env.NODE_ENV === "development") {
  app.use((req, res, next) => {
    if (req.path.startsWith("/api/paypal")) {
      console.log(`[${req.method}] ${req.path}`, {
        body: req.body,
        query: req.query,
      });
    }
    next();
  });
}

// Helper function to validate and fix DATABASE_URL for Supabase
function validateDatabaseUrl(): string | null {
  const databaseUrl = process.env.DATABASE_URL;
  const directUrl = process.env.DIRECT_URL;
  const isRender = process.env.RENDER || process.env.NODE_ENV === "production";
  
  if (!databaseUrl) {
    console.error("❌ DATABASE_URL environment variable is not set!");
    console.error("Please set DATABASE_URL in your Render environment variables.");
    process.exit(1);
  }

  // Check if it's a Supabase URL
  const isSupabase = databaseUrl.includes("supabase.co");
  
  if (isSupabase) {
    try {
      const url = new URL(databaseUrl);
      const port = parseInt(url.port || "5432");
      
      // Check if SSL mode is set for direct connections (port 5432)
      if (port === 5432) {
        // Check if running on Render (common issue: direct connections fail on Render)
        if (isRender) {
          console.error("❌ ERROR: DATABASE_URL is using direct connection (port 5432) on Render!");
          console.error("   Direct connections often fail on Render due to network restrictions.");
          console.error("   Even if this works locally, Render requires Connection Pooler for DATABASE_URL.");
          console.error("\n🔧 SOLUTION: Configure both URLs correctly in Render:");
          console.error("\n   1. DATABASE_URL (for queries) - Use Connection Pooler:");
          console.error("      • Go to Supabase Dashboard → Settings → Database → Connection Pooling");
          console.error("      • Select 'Session mode' → 'URI' format");
          console.error("      • Copy connection string (port 6543)");
          console.error("      • Ensure it includes ?pgbouncer=true");
          console.error("      • Example: postgresql://postgres.xxx:password@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true");
          console.error("\n   2. DIRECT_URL (for migrations) - Use Direct Connection:");
          console.error("      • Go to Supabase Dashboard → Settings → Database → Connection string");
          console.error("      • Select 'URI' format");
          console.error("      • Copy connection string (port 5432)");
          console.error("      • Ensure it includes ?sslmode=require");
          console.error("      • Example: postgresql://postgres:password@db.xxx.supabase.co:5432/postgres?sslmode=require");
          return null;
        }
        
        if (!databaseUrl.includes("sslmode=")) {
          console.error("❌ ERROR: DATABASE_URL is missing SSL mode parameter!");
          console.error("   Supabase direct connections (port 5432) require SSL.");
          console.error("   Add ?sslmode=require to your connection string.");
          console.error("   Example: postgresql://user:pass@host:5432/db?sslmode=require");
          console.error("\n💡 RECOMMENDATION: Use Connection Pooler instead (more reliable on Render)");
          console.error("   Use port 6543 with ?pgbouncer=true");
          console.error("   Example: postgresql://user:pass@host:6543/db?pgbouncer=true");
          return null;
        }
      }
      
      // Check if pgbouncer is set for connection pooler (port 6543)
      if (port === 6543 && !databaseUrl.includes("pgbouncer=")) {
        console.warn("⚠️  WARNING: DATABASE_URL is missing pgbouncer parameter!");
        console.warn("   For Supabase connection pooler (port 6543), add ?pgbouncer=true");
        console.warn("   Example: postgresql://user:pass@host:6543/db?pgbouncer=true");
      }
      
      // Validate DIRECT_URL if set
      if (directUrl) {
        try {
          const directUrlObj = new URL(directUrl);
          const directPort = parseInt(directUrlObj.port || "5432");
          
          if (directPort === 5432 && !directUrl.includes("sslmode=")) {
            console.warn("⚠️  WARNING: DIRECT_URL is missing SSL mode parameter!");
            console.warn("   Add ?sslmode=require to DIRECT_URL for migrations.");
          }
          
          // On Render, recommend pooler for DATABASE_URL and direct for DIRECT_URL
          if (isRender && port === 6543 && directPort === 5432) {
            console.log("✅ Good configuration: DATABASE_URL uses pooler, DIRECT_URL uses direct connection");
          }
        } catch (error) {
          console.warn("⚠️  WARNING: DIRECT_URL format may be invalid");
        }
      } else if (isRender && port === 6543) {
        console.warn("⚠️  WARNING: DIRECT_URL is not set. Migrations may fail.");
        console.warn("   Set DIRECT_URL to direct connection (port 5432) with ?sslmode=require");
      }
    } catch (error) {
      console.error("❌ ERROR: Invalid DATABASE_URL format!");
      console.error("   Please check your connection string in Render environment variables.");
      return null;
    }
  }
  
  return databaseUrl;
}

// Validate DATABASE_URL before initializing Prisma
const validatedUrl = validateDatabaseUrl();
if (!validatedUrl) {
  console.error("\n🔧 Fix your DATABASE_URL in Render dashboard:");
  console.error("   1. Go to your Render service → Environment tab");
  console.error("   2. Update DATABASE_URL with proper SSL parameters");
  console.error("   3. Recommended: Use Connection Pooler (port 6543) with ?pgbouncer=true");
  process.exit(1);
}

// Initialize Prisma Client with connection pooling support
export const prisma = new PrismaClient({
  log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  errorFormat: "pretty",
});

// Test database connection on startup with retry logic
async function connectToDatabase(retries = 3, delay = 2000): Promise<void> {
  for (let i = 0; i < retries; i++) {
    try {
      await prisma.$connect();
      console.log("✅ Successfully connected to database");
      return;
    } catch (error: any) {
      const errorMessage = error.message || String(error);
      console.error(`❌ Failed to connect to database (attempt ${i + 1}/${retries}):`, errorMessage);
      
      if (i < retries - 1) {
        console.log(`⏳ Retrying in ${delay / 1000} seconds...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      
      // Final attempt failed
      console.error("\n🔍 Troubleshooting steps:");
      console.error("1. Verify DATABASE_URL is set correctly in Render dashboard");
      console.error("2. For Supabase direct connection (port 5432), ensure URL includes: ?sslmode=require");
      console.error("3. For Supabase connection pooler (port 6543), ensure URL includes: ?pgbouncer=true");
      console.error("4. Check that your Supabase database is running and accessible");
      console.error("5. Verify network/firewall settings allow connections from Render");
      
      if (errorMessage.includes("Can't reach database server") || errorMessage.includes("timeout") || errorMessage.includes("ECONNREFUSED")) {
        const dbUrl = process.env.DATABASE_URL || "";
        if (dbUrl.includes("supabase.co")) {
          console.error("\n💡 Supabase Connection String Solutions:");
          console.error("\n   Option 1: Connection Pooler (RECOMMENDED for Render):");
          console.error("   postgresql://postgres.xxx:password@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true");
          console.error("\n   Option 2: Direct Connection (if pooler doesn't work):");
          console.error("   postgresql://postgres:password@db.xxx.supabase.co:5432/postgres?sslmode=require");
          console.error("\n   How to get the correct connection string:");
          console.error("   1. Go to Supabase Dashboard → Settings → Database");
          console.error("   2. For pooler: Use 'Connection Pooling' → Session mode → URI");
          console.error("   3. For direct: Use 'Connection string' → URI");
          console.error("   4. Make sure to add the required parameters (?pgbouncer=true or ?sslmode=require)");
          console.error("\n   ⚠️  IMPORTANT: Direct connections (port 5432) often fail on Render.");
          console.error("   Use Connection Pooler (port 6543) for better reliability.");
        }
      }
      
      // Don't exit in production - let the server start and retry on first request
      if (process.env.NODE_ENV === "production") {
        console.warn("⚠️  Server will start but database operations may fail. Fix DATABASE_URL and restart.");
      } else {
        process.exit(1);
      }
    }
  }
}

connectToDatabase();

app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/coupon", couponRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/address", addressRoutes);
app.use("/api/order", orderRoutes);
app.use("/api/wishlist", wishlistRoutes);
app.use("/api/paypal", paypalRoutes);

app.get("/", (req, res) => {
  res.send("Hello from E-Commerce backend");
});

app.listen(PORT, () => {
  console.log(`Server is now running on port ${PORT}`);
});

process.on("SIGINT", async () => {
  await prisma.$disconnect();
  process.exit();
});
