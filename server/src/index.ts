import express from "express";
import cors from "cors";
import { env } from "./config/env.js";
import { connectDB } from "./config/db.js";
import { errorHandler } from "./middleware/errorHandler.js";
import authRoutes from "./routes/auth.routes.js";
import studentRoutes from "./routes/student.routes.js";
import topicRoutes from "./routes/topic.routes.js";
import degreeRoutes from "./routes/degree.routes.js";
import recommendationRoutes from "./routes/recommendation.routes.js";
import interestRoutes from "./routes/interest.routes.js";

async function start() {
  await connectDB();

  const app = express();

  app.use(cors({ origin: env.clientUrl, credentials: true }));
  app.use(express.json());

  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", service: "TFMio API", time: new Date().toISOString() });
  });

  app.use("/api/auth", authRoutes);
  app.use("/api/students", studentRoutes);
  app.use("/api/topics", topicRoutes);
  app.use("/api/degrees", degreeRoutes);
  app.use("/api/recommendations", recommendationRoutes);
  app.use("/api/interests", interestRoutes);
  // Phase 3 will add: /api/works, /api/documents, /api/notifications

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