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
import coordinatorRoutes from "./routes/coordinator.routes.js";
import notificationRoutes from "./routes/notification.routes.js";
import proposalRoutes from "./routes/proposal.routes.js";
import tutorDecisionRoutes from "./routes/tutorDecision.routes.js";
import messageRoutes from "./routes/message.routes.js";
import historyRoutes from "./routes/history.routes.js";
import reportRoutes from "./routes/report.routes.js";
import documentRoutes from "./routes/document.routes.js";
import defenseRoutes from "./routes/defense.routes.js";
import rubricRoutes from "./routes/rubric.routes.js";
import gradeRoutes from "./routes/grade.routes.js";

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
  app.use("/api/coordinator", coordinatorRoutes);
  app.use("/api/notifications", notificationRoutes);
  app.use("/api/proposals", proposalRoutes);
  app.use("/api/final-decisions", tutorDecisionRoutes);
  app.use("/api/messages", messageRoutes);
  app.use("/api/history", historyRoutes);
  app.use("/api/reports", reportRoutes);
  app.use("/api/documents", documentRoutes);
  app.use("/api/defense", defenseRoutes);
  app.use("/api/rubrics", rubricRoutes);
  app.use("/api/grades", gradeRoutes);

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