import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import morgan from "morgan";
import mongoose from "mongoose";
import { connectDB, isDbConnected, closeDB, getDbProvider } from "./config/db.js";
import productRoutes from "./routes/products.js";
import categoryRoutes from "./routes/categories.js";
import authRoutes from "./routes/auth.js";
import { notFound, errorHandler } from "./middleware/errorMiddleware.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const CORS_ORIGIN = process.env.CORS_ORIGIN || "http://localhost:3000";

const DEFAULT_ALLOWED = [
  "https://gormenswear-frontend.vercel.app",
  "http://localhost:3000",
  "http://localhost:3001",
];

const ALLOWED_ORIGINS = [
  ...DEFAULT_ALLOWED,
  ...(CORS_ORIGIN || "").split(",").map((o) => o.trim()).filter(Boolean),
];

// CORS configuration
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow server-to-server (no origin) and localhost/Vercel origins
      if (!origin) return callback(null, true);
      if (
        origin.startsWith("http://localhost:") ||
        origin.startsWith("http://127.0.0.1:") ||
        origin.endsWith(".vercel.app") ||
        ALLOWED_ORIGINS.includes(origin)
      ) {
        return callback(null, true);
      }
      return callback(new Error(`CORS: Origin ${origin} not allowed`));
    },
    credentials: true,
  })
);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

if (process.env.NODE_ENV !== "production") {
  app.use(morgan("dev"));
}

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    database: isDbConnected() ? "connected" : "disconnected",
    provider: getDbProvider(),
    service: "GOR MENSWEAR API",
    version: "1.0.0",
  });
});

// Mount Routes
app.use("/api/products", productRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/auth", authRoutes);

// Error Handling
app.use(notFound);
app.use(errorHandler);

// Start server after connecting to MongoDB
let server = null;
const startServer = async () => {
  await connectDB();

  server = app.listen(PORT, () => {
    console.log(`🚀 GOR MENSWEAR Backend running on port ${PORT}`);
    console.log(`📡 Health Check: http://localhost:${PORT}/api/health`);
    console.log(`📦 Products API: http://localhost:${PORT}/api/products`);
    console.log(`🏷️  Categories API: http://localhost:${PORT}/api/categories`);
  });
};

const gracefulShutdown = async () => {
  console.log("Shutting down GOR MENSWEAR Backend gracefully...");
  if (server) {
    server.close(async () => {
      await closeDB();
      process.exit(0);
    });
  } else {
    await closeDB();
    process.exit(0);
  }
};

process.on("SIGINT", gracefulShutdown);
process.on("SIGTERM", gracefulShutdown);

process.on("unhandledRejection", (err) => {
  console.error("Unhandled Rejection:", err.message);
});

startServer();

export default app;
