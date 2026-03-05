import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import pinoHttp from "pino-http";

import { logger } from "./lib/logger.js";
import { pushLogLine } from "./lib/logBuffer.js";
import authRoutes from "./routes/auth.routes.js";
import userRoutes from "./routes/user.routes.js";
import problemRoutes from "./routes/problem.routes.js";
import submissionRoutes from "./routes/submission.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import announcementRoutes from "./routes/announcement.routes.js";
import { openApiSpec } from "./openapi.js";

const app = express();
const PORT = process.env.PORT || 4000;

// ─── Logging Middleware (ต้องอยู่บนสุด) ─────────────
app.use(
  (pinoHttp as unknown as typeof pinoHttp.default)({
    logger,
    serializers: {
      req(req) {
        return {
          method: req.method,
          url: req.url,
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
    customSuccessMessage(req, res) {
      return `${req.method} ${req.url} ${res.statusCode}`;
    },
    customErrorMessage(req, res, err) {
      return `${req.method} ${req.url} ${res.statusCode} error`;
    },
  })
);

app.use((req, res, next) => {
  res.on("finish", () => {
    const user = (req as express.Request & { user?: { email?: string; userId?: string; role?: string } }).user;
    const userStr = user?.email ?? "(anonymous)";
    const iso = new Date().toISOString();
    const line = `${iso}\t${userStr}\t${req.method}\t${req.url}\t${res.statusCode}`;
    pushLogLine(line);
  });
  next();
});

// ─── Security Middleware ───────────────────────────────────────
app.use(helmet());
app.use(
    cors({
        origin: "http://localhost:5173", // Vite dev server
        credentials: true, // อนุญาต cookies
    })
);

// ─── Body Parsing ──────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ─── Routes ───────────────────────────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/problems", problemRoutes);
app.use("/api/submissions", submissionRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/announcements", announcementRoutes);

// ─── OpenAPI / Swagger JSON ───────────────────────────────────
app.get("/api-docs/openapi.json", (_req, res) => {
  res.json(openApiSpec);
});

// ─── Health Check ─────────────────────────────────────────────
app.get("/health", (_req, res) => {
    res.json({ status: "OK", timestamp: new Date().toISOString() });
});

// ─── Start Server ─────────────────────────────────────────────
app.listen(PORT, () => {
    logger.info(`Server running on http://localhost:${PORT}`)
});

export default app;
