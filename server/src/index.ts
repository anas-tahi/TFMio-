import express from "express";
import cors from "cors";
import { env } from "./config/env.js";
import { connectDB } from "./config/db.js";
import { errorHandler } from "./middleware/errorHandler.js";
import authRoutes from "./routes/auth.routes.js";

async function start() {
  await connectDB();

  const app = express();

  app.use(cors({ origin: env.clientUrl, credentials: true }));
  app.use(express.json());

  // Health check
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", service: "TFMio API", time: new Date().toISOString() });
  });

  // Routes
  app.use("/api/auth", authRoutes);
  // Phase 2 will add: /api/topics, /api/interests, /api/recommendations
  // Phase 3 will add: /api/works, /api/documents, /api/notifications

  // Error handler must be last
  app.use(errorHandler);

  app.listen(env.port, () => {
    console.log(`✓ TFMio API running on http://localhost:${env.port}`);
    console.log(`  Environment: ${env.nodeEnv}`);
  });
}

start().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
