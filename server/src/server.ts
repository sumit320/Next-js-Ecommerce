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

// Initialize Prisma Client with connection pooling support
export const prisma = new PrismaClient({
  log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  errorFormat: "pretty",
});

// Test database connection on startup
prisma.$connect()
  .then(() => {
    console.log("✅ Successfully connected to database");
  })
  .catch((error) => {
    console.error("❌ Failed to connect to database:", error.message);
    console.error("Please check your DATABASE_URL environment variable");
    if (error.message.includes("Can't reach database server")) {
      console.error("\n💡 For Supabase, make sure you're using:");
      console.error("   - Connection pooler URL (port 6543) with ?pgbouncer=true");
      console.error("   - Or direct URL (port 5432) with ?sslmode=require");
    }
  });

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
