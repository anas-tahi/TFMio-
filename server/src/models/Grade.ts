import mongoose, { Schema, Document, Types } from "mongoose";
import { RubricRole } from "../types/index.js";

interface ICriterionScore {
  name: string;
  points: number; // score given, out of the criterion's maxPoints
}

export interface IGrade extends Document {
  _id: Types.ObjectId;
  work: Types.ObjectId; // ref Work
  grader: Types.ObjectId; // ref User — the tutor or a specific jury member
  role: RubricRole; // which rubric this score used
  scores: ICriterionScore[];
  weightedScore: number; // this grader's total, 0–10, after applying criteria weights
  createdAt: Date;
  updatedAt: Date;
}

const criterionScoreSchema = new Schema<ICriterionScore>(
  {
    name: { type: String, required: true },
    points: { type: Number, required: true },
  },
  { _id: false }
);

const gradeSchema = new Schema<IGrade>(
  {
    work: { type: Schema.Types.ObjectId, ref: "Work", required: true, index: true },
    grader: { type: Schema.Types.ObjectId, ref: "User", required: true },
    role: { type: String, enum: Object.values(RubricRole), required: true },
    scores: { type: [criterionScoreSchema], default: [] },
    weightedScore: { type: Number, required: true },
  },
  { timestamps: true }
);

// One grade per grader per work — a person can't grade the same work twice
gradeSchema.index({ work: 1, grader: 1 }, { unique: true });

export const Grade = mongoose.model<IGrade>("Grade", gradeSchema);