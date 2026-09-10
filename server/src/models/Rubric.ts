import mongoose, { Schema, Document, Types } from "mongoose";
import { RubricRole } from "../types/index.js";

interface ICriterion {
  name: string;
  maxPoints: number;
  weight: number; // 0–1, how much this criterion counts within the rubric
}

export interface IRubric extends Document {
  _id: Types.ObjectId;
  degree: Types.ObjectId; // ref Degree — rubrics are defined per degree
  role: RubricRole; // tutor or jury — each has its own rubric
  criteria: ICriterion[];
  roleWeight: number; // 0–1, how much this role's score counts in the final grade
  createdAt: Date;
  updatedAt: Date;
}

const criterionSchema = new Schema<ICriterion>(
  {
    name: { type: String, required: true, trim: true },
    maxPoints: { type: Number, required: true, default: 10 },
    weight: { type: Number, required: true, default: 1 },
  },
  { _id: false }
);

const rubricSchema = new Schema<IRubric>(
  {
    degree: { type: Schema.Types.ObjectId, ref: "Degree", required: true, index: true },
    role: { type: String, enum: Object.values(RubricRole), required: true },
    criteria: { type: [criterionSchema], default: [] },
    roleWeight: { type: Number, required: true, default: 0.5 },
  },
  { timestamps: true }
);

// One rubric per role per degree
rubricSchema.index({ degree: 1, role: 1 }, { unique: true });

export const Rubric = mongoose.model<IRubric>("Rubric", rubricSchema);