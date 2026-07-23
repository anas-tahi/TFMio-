import mongoose, { Schema, Document, Types } from "mongoose";
import { InterestStatus } from "../types/index.js";

export interface IInterest extends Document {
  _id: Types.ObjectId;
  student: Types.ObjectId; // ref User (student)
  topic: Types.ObjectId; // ref Topic
  tutor: Types.ObjectId; // ref User (tutor) — denormalized for quick queries
  status: InterestStatus;
  matchScore?: number; // cosine similarity at time of interest (0–100)
  aiMatchSummary?: string; // LLM explanation shown to tutor (feature #36)
  studentNote?: string; // optional message from student
  createdAt: Date;
  updatedAt: Date;
}

const interestSchema = new Schema<IInterest>(
  {
    student: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    topic: { type: Schema.Types.ObjectId, ref: "Topic", required: true, index: true },
    tutor: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    status: { type: String, enum: Object.values(InterestStatus), default: InterestStatus.PENDING, index: true },
    matchScore: { type: Number },
    aiMatchSummary: { type: String },
    studentNote: { type: String },
  },
  { timestamps: true }
);

// A student can only express interest in a topic once
interestSchema.index({ student: 1, topic: 1 }, { unique: true });

export const Interest = mongoose.model<IInterest>("Interest", interestSchema);
