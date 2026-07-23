import mongoose, { Schema, Document, Types } from "mongoose";
import { UserRole } from "../types/index.js";

export interface IUser extends Document {
  _id: Types.ObjectId;
  email: string;
  password: string;
  fullName: string;
  role: UserRole;

  // ── Student-specific fields ──
  degree?: Types.ObjectId; // ref Degree — the student's own titulación
  year?: number;
  skills?: string[];
  interests?: string;
  workStyle?: string;
  aiSummary?: string; // LLM-generated profile summary (feature #03)
  embedding?: number[]; // profile embedding vector (feature #33)

  // ── Tutor-specific fields ──
  department?: string;
  bio?: string;
  degrees?: Types.ObjectId[]; // refs Degree — a tutor can supervise across several titulaciones

  // ── Coordinator-specific fields ──
  degreeManaged?: Types.ObjectId; // ref Degree — the ONE titulación this coordinator is scoped to (feature #32)

  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    fullName: { type: String, required: true, trim: true },
    role: { type: String, enum: Object.values(UserRole), required: true },

    // Student
    degree: { type: Schema.Types.ObjectId, ref: "Degree" },
    year: { type: Number },
    skills: { type: [String], default: undefined },
    interests: { type: String },
    workStyle: { type: String },
    aiSummary: { type: String },
    embedding: { type: [Number], default: undefined, select: false },

    // Tutor
    department: { type: String },
    bio: { type: String },
    degrees: { type: [Schema.Types.ObjectId], ref: "Degree", default: undefined },

    // Coordinator — scoped to exactly one degree, per Miguel's feedback
    degreeManaged: { type: Schema.Types.ObjectId, ref: "Degree" },
  },
  { timestamps: true }
);

userSchema.set("toJSON", {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  transform: (_doc, ret: any) => {
    delete ret.password;
    delete ret.embedding;
    return ret;
  },
});

export const User = mongoose.model<IUser>("User", userSchema);
