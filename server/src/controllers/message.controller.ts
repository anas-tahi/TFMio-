import { Request, Response, NextFunction } from "express";
import { Message } from "../models/Message.js";
import { Work } from "../models/Work.js";
import { NotificationType } from "../types/index.js";
import { notify } from "../services/notification.service.js";

/** Confirms the logged-in user is either the student or tutor on this Work. */
async function getWorkIfAuthorized(workId: string, userId: string) {
  const work = await Work.findById(workId);
  if (!work) return null;
  const isParty = work.student.toString() === userId || work.tutor.toString() === userId;
  return isParty ? work : null;
}

/** Get the message history for a match (student and tutor only). */
export async function getMessages(req: Request, res: Response, next: NextFunction) {
  try {
    const { workId } = req.params;
    const work = await getWorkIfAuthorized(workId, req.user!.userId);
    if (!work) return res.status(403).json({ message: "No autorizado" });

    const messages = await Message.find({ work: workId })
      .populate("sender", "_id fullName")
      .sort({ createdAt: 1 });

    // Mark messages sent to me as read
    await Message.updateMany(
      { work: workId, recipient: req.user!.userId, read: false },
      { read: true }
    );

    return res.json({ messages });
  } catch (err) {
    next(err);
  }
}

/** Send a message in a match's conversation. */
export async function sendMessage(req: Request, res: Response, next: NextFunction) {
  try {
    const { workId } = req.params;
    const { text } = req.body as { text: string };

    if (!text || text.trim().length === 0) {
      return res.status(400).json({ message: "El mensaje no puede estar vacío" });
    }

    const work = await getWorkIfAuthorized(workId, req.user!.userId);
    if (!work) return res.status(403).json({ message: "No autorizado" });

    const recipient =
      work.student.toString() === req.user!.userId ? work.tutor : work.student;

    const message = await Message.create({
      work: workId,
      sender: req.user!.userId,
      recipient,
      text: text.trim(),
    });

    await notify({
      recipient,
      type: NotificationType.SYSTEM,
      title: "Nuevo mensaje",
      message: text.length > 60 ? text.slice(0, 60) + "…" : text,
      link: `/chat/${workId}`,
    });

    return res.status(201).json({ message });
  } catch (err) {
    next(err);
  }
}

/** List all matches (Works) the logged-in user is part of, for a chat inbox view. */
export async function getMyChats(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.userId;
    const works = await Work.find({ $or: [{ student: userId }, { tutor: userId }] })
      .populate("student", "fullName")
      .populate("tutor", "fullName")
      .populate("topic", "title")
      .sort({ updatedAt: -1 });

    // Attach unread count per chat
    const withUnread = await Promise.all(
      works.map(async (w) => {
        const unreadCount = await Message.countDocuments({
          work: w._id,
          recipient: userId,
          read: false,
        });
        return { work: w, unreadCount };
      })
    );

    return res.json({ chats: withUnread });
  } catch (err) {
    next(err);
  }
}