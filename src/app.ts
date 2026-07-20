import express from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
import env from "./config/env";
import authRoutes from "./routes/auth.routes";
import googleAuthRoutes from "./routes/googleAuth.routes";
import uploadRoutes from "./routes/upload.routes";
import recipeRoutes from "./routes/recipe.routes";
import aiRoutes from "./routes/ai.routes";
import newsletterRoutes from "./routes/newsletter.routes";
import contactRoutes from "./routes/contact.routes";
import statsRoutes from "./routes/stats.routes";
import adminRoutes from "./routes/admin.routes";

const app = express();

// Allow multiple origins for CORS (local dev + production Vercel URLs)
const allowedOrigins = [
  env.CLIENT_URL,
  // Add your production client URL here once deployed, e.g.:
  // "https://cookmate-client.vercel.app",
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl, server-side)
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(null, true); // In production, set first arg to new Error("Not allowed") to block
      }
    },
    credentials: true,
  }),
);

app.use(express.json({ limit: "10mb" }));

// Global rate limiter
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { success: false, message: "Too many requests. Please try again later." },
});
app.use(globalLimiter);

// Stricter rate limiter for AI endpoints
const aiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { success: false, message: "Too many AI requests. Please try again later." },
});

app.get("/api/health", (_req, res) => {
  res.json({ success: true, message: "Server is running" });
});

app.use("/api/upload", uploadRoutes);
app.use("/api/recipes", recipeRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/auth", googleAuthRoutes);
app.use("/api/ai", aiLimiter, aiRoutes);
app.use("/api/newsletter", newsletterRoutes);
app.use("/api/contact", contactRoutes);
app.use("/api/stats", statsRoutes);
app.use("/api/admin", adminRoutes);

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

// Global error handler
app.use(
  (err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error("Unhandled error:", err.message);
    res.status(500).json({ success: false, message: "Internal server error" });
  },
);

export default app;