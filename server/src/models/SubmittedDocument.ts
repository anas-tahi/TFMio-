import mongoose, { Schema, Document, Types } from "mongoose";
import { DocumentType, DocumentStatus } from "../types/index.js";

export interface ISubmittedDocument extends Document {
  _id: Types.ObjectId;
  work: Types.ObjectId; // ref Work
  student: Types.ObjectId; // ref User
  type: DocumentType; // proposal or memory
  fileUrl: string; // Cloudinary URL
  fileName: string;
  status: DocumentStatus;

  aiSummary?: string; // LLM summary of the document (feature #37)
  aiMissingSections?: string[]; // flagged missing sections

  reviewNote?: string; // tutor's revision note if requested
  createdAt: Date;
  updatedAt: Date;
}

const submittedDocumentSchema = new Schema<ISubmittedDocument>(
  {
    work: { type: Schema.Types.ObjectId, ref: "Work", required: true, index: true },
    student: { type: Schema.Types.ObjectId, ref: "User", required: true },
    type: { type: String, enum: Object.values(DocumentType), required: true },
    fileUrl: { type: String, required: true },
    fileName: { type: String, required: true },
    status: { type: String, enum: Object.values(DocumentStatus), default: DocumentStatus.SUBMITTED },

    aiSummary: { type: String },
    aiMissingSections: { type: [String], default: undefined },

    reviewNote: { type: String },
  },
  { timestamps: true }
);

export const SubmittedDocument = mongoose.model<ISubmittedDocument>(
  "SubmittedDocument",
  submittedDocumentSchema
);
