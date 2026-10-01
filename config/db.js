import mongoose from "mongoose";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure backend/.env is loaded
dotenv.config({ path: path.resolve(__dirname, "../.env") });

let isConnected = false;
let mongodInstance = null;

// Helper to normalize Atlas URI so it targets gormenswear database
export const normalizeAtlasUri = (rawUri, targetDb = "gormenswear") => {
  if (!rawUri) return "";
  let uri = rawUri.trim();

  if (uri.startsWith("mongodb+srv://") || uri.includes("mongodb.net")) {
    const parts = uri.split("?");
    let base = parts[0].replace(/\/+$/, "");
    const query = parts[1] ? `?${parts[1]}` : "?retryWrites=true&w=majority";

    const slashIdx = base.indexOf(".mongodb.net");
    if (slashIdx !== -1) {
      const afterHost = base.slice(slashIdx + ".mongodb.net".length);
      if (!afterHost || afterHost === "" || afterHost === "/test") {
        base = base.slice(0, slashIdx + ".mongodb.net".length) + `/${targetDb}`;
      }
    }
    return `${base}${query}`;
  }
  return uri;
};

// Safe logger that hides credentials
export const safeLogUri = (uri) => {
  if (!uri) return "None";
  return uri.replace(/\/\/([^:]+):([^@]+)@/, "//***:***@");
};

export const connectDB = async () => {
  if (mongoose.connection.readyState === 1) {
    isConnected = true;
    return true;
  }

  // Ensure fresh env is read
  dotenv.config({ path: path.resolve(__dirname, "../.env") });
  const rawUri = process.env.MONGODB_URI;

  // 1. If an Atlas URI is configured:
  const isAtlas = rawUri && (rawUri.startsWith("mongodb+srv://") || rawUri.includes("mongodb.net"));

  if (isAtlas) {
    const atlasUri = normalizeAtlasUri(rawUri, "gormenswear");
    console.log(`Connecting to MongoDB Atlas at: ${safeLogUri(atlasUri)}...`);

    try {
      const conn = await mongoose.connect(atlasUri, {
        serverSelectionTimeoutMS: 10000,
      });
      isConnected = conn.connection.readyState === 1;
      console.log(`✅ MongoDB Atlas connected successfully`);
      console.log(`📡 Database: ${conn.connection.name}`);
      return true;
    } catch (err) {
      console.error(`❌ MongoDB Atlas Connection Error: ${err.message}`);

      // Detailed diagnosis
      if (err.message.includes("bad auth") || err.message.includes("AuthenticationFailed")) {
        console.error("  👉 Diagnosis: Invalid database username or password in Atlas URI. Check backend/.env.");
      } else if (err.message.includes("querySrv ENOTFOUND") || err.message.includes("ENOTFOUND")) {
        console.error("  👉 Diagnosis: Cluster hostname not found. Verify the cluster address in Atlas URI.");
      } else if (
        err.message.includes("ServerSelectionError") ||
        err.message.includes("timed out") ||
        err.message.includes("ETIMEDOUT")
      ) {
        console.error("  👉 Diagnosis: Connection timed out. In MongoDB Atlas Dashboard → Network Access, verify that IP 0.0.0.0/0 (or your current IP) is allowed.");
      }

      // DO NOT silently fall back to local MongoDB when an Atlas URI is present
      isConnected = false;
      return false;
    }
  }

  // 2. If non-Atlas URI explicitly provided:
  if (rawUri && rawUri.trim() && !rawUri.includes("127.0.0.1") && !rawUri.includes("localhost")) {
    try {
      console.log(`Connecting to MongoDB: ${safeLogUri(rawUri)}...`);
      const conn = await mongoose.connect(rawUri, {
        serverSelectionTimeoutMS: 5000,
      });
      isConnected = conn.connection.readyState === 1;
      console.log(`✅ MongoDB connected: ${conn.connection.host}/${conn.connection.name}`);
      return true;
    } catch (err) {
      console.error(`❌ MongoDB Connection Error (${safeLogUri(rawUri)}): ${err.message}`);
      isConnected = false;
      return false;
    }
  }

  // 3. Fallback ONLY when MONGODB_URI is genuinely missing or explicitly local:
  const localUri = rawUri || "mongodb://127.0.0.1:27017/gormenswear";
  try {
    const conn = await mongoose.connect(localUri, {
      serverSelectionTimeoutMS: 2000,
    });
    isConnected = conn.connection.readyState === 1;
    console.log(`✅ MongoDB Connected to running local instance: ${conn.connection.host}/${conn.connection.name}`);
    return true;
  } catch (err) {
    // Port 27017 not currently listening
  }

  // Embedded storage fallback
  try {
    const { MongoMemoryServer } = await import("mongodb-memory-server");
    const dataDir = path.resolve(__dirname, "../data/db");
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    console.log(`⚡ Starting persistent MongoDB server with disk storage at: ${dataDir}...`);
    mongodInstance = await MongoMemoryServer.create({
      instance: {
        port: 27017,
        dbPath: dataDir,
        storageEngine: "wiredTiger",
        dbName: "gormenswear",
      },
    });

    const baseUri = mongodInstance.getUri();
    const uri = baseUri.replace(/\/test\/?$/, "").replace(/\/+$/, "") + "/gormenswear";
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
    });

    isConnected = conn.connection.readyState === 1;
    console.log(`✅ Persistent MongoDB Connected: ${conn.connection.host}/${conn.connection.name}`);
    return true;
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    isConnected = false;
    return false;
  }
};

export const closeDB = async () => {
  try {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    if (mongodInstance) {
      await mongodInstance.stop();
      mongodInstance = null;
    }
    isConnected = false;
    console.log("MongoDB connection closed cleanly.");
  } catch (err) {
    console.error("Error closing MongoDB connection:", err.message);
  }
};

export const isDbConnected = () => {
  return mongoose.connection.readyState === 1;
};

export const getDbProvider = () => {
  const uri = process.env.MONGODB_URI || "";
  if (uri.startsWith("mongodb+srv://") || uri.includes("mongodb.net")) {
    return "MongoDB Atlas";
  }
  return "Local MongoDB";
};

export default connectDB;
