import { Request, Response, NextFunction } from "express";
import { Notification } from "../models/Notification.js";

/** List the logged-in user's notifications, most recent first. */
export async function getMyNotifications(req: Request, res: Response, next: NextFunction) {
  try {
    const notifications = await Notification.find({ recipient: req.user!.userId })
      .sort({ createdAt: -1 })
      .limit(30);

    const unreadCount = await Notification.countDocuments({
      recipient: req.user!.userId,
      read: false,
    });

    return res.json({ notifications, unreadCount });
  } catch (err) {
    next(err);
  }
}

/** Mark a single notification as read. */
export async function markAsRead(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const notification = await Notification.findOneAndUpdate(
      { _id: id, recipient: req.user!.userId },
      { read: true },
      { new: true }
    );
    if (!notification) return res.status(404).json({ message: "No encontrada" });
    return res.json({ notification });
  } catch (err) {
    next(err);
  }
}

/** Mark all of the logged-in user's notifications as read at once. */
export async function markAllAsRead(req: Request, res: Response, next: NextFunction) {
  try {
    await Notification.updateMany(
      { recipient: req.user!.userId, read: false },
      { read: true }
    );
    return res.json({ success: true });
  } catch (err) {
    next(err);
  }
}