import mongoose, { Schema, Document, Types } from "mongoose";
import { WorkType } from "../types/index.js";
import { MIN_GRADING_DAYS, MAX_GRADING_DAYS } from "../config/gradingDeadline.js";

export interface IDegree extends Document {
  _id: Types.ObjectId;
  name: string; // e.g. "Máster en Ingeniería Informática"
  shortName: string; // e.g. "MII"
  school: string; // e.g. "ETSIIT"
  level: WorkType; // TFM (máster) or TFG (grado) — which kind of work this degree produces
  coordinator?: Types.ObjectId; // ref User (the coordinator scoped to this degree)

  // ── Academic calendar, set by the coordinator ──
  matchingDeadline?: Date; // students must have chosen a tutor/topic by this date
  submissionDeadline?: Date; // final memoria must be submitted by this date
  presentationPeriodStart?: Date; // defense window opens
  presentationPeriodEnd?: Date; // defense window closes
  gradingDays?: number; // days the tutor and the committee have, after the defense, to grade

  createdAt: Date;
  updatedAt: Date;
}

const degreeSchema = new Schema<IDegree>(
  {
    name: { type: String, required: true, trim: true },
    shortName: { type: String, required: true, trim: true, unique: true },
    school: { type: String, required: true, default: "ETSIIT" },
    level: { type: String, enum: Object.values(WorkType), required: true },
    coordinator: { type: Schema.Types.ObjectId, ref: "User" },

    matchingDeadline: { type: Date },
    submissionDeadline: { type: Date },
    presentationPeriodStart: { type: Date },
    presentationPeriodEnd: { type: Date },
    // No default on purpose: a degree that never saved it answers with the
    // default of config/gradingDeadline through normalizeGradingDays.
    gradingDays: { type: Number, min: MIN_GRADING_DAYS, max: MAX_GRADING_DAYS },
  },
  { timestamps: true }
);

export const Degree = mongoose.model<IDegree>("Degree", degreeSchema);