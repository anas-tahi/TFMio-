import mongoose, { Schema, Document, Types } from "mongoose";
import { ProposalStatus, WorkType } from "../types/index.js";

export interface ITopicProposal extends Document {
  _id: Types.ObjectId;
  student: Types.ObjectId; // ref User
  tutor: Types.ObjectId; // ref User
  title: string;
  description: string;
  type: WorkType;
  status: ProposalStatus;
  revisionNote?: string; // tutor's note when requesting changes
  revisionCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const topicProposalSchema = new Schema<ITopicProposal>(
  {
    student: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    tutor: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    type: { type: String, enum: Object.values(WorkType), required: true },
    status: {
      type: String,
      enum: Object.values(ProposalStatus),
      default: ProposalStatus.PENDING,
      index: true,
    },
    revisionNote: { type: String, trim: true },
    revisionCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const TopicProposal = mongoose.model<ITopicProposal>("TopicProposal", topicProposalSchema);