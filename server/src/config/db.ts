import dns from "dns";
import mongoose from "mongoose";
import { env } from "./env.js";


dns.setServers(["8.8.8.8", "8.8.4.4"]);

export async function connectDB(): Promise<void> {
  try {
    mongoose.set("strictQuery", true);
    await mongoose.connect(env.mongoUri);
    console.log("✓ MongoDB connected");
  } catch (error) {
    console.error("✗ MongoDB connection failed:", error);
    process.exit(1);
  }
}

mongoose.connection.on("disconnected", () => {
  console.warn("⚠ MongoDB disconnected");
});