import mongoose, { Schema, Document, Types } from "mongoose";
import { NotificationType } from "../types/index.js";

export interface INotification extends Document {
  _id: Types.ObjectId;
  recipient: Types.ObjectId; // ref User
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  link?: string; // optional in-app link
  createdAt: Date;
  updatedAt: Date;
}

const notificationSchema = new Schema<INotification>(
  {
    recipient: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    type: { type: String, enum: Object.values(NotificationType), required: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    read: { type: Boolean, default: false, index: true },
    link: { type: String },
  },
  { timestamps: true }
);

export const Notification = mongoose.model<INotification>("Notification", notificationSchema);
