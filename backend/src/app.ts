import express from "express";
import cors from "cors";
import { clerkMiddleware } from "@clerk/express";

import { prisma } from "./config/db";

import multerRoutes from "./routes/multerRoutes";
import resumeAnalysisRoutes from "./routes/resumeAnalysisRoutes";
import webhookRoutes from "./routes/webhookRoutes";

const app = express();

// Middlewares
const allowedOrigins = process.env.FRONTEND_URL
  ? process.env.FRONTEND_URL.split(",")
  : ["http://localhost:5173", "http://localhost:3000"];

app.use((req, res, next) => {
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like server-to-server or tools like curl)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      // Same-origin requests (frontend and API on the same Vercel domain)
      const host = (req.headers["x-forwarded-host"] as string) || req.headers.host;
      try {
        if (host && new URL(origin).host === host) return callback(null, true);
      } catch {}
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })(req, res, next);
});
app.use(
  express.json({
    verify: (req: any, res, buf) => {
      req.rawBody = buf;
    },
  })
);
app.use(clerkMiddleware());

// API Routes
app.use("/api/resume", multerRoutes);
app.use("/api/analyze", resumeAnalysisRoutes);
app.use("/api/webhooks", webhookRoutes);
// Health Check Route
app.get("/health", async (req, res) => {
  let dbStatus = "unknown";
  try {
    await prisma.$queryRaw`SELECT 1`;
    dbStatus = "connected";
  } catch (error: any) {
    dbStatus = `disconnected: ${error.message || error}`;
  }

  const isHealthy = dbStatus === "connected";

  res.status(isHealthy ? 200 : 500).json({
    status: isHealthy ? "ok" : "error",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: dbStatus,
  });
});

export default app;
