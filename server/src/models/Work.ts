import mongoose, { Schema, Document, Types } from "mongoose";
import { WorkType, WorkStage, CoordinatorDecision, TutorFinalDecision } from "../types/index.js";

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
  released?: boolean; // true once the coordinator has published the grade to the student
  releasedAt?: Date | null;
}

interface IGradingAlerts {
  reminderSentAt?: Date; // when the "please grade" reminder went to the people still missing
  overdueSentAt?: Date; // when the coordinator was told who missed the deadline
}

interface IMissingGrader {
  grader: Types.ObjectId; // ref User
  name: string; // their name at the time, so the record stays readable
}

/** Written when the coordinator closes a grade without everyone's evaluation. */
interface IGradeClosure {
  closedAt?: Date;
  closedBy?: Types.ObjectId; // ref User (the coordinator)
  reason?: string;
  missing?: IMissingGrader[];
  receivedCount?: number; // how many evaluations the final grade was calculated from
}

export interface IWork extends Document {
  _id: Types.ObjectId;
  student: Types.ObjectId; // ref User
  tutor: Types.ObjectId; // ref User
  topic: Types.ObjectId; // ref Topic
  type: WorkType;
  stage: WorkStage;
  approvedByCoordinator: boolean;
  coordinatorDecision: CoordinatorDecision;
  coordinatorNote?: string;
  tutorFinalDecision: TutorFinalDecision;

  defense: IDefense;
  grade: IGrade;
  gradingAlerts?: IGradingAlerts;
  gradingExtraDays?: number; // extra days the coordinator gave graders for this work
  gradeClosure?: IGradeClosure;

  matchedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const missingGraderSchema = new Schema<IMissingGrader>(
  {
    grader: { type: Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String, required: true },
  },
  { _id: false }
);

const workSchema = new Schema<IWork>(
  {
    student: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    tutor: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    topic: { type: Schema.Types.ObjectId, ref: "Topic", required: true },
    type: { type: String, enum: Object.values(WorkType), required: true, index: true },
    stage: { type: String, enum: Object.values(WorkStage), default: WorkStage.MATCHED, index: true },
    approvedByCoordinator: { type: Boolean, default: false },
    coordinatorDecision: {
      type: String,
      enum: Object.values(CoordinatorDecision),
      default: CoordinatorDecision.PENDING,
      index: true,
    },
    coordinatorNote: { type: String, trim: true },
    tutorFinalDecision: {
      type: String,
      enum: Object.values(TutorFinalDecision),
      default: TutorFinalDecision.PENDING,
      index: true,
    },

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
      released: { type: Boolean, default: false },
      releasedAt: { type: Date },
    },

    gradingAlerts: {
      reminderSentAt: { type: Date },
      overdueSentAt: { type: Date },
    },

    gradingExtraDays: { type: Number, min: 0 },

    gradeClosure: {
      closedAt: { type: Date },
      closedBy: { type: Schema.Types.ObjectId, ref: "User" },
      reason: { type: String },
      missing: { type: [missingGraderSchema], default: undefined },
      receivedCount: { type: Number },
    },

    matchedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export const Work = mongoose.model<IWork>("Work", workSchema);