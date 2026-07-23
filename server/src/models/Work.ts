import mongoose, { Schema, Document, Types } from "mongoose";
import { WorkType, WorkStage } from "../types/index.js";

interface IDefense {
  date?: Date;
  time?: string;
  room?: string;
  jury?: Types.ObjectId[]; // refs User (tutors acting as jury)
}

interface IGrade {
  memoryScore?: number; // 0–10
  defenseScore?: number; // 0–10
  reportScore?: number; // 0–10
  finalGrade?: number; // computed weighted grade
  gradedAt?: Date;
}

export interface IWork extends Document {
  _id: Types.ObjectId;
  student: Types.ObjectId; // ref User
  tutor: Types.ObjectId; // ref User
  topic: Types.ObjectId; // ref Topic
  type: WorkType;
  stage: WorkStage;
  approvedByCoordinator: boolean;

  defense: IDefense;
  grade: IGrade;

  matchedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const workSchema = new Schema<IWork>(
  {
    student: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    tutor: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    topic: { type: Schema.Types.ObjectId, ref: "Topic", required: true },
    type: { type: String, enum: Object.values(WorkType), required: true, index: true },
    stage: { type: String, enum: Object.values(WorkStage), default: WorkStage.MATCHED, index: true },
    approvedByCoordinator: { type: Boolean, default: false },

    defense: {
      date: { type: Date },
      time: { type: String },
      room: { type: String },
      jury: [{ type: Schema.Types.ObjectId, ref: "User" }],
    },

    grade: {
      memoryScore: { type: Number },
      defenseScore: { type: Number },
      reportScore: { type: Number },
      finalGrade: { type: Number },
      gradedAt: { type: Date },
    },

    matchedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export const Work = mongoose.model<IWork>("Work", workSchema);
