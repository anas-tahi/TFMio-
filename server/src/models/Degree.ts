import mongoose, { Schema, Document, Types } from "mongoose";
import { WorkType } from "../types/index.js";

export interface IDegree extends Document {
  _id: Types.ObjectId;
  name: string; // e.g. "Máster en Ingeniería Informática"
  shortName: string; // e.g. "MII"
  school: string; // e.g. "ETSIIT"
  level: WorkType; // TFM (máster) or TFG (grado) — which kind of work this degree produces
  coordinator?: Types.ObjectId; // ref User (the coordinator scoped to this degree)
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
  },
  { timestamps: true }
);

export const Degree = mongoose.model<IDegree>("Degree", degreeSchema);
