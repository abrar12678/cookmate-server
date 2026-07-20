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
  message: {
    success: false,
    message: "Too many requests. Please try again later.",
  },
});
app.use(globalLimiter);

// Stricter rate limiter for AI endpoints
const aiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: {
    success: false,
    message: "Too many AI requests. Please try again later.",
  },
});

// Root route — shows a friendly status page for direct URL visits
app.get("/", (_req, res) => {
  res.set("Content-Type", "text/html");
  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>CookMate API</title>
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{font-family:'Segoe UI',system-ui,-apple-system,sans-serif;background:#0f172a;color:#e2e8f0;min-height:100vh;display:flex;align-items:center;justify-content:center}
    .card{background:#1e293b;border-radius:16px;padding:48px 40px;max-width:480px;width:90%;text-align:center;box-shadow:0 25px 50px rgba(0,0,0,.4)}
    .icon{font-size:56px;margin-bottom:16px}
    h1{font-size:28px;color:#f8fafc;margin-bottom:8px}
    p{color:#94a3b8;font-size:15px;line-height:1.6;margin-bottom:24px}
    .badge{display:inline-block;background:#22c55e22;color:#4ade80;font-size:13px;font-weight:600;padding:6px 16px;border-radius:20px;margin-bottom:24px}
    .endpoint{background:#0f172a;border-radius:10px;padding:16px;text-align:left;margin-bottom:12px;font-family:'Fira Code',monospace;font-size:13px}
    .endpoint span{color:#64748b;display:block;font-size:11px;margin-bottom:4px}
    .endpoint code{color:#38bdf8;word-break:break-all}
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">🍳</div>
    <div class="badge">● All Systems Operational</div>
    <h1>CookMate API Server</h1>
    <p>Backend API is live and serving requests.<br/>Use the endpoints below to interact.</p>
    <div class="endpoint"><span>GET</span><code>/api/recipes</code></div>
    <div class="endpoint"><span>GET</span><code>/api/health</code></div>
    <div class="endpoint"><span>POST</span><code>/api/auth/register</code></div>
    <div class="endpoint"><span>POST</span><code>/api/auth/login</code></div>
  </div>
</body>
</html>`);
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
  (
    err: Error,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction,
  ) => {
    console.error("Unhandled error:", err.message);
    res.status(500).json({ success: false, message: "Internal server error" });
  },
);

export default app;
