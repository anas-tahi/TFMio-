import mongoose, { Schema, Document, Types } from "mongoose";
import { WorkType, TopicStatus } from "../types/index.js";

export interface ITopic extends Document {
  _id: Types.ObjectId;
  title: string;
  description: string;
  tutor: Types.ObjectId; // ref User (tutor)
  department: string;
  degrees: Types.ObjectId[]; // refs Degree — which titulación(es) this topic is open to
  type: WorkType; // TFM or TFG
  skills: string[]; // required/relevant skills
  totalSpots: number;
  status: TopicStatus;

  embedding?: number[]; // topic description embedding (feature #34)

  // ── Analytics (feature #16) ──
  viewCount: number;
  interestCount: number;
  matchCount: number;

  createdAt: Date;
  updatedAt: Date;
}

const topicSchema = new Schema<ITopic>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    tutor: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    department: { type: String, required: true },
    degrees: { type: [Schema.Types.ObjectId], ref: "Degree", required: true, index: true },
    type: { type: String, enum: Object.values(WorkType), required: true, index: true },
    skills: { type: [String], default: [] },
    totalSpots: { type: Number, default: 1 },
    status: { type: String, enum: Object.values(TopicStatus), default: TopicStatus.DRAFT, index: true },

    embedding: { type: [Number], default: undefined, select: false },

    viewCount: { type: Number, default: 0 },
    interestCount: { type: Number, default: 0 },
    matchCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

topicSchema.set("toJSON", {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  transform: (_doc, ret: any) => {
    delete ret.embedding;
    return ret;
  },
});

export const Topic = mongoose.model<ITopic>("Topic", topicSchema);
