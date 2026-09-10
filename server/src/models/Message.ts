import mongoose, { Schema, Document, Types } from "mongoose";

export interface IMessage extends Document {
  _id: Types.ObjectId;
  work: Types.ObjectId; // ref Work — the match this conversation belongs to
  sender: Types.ObjectId; // ref User
  recipient: Types.ObjectId; // ref User
  text: string;
  read: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const messageSchema = new Schema<IMessage>(
  {
    work: { type: Schema.Types.ObjectId, ref: "Work", required: true, index: true },
    sender: { type: Schema.Types.ObjectId, ref: "User", required: true },
    recipient: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    text: { type: String, required: true, trim: true },
    read: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const Message = mongoose.model<IMessage>("Message", messageSchema);