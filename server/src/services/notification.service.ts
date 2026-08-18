import { Notification } from "../models/Notification.js";
import { NotificationType } from "../types/index.js";
import { Types } from "mongoose";

interface CreateNotificationInput {
  recipient: Types.ObjectId | string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
}

export async function notify(input: CreateNotificationInput) {
  return Notification.create({
    recipient: input.recipient,
    type: input.type,
    title: input.title,
    message: input.message,
    link: input.link,
  });
}